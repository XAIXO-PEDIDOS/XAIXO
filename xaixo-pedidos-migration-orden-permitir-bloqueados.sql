-- ============================================================
-- Migración: permitir actualizar "orden" en pedidos bloqueados
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================
--
-- Motivo: el trigger bloquear_edicion_pedido_cerrado() rechaza
-- CUALQUIER update sobre un pedido en estado 'entregado' o
-- 'cancelado' (salvo el caso ya permitido de revertir a
-- 'confirmado'). Como el campo "orden" nunca puede escribirse en
-- esos pedidos, quedan siempre con orden = NULL. Y como la consulta
-- ordena "orden NULLS LAST", en cuanto se reordena manualmente
-- CUALQUIER pedido de un día que también tenga pedidos bloqueados,
-- los bloqueados (orden NULL) saltan siempre al final de la
-- columna, aunque visualmente estuvieran antes.
--
-- Esta migración añade un nuevo caso permitido: cambiar SOLO el
-- campo "orden" (posición visual, no es un dato de negocio) no
-- se bloquea aunque el pedido esté entregado/cancelado. El resto
-- de columnas siguen protegidas exactamente igual que antes.
-- ============================================================

CREATE OR REPLACE FUNCTION bloquear_edicion_pedido_cerrado()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- ── Caso permitido: revertir entregado → confirmado ──────────────────────
  -- Solo si ÚNICAMENTE cambia el campo estado (todos los demás iguales).
  IF OLD.estado = 'entregado' AND NEW.estado = 'confirmado' THEN
    IF  NEW.cliente           IS NOT DISTINCT FROM OLD.cliente
    AND NEW.direccion         IS NOT DISTINCT FROM OLD.direccion
    AND NEW.materiales        IS NOT DISTINCT FROM OLD.materiales
    AND NEW.tipo              IS NOT DISTINCT FROM OLD.tipo
    AND NEW.camion_id         IS NOT DISTINCT FROM OLD.camion_id
    AND NEW.fabrica_origen    IS NOT DISTINCT FROM OLD.fabrica_origen
    AND NEW.obra              IS NOT DISTINCT FROM OLD.obra
    AND NEW.fecha_entrega     IS NOT DISTINCT FROM OLD.fecha_entrega
    AND NEW.franja_horaria    IS NOT DISTINCT FROM OLD.franja_horaria
    AND NEW.notas             IS NOT DISTINCT FROM OLD.notas
    THEN
      RETURN NEW;
    END IF;
  END IF;

  -- ── Caso permitido (NUEVO): cambiar solo "orden" ──────────────────────────
  -- La posición visual dentro del día no es un dato de negocio, así que se
  -- permite tocarla aunque el pedido esté entregado/cancelado, siempre que
  -- ningún otro campo (incluido estado) cambie a la vez.
  IF  NEW.estado             IS NOT DISTINCT FROM OLD.estado
  AND NEW.cliente             IS NOT DISTINCT FROM OLD.cliente
  AND NEW.direccion           IS NOT DISTINCT FROM OLD.direccion
  AND NEW.materiales          IS NOT DISTINCT FROM OLD.materiales
  AND NEW.tipo                IS NOT DISTINCT FROM OLD.tipo
  AND NEW.camion_id           IS NOT DISTINCT FROM OLD.camion_id
  AND NEW.fabrica_origen      IS NOT DISTINCT FROM OLD.fabrica_origen
  AND NEW.obra                IS NOT DISTINCT FROM OLD.obra
  AND NEW.fecha_entrega       IS NOT DISTINCT FROM OLD.fecha_entrega
  AND NEW.franja_horaria      IS NOT DISTINCT FROM OLD.franja_horaria
  AND NEW.notas                IS NOT DISTINCT FROM OLD.notas
  THEN
    RETURN NEW;
  END IF;

  -- ── Caso bloqueado: cualquier otro cambio en pedido cerrado ───────────────
  IF OLD.estado IN ('entregado', 'cancelado') THEN
    RAISE EXCEPTION
      'No se puede modificar un pedido en estado "%". Solo se permite revertir "entregado" a "confirmado" o cambiar su orden visual.',
      OLD.estado;
  END IF;

  RETURN NEW;
END;
$$;

-- Verificación: el trigger que llama a esta función ya existe y no hay que
-- recrearlo. Solo se reemplaza la función.

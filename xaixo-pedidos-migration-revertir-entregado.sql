-- ============================================================
-- Migración: permitir revertir "entregado" → "confirmado"
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================
--
-- Cambia la función del trigger para que:
--   ✅ Permita  : OLD.estado = 'entregado' → NEW.estado = 'confirmado'
--                 SI Y SOLO SI ningún otro campo cambia.
--   ❌ Bloquee  : cualquier otra modificación cuando OLD.estado
--                 es 'entregado' o 'cancelado'.
-- ============================================================

CREATE OR REPLACE FUNCTION bloquear_edicion_pedido_cerrado()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- ── Caso permitido: revertir entregado → confirmado ──────────────────────
  -- Solo si ÚNICAMENTE cambia el campo estado (todos los demás iguales).
  -- IS NOT DISTINCT FROM maneja correctamente los NULL.
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
      RETURN NEW;  -- permitir la reversión
    END IF;
  END IF;

  -- ── Caso bloqueado: cualquier otro cambio en pedido cerrado ───────────────
  IF OLD.estado IN ('entregado', 'cancelado') THEN
    RAISE EXCEPTION
      'No se puede modificar un pedido en estado "%". Solo se permite revertir "entregado" a "confirmado".',
      OLD.estado;
  END IF;

  RETURN NEW;
END;
$$;

-- Verificación: el trigger ya existe y no hay que recrearlo.
-- Solo se reemplaza la función que llama.
-- Para confirmar que el trigger sigue activo:
-- SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'bloquear_edicion_pedido_cerrado';

-- ============================================================
-- Migración: proteger borrado de pedidos cerrados (entregado/cancelado)
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================
--
-- Crea un trigger BEFORE DELETE que bloquea el borrado
-- si el pedido está en estado "entregado" o "cancelado".
-- Los pedidos "pendiente" y "confirmado" se pueden borrar.
-- ============================================================

-- 1. Función del trigger
CREATE OR REPLACE FUNCTION proteger_borrado_pedido_cerrado()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.estado IN ('entregado', 'cancelado') THEN
    RAISE EXCEPTION
      'No se puede eliminar un pedido en estado "%". Solo se pueden eliminar pedidos en estado "pendiente" o "confirmado".',
      OLD.estado;
  END IF;
  RETURN OLD;
END;
$$;

-- 2. Trigger BEFORE DELETE (idempotente: borra el anterior si ya existía)
DROP TRIGGER IF EXISTS proteger_borrado_pedido_cerrado ON pedidos;
CREATE TRIGGER proteger_borrado_pedido_cerrado
  BEFORE DELETE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION proteger_borrado_pedido_cerrado();

-- Verificación:
-- SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'proteger_borrado_pedido_cerrado';

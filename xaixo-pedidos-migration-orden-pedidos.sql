-- ============================================================
-- Migración: columna "orden" para reordenar pedidos dentro de un día
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================
--
-- Guarda la posición manual de un pedido dentro de su día
-- (fecha_entrega). Los pedidos sin orden asignado (NULL) se siguen
-- ordenando por fecha de creación, como hasta ahora.
-- ============================================================

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS orden integer;

COMMENT ON COLUMN pedidos.orden IS
  'Posición manual dentro del día (fecha_entrega). NULL = sin ordenar manualmente, se usa created_at.';

CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_entrega_orden
  ON pedidos (fecha_entrega, orden);

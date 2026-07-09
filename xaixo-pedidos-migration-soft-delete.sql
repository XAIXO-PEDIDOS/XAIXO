-- ============================================================
-- Migración: borrado suave (soft delete) de pedidos
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================
--
-- Añade la columna deleted_at. Cuando no es NULL, el pedido
-- se considera "eliminado" (en la papelera) y las vistas
-- normales (calendario, tablero, lista) deben filtrarlo con
-- `deleted_at IS NULL`. Restaurar un pedido consiste en volver
-- a poner deleted_at = NULL.
-- ============================================================

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL DEFAULT NULL;

-- Índice para acelerar el filtrado de la papelera y de las vistas activas.
CREATE INDEX IF NOT EXISTS idx_pedidos_deleted_at ON pedidos (deleted_at);

-- Verificación:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'pedidos' AND column_name = 'deleted_at';

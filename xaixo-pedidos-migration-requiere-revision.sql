-- ============================================================
-- Migración: pedidos creados automáticamente por WhatsApp
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================
--
-- Añade requiere_revision para marcar pedidos creados por el
-- webhook de WhatsApp (interpretados por Claude) que todavía no
-- ha revisado una persona. Se pone a true al crearlos desde el
-- webhook, y vuelve a false en cuanto alguien los edita/guarda
-- manualmente desde la app.
-- ============================================================

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS requiere_revision boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_pedidos_requiere_revision
  ON pedidos (requiere_revision)
  WHERE requiere_revision = true;

-- Verificación:
-- SELECT id, cliente, requiere_revision FROM pedidos WHERE requiere_revision = true;

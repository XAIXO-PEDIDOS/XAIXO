-- ============================================================
-- Migración: simplificación de WhatsApp (sin IA, sin pedidos automáticos)
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================
--
-- 1. Tabla mensajes_whatsapp: guarda tal cual los mensajes recibidos por
--    el webhook de Twilio, sin interpretarlos. Un humano los revisa desde
--    la pantalla "Pedidos pendientes WhatsApp" y decide qué hacer.
-- 2. Se elimina requiere_revision de pedidos — ya no se crean pedidos
--    automáticamente desde WhatsApp, así que ese campo deja de tener uso.
-- ============================================================

CREATE TABLE IF NOT EXISTS mensajes_whatsapp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  texto text NOT NULL,
  telefono text,
  recibido_en timestamptz NOT NULL DEFAULT now(),
  leido boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_mensajes_whatsapp_leido_recibido
  ON mensajes_whatsapp (leido, recibido_en DESC);

-- RLS: mismo criterio que el resto de la app — cualquier usuario
-- autenticado puede leer/escribir (el INSERT del webhook usa la
-- Service Role Key, que ya se salta RLS; esta política es para que el
-- equipo pueda leer y marcar como leído desde la app).
ALTER TABLE mensajes_whatsapp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mensajes_whatsapp_authenticated_all" ON mensajes_whatsapp;
CREATE POLICY "mensajes_whatsapp_authenticated_all"
  ON mensajes_whatsapp
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ya no se usa: los pedidos ya no se crean automáticamente desde WhatsApp.
DROP INDEX IF EXISTS idx_pedidos_requiere_revision;
ALTER TABLE pedidos DROP COLUMN IF EXISTS requiere_revision;

-- Verificación:
-- SELECT * FROM mensajes_whatsapp ORDER BY recibido_en DESC;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'requiere_revision'; -- debería no devolver filas

-- ============================================================
-- Migración: tabla de clientes (importados desde Softek)
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================
--
-- Guarda el listado de clientes exportado desde Softek (Código,
-- Nombre, Nombre Comercial, Teléfono, Fax, Móvil, NIF). Se usa
-- como fuente adicional de sugerencias de autocompletado en el
-- campo "Cliente" del formulario de pedidos.
-- ============================================================

CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_softek text,
  nombre text NOT NULL,
  nombre_comercial text,
  telefono text,
  nif text,
  origen text NOT NULL DEFAULT 'softek',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Un mismo código Softek no puede repetirse. Una restricción UNIQUE
-- normal (sin condición parcial) ya permite varias filas con
-- codigo_softek NULL —en SQL, NULL nunca es "igual" a otro NULL—, así
-- que no hace falta un índice parcial. Esto es justo lo que necesita
-- el .upsert(...) con onConflict: "codigo_softek" desde Supabase para
-- detectar "duplicados omitidos" al reimportar el mismo Excel (un
-- índice único parcial no es inferible por ON CONFLICT sin repetir la
-- condición WHERE, que el cliente de Supabase no permite especificar).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clientes_codigo_softek_key'
  ) THEN
    ALTER TABLE clientes ADD CONSTRAINT clientes_codigo_softek_key UNIQUE (codigo_softek);
  END IF;
END $$;

-- Índices de apoyo para el autocompletado por nombre / nombre comercial.
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes (nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre_comercial ON clientes (nombre_comercial);

-- RLS: mismo criterio que el resto de la app — cualquier usuario
-- autenticado (todo el equipo comparte los mismos datos) puede
-- leer/escribir. Ajusta esta política si en tu proyecto pedidos/camiones
-- usan una política distinta.
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clientes_authenticated_all" ON clientes;
CREATE POLICY "clientes_authenticated_all"
  ON clientes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Verificación:
-- SELECT count(*) FROM clientes;
-- SELECT tablename, policyname FROM pg_policies WHERE tablename = 'clientes';

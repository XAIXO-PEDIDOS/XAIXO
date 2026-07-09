-- Migración: material/cantidad/unidad → materiales (jsonb)
-- Ejecutar en el SQL Editor de Supabase

-- 1. Añadir la nueva columna
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS materiales jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2. Migrar filas existentes que tengan material relleno
UPDATE pedidos
SET materiales = jsonb_build_array(
  jsonb_build_object(
    'material', COALESCE(material, ''),
    'cantidad', cantidad,
    'unidad',   COALESCE(unidad, 'toneladas')
  )
)
WHERE material IS NOT NULL AND material <> '';

-- 3. Quitar las columnas viejas
ALTER TABLE pedidos
  DROP COLUMN IF EXISTS material,
  DROP COLUMN IF EXISTS cantidad,
  DROP COLUMN IF EXISTS unidad;

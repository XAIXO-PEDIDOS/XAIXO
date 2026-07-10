"use client";

import { useRef, useState } from "react";
import { importarLoteClientes, type ClienteImportado } from "@/app/dashboard/clientesActions";

const TAMANO_LOTE = 500;

// Nombres de columna esperados en el Excel de Softek, tal como aparecen
// en la fila de encabezados (segunda fila del archivo — la primera es
// el título "Tabla Clientes" y se salta al leer).
const COLUMNAS = {
  codigo: "código",
  nombre: "nombre",
  nombreComercial: "nombre comercial",
  telefono: "teléfono",
  movil: "móvil",
  nif: "nif",
} as const;

type Fase =
  | { tipo: "idle" }
  | { tipo: "leyendo" }
  | { tipo: "importando"; loteActual: number; totalLotes: number; insertados: number; duplicados: number }
  | { tipo: "listo"; insertados: number; duplicados: number; sinNombre: number }
  | { tipo: "error"; mensaje: string };

function normalizar(texto: string): string {
  return texto.trim().toLowerCase();
}

function valorTexto(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function ImportarClientesModal() {
  const [abierto, setAbierto] = useState(false);
  const [fase, setFase] = useState<Fase>({ tipo: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  function abrir() {
    setAbierto(true);
    setFase({ tipo: "idle" });
  }

  function cerrar() {
    setAbierto(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFase({ tipo: "leyendo" });

    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const hoja = workbook.Sheets[workbook.SheetNames[0]];

      // La primera fila es el título ("Tabla Clientes"); la segunda son
      // los encabezados reales. range: 1 salta la primera fila y usa la
      // siguiente como cabecera de las columnas.
      const filas = XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, {
        range: 1,
        defval: null,
      });

      if (filas.length === 0) {
        setFase({ tipo: "error", mensaje: "El archivo no tiene filas de datos (¿está vacío o solo tiene el título?)." });
        return;
      }

      // Detectar automáticamente qué clave real corresponde a cada
      // columna esperada, comparando por nombre normalizado.
      const clavesDisponibles = Object.keys(filas[0]);
      const mapaClaves = new Map(clavesDisponibles.map((k) => [normalizar(k), k]));

      const claveCodigo = mapaClaves.get(COLUMNAS.codigo);
      const claveNombre = mapaClaves.get(COLUMNAS.nombre);
      const claveNombreComercial = mapaClaves.get(COLUMNAS.nombreComercial);
      const claveTelefono = mapaClaves.get(COLUMNAS.telefono);
      const claveMovil = mapaClaves.get(COLUMNAS.movil);
      const claveNif = mapaClaves.get(COLUMNAS.nif);

      if (!claveNombre) {
        setFase({
          tipo: "error",
          mensaje:
            'No se ha encontrado la columna "Nombre" en la fila de encabezados. Revisa que el archivo tenga el formato esperado (título en la fila 1, encabezados en la fila 2).',
        });
        return;
      }

      let sinNombre = 0;
      const clientes: ClienteImportado[] = [];

      for (const fila of filas) {
        const nombre = valorTexto(fila[claveNombre]);
        if (!nombre) {
          sinNombre += 1;
          continue;
        }
        const telefono = valorTexto(claveTelefono ? fila[claveTelefono] : null) ?? valorTexto(claveMovil ? fila[claveMovil] : null);
        clientes.push({
          codigo_softek: valorTexto(claveCodigo ? fila[claveCodigo] : null),
          nombre,
          nombre_comercial: valorTexto(claveNombreComercial ? fila[claveNombreComercial] : null),
          telefono,
          nif: valorTexto(claveNif ? fila[claveNif] : null),
        });
      }

      if (clientes.length === 0) {
        setFase({ tipo: "error", mensaje: "Ninguna fila tiene un nombre válido; no hay nada que importar." });
        return;
      }

      const lotes = chunk(clientes, TAMANO_LOTE);
      let insertados = 0;
      let duplicados = 0;

      for (let i = 0; i < lotes.length; i++) {
        setFase({ tipo: "importando", loteActual: i + 1, totalLotes: lotes.length, insertados, duplicados });
        const resultado = await importarLoteClientes(lotes[i]);
        if (resultado.error) {
          setFase({ tipo: "error", mensaje: `Fallo al importar el lote ${i + 1}/${lotes.length}: ${resultado.error}` });
          return;
        }
        insertados += resultado.insertados;
        duplicados += resultado.duplicados;
      }

      setFase({ tipo: "listo", insertados, duplicados, sinNombre });
    } catch (err) {
      setFase({
        tipo: "error",
        mensaje: err instanceof Error ? err.message : "Error inesperado leyendo el archivo.",
      });
    }
  }

  return (
    <>
      <button
        onClick={abrir}
        className="min-h-11 md:min-h-0 inline-flex items-center justify-center rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
      >
        Importar clientes
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/40" onClick={cerrar} />
          <div className="relative w-full max-w-md max-h-full md:max-h-[90vh] overflow-y-auto rounded-none md:rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">Importar clientes</h2>
              <button
                onClick={cerrar}
                className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors md:min-h-0 md:min-w-0"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-500">
                Sube el Excel (.xlsx) exportado desde Softek. Se detectan automáticamente las
                columnas Código, Nombre, Nombre Comercial, Teléfono, Fax, Móvil y NIF.
              </p>

              {(fase.tipo === "idle" || fase.tipo === "error") && (
                <>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={onFileSelected}
                    className="block w-full text-sm text-gray-700 file:mr-3 file:min-h-11 md:file:min-h-0 file:rounded-lg file:border-0 file:bg-marca file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-marca-hover file:cursor-pointer"
                  />
                  {fase.tipo === "error" && (
                    <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{fase.mensaje}</p>
                  )}
                </>
              )}

              {fase.tipo === "leyendo" && (
                <p className="text-sm text-gray-500">Leyendo el archivo…</p>
              )}

              {fase.tipo === "importando" && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    Importando lote {fase.loteActual} de {fase.totalLotes}…
                  </p>
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-marca transition-all"
                      style={{ width: `${(fase.loteActual / fase.totalLotes) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    {fase.insertados} importados · {fase.duplicados} duplicados hasta ahora
                  </p>
                </div>
              )}

              {fase.tipo === "listo" && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 space-y-1">
                  <p className="text-sm font-semibold text-green-800">
                    {fase.insertados} clientes importados, {fase.duplicados} duplicados omitidos
                  </p>
                  {fase.sinNombre > 0 && (
                    <p className="text-xs text-green-700">
                      {fase.sinNombre} fila{fase.sinNombre === 1 ? "" : "s"} sin nombre se {fase.sinNombre === 1 ? "omitió" : "omitieron"}.
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                {(fase.tipo === "listo" || fase.tipo === "error") && (
                  <button
                    onClick={() => {
                      setFase({ tipo: "idle" });
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                    className="flex-1 min-h-11 md:min-h-0 inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Importar otro archivo
                  </button>
                )}
                <button
                  onClick={cerrar}
                  className="flex-1 min-h-11 md:min-h-0 inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

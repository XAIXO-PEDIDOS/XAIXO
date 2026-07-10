"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ClienteImportado {
  codigo_softek: string | null;
  nombre: string;
  nombre_comercial: string | null;
  telefono: string | null;
  nif: string | null;
}

export interface ResultadoLoteImportacion {
  error: string | null;
  insertados: number;
  duplicados: number;
}

/**
 * Inserta un lote de clientes. Los que ya existan (mismo codigo_softek)
 * se omiten en silencio gracias a la restricción UNIQUE + ignoreDuplicates,
 * y se cuentan como "duplicados" en el resultado.
 */
export async function importarLoteClientes(
  lote: ClienteImportado[]
): Promise<ResultadoLoteImportacion> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado", insertados: 0, duplicados: 0 };

  if (lote.length === 0) return { error: null, insertados: 0, duplicados: 0 };

  const { data, error } = await supabase
    .from("clientes")
    .upsert(lote, { onConflict: "codigo_softek", ignoreDuplicates: true })
    .select("id");

  if (error) {
    console.error("[importarLoteClientes]", error);
    return { error: error.message, insertados: 0, duplicados: 0 };
  }

  const insertados = data?.length ?? 0;
  const duplicados = lote.length - insertados;

  revalidatePath("/dashboard");
  return { error: null, insertados, duplicados };
}

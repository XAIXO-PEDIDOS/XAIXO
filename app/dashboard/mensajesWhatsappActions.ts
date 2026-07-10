"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string | null };

export async function marcarMensajeLeido(id: string): Promise<ActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("mensajes_whatsapp")
    .update({ leido: true })
    .eq("id", id);

  if (error) {
    console.error("[marcarMensajeLeido]", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { error: null };
}

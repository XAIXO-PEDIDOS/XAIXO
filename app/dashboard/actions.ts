"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MaterialItem, TipoPedido, EstadoPedido } from "@/types/database";

export type ActionState = { error: string | null; success?: boolean };

function parseMateriales(formData: FormData): MaterialItem[] {
  try {
    const raw = formData.get("materiales") as string;
    const parsed = JSON.parse(raw || "[]") as MaterialItem[];
    return parsed.filter((m) => m.material?.trim());
  } catch {
    return [];
  }
}

export async function createPedido(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const tipo = formData.get("tipo") as TipoPedido;
  const materiales = parseMateriales(formData);

  if (materiales.length === 0) {
    return { error: "Añade al menos un material al pedido." };
  }

  const payload = {
    cliente: formData.get("cliente") as string,
    direccion: (formData.get("direccion") as string) || null,
    materiales,
    tipo,
    camion_id: tipo === "porte_propio" ? ((formData.get("camion_id") as string) || null) : null,
    fabrica_origen: tipo === "trailer_fabrica" ? ((formData.get("fabrica_origen") as string) || null) : null,
    obra: (formData.get("obra") as string) || null,
    fecha_entrega: formData.get("fecha_entrega") as string,
    franja_horaria: (formData.get("franja_horaria") as string) || null,
    estado: "pendiente" as EstadoPedido,
    notas: (formData.get("notas") as string) || null,
    creado_por: user.id,
  };

  const { error } = await supabase.from("pedidos").insert(payload);

  if (error) {
    console.error("[createPedido]", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function updatePedido(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const id = formData.get("id") as string;
  const tipo = formData.get("tipo") as TipoPedido;
  const materiales = parseMateriales(formData);

  if (materiales.length === 0) {
    return { error: "Añade al menos un material al pedido." };
  }

  const payload = {
    cliente: formData.get("cliente") as string,
    direccion: (formData.get("direccion") as string) || null,
    materiales,
    tipo,
    camion_id: tipo === "porte_propio" ? ((formData.get("camion_id") as string) || null) : null,
    fabrica_origen: tipo === "trailer_fabrica" ? ((formData.get("fabrica_origen") as string) || null) : null,
    obra: (formData.get("obra") as string) || null,
    fecha_entrega: formData.get("fecha_entrega") as string,
    franja_horaria: (formData.get("franja_horaria") as string) || null,
    estado: formData.get("estado") as EstadoPedido,
    notas: (formData.get("notas") as string) || null,
  };

  const { error } = await supabase.from("pedidos").update(payload).eq("id", id);

  if (error) {
    console.error("[updatePedido]", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function actualizarCamion(
  pedidoId: string,
  nuevoCamionId: string | null
): Promise<ActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("pedidos")
    .update({ camion_id: nuevoCamionId })
    .eq("id", pedidoId);

  if (error) {
    console.error("[actualizarCamion]", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function actualizarFechaEntrega(
  pedidoId: string,
  nuevaFecha: string
): Promise<ActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("pedidos")
    .update({ fecha_entrega: nuevaFecha })
    .eq("id", pedidoId);

  if (error) {
    console.error("[actualizarFechaEntrega]", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function actualizarOrdenPedidos(
  actualizaciones: { id: string; orden: number }[]
): Promise<ActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const resultados = await Promise.all(
    actualizaciones.map(({ id, orden }) =>
      supabase.from("pedidos").update({ orden }).eq("id", id)
    )
  );

  const conError = resultados.find((r) => r.error);
  if (conError?.error) {
    console.error("[actualizarOrdenPedidos]", conError.error);
    return { error: conError.error.message };
  }

  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function marcarEntregado(pedidoId: string): Promise<ActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("pedidos")
    .update({ estado: "entregado" as EstadoPedido })
    .eq("id", pedidoId);

  if (error) {
    console.error("[marcarEntregado]", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function revertirEntregado(pedidoId: string): Promise<ActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("pedidos")
    .update({ estado: "confirmado" as EstadoPedido })
    .eq("id", pedidoId)
    .eq("estado", "entregado");

  if (error) {
    console.error("[revertirEntregado]", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function deletePedido(id: string): Promise<ActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // Borrado suave: se marca deleted_at en vez de eliminar la fila.
  // El pedido pasa a la papelera y puede restaurarse.
  const { error } = await supabase
    .from("pedidos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .in("estado", ["pendiente", "confirmado"])
    .is("deleted_at", null);

  if (error) {
    console.error("[deletePedido]", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { error: null };
}

export async function restaurarPedido(id: string): Promise<ActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("pedidos")
    .update({ deleted_at: null })
    .eq("id", id);

  if (error) {
    console.error("[restaurarPedido]", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { error: null };
}

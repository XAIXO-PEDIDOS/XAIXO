import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { createServiceClient } from "@/lib/supabase/service";
import { interpretarPedido } from "@/lib/whatsapp/interpretarPedido";
import { toDateStr } from "@/lib/semana";
import type { EstadoPedido, TipoPedido } from "@/types/database";

function respuestaTwiML(mensaje: string) {
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(mensaje);
  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = String(value);
  });

  // Verificar que la petición viene realmente de Twilio (y no de cualquiera
  // que conozca esta URL pública) antes de crear nada en la base de datos.
  const firma = request.headers.get("x-twilio-signature") ?? "";
  const firmaValida = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    firma,
    request.url,
    params
  );

  if (!firmaValida) {
    console.error("[whatsapp webhook] Firma de Twilio inválida");
    return new NextResponse("Firma inválida", { status: 403 });
  }

  const mensaje = params["Body"]?.trim();
  const remitente = params["From"];

  if (!mensaje) {
    return respuestaTwiML("No he recibido ningún texto en tu mensaje.");
  }

  let extraido;
  try {
    extraido = await interpretarPedido(mensaje, new Date());
  } catch (err) {
    console.error("[whatsapp webhook] Error interpretando el mensaje con Claude:", err);
    return respuestaTwiML(
      "Hubo un error interpretando tu mensaje, por favor contacta directamente con la oficina."
    );
  }

  if (!extraido.es_pedido) {
    return respuestaTwiML(
      "No he podido interpretar esto como un pedido, por favor contacta directamente con la oficina."
    );
  }

  // El pedido queda marcado como pendiente de revisión, así que si algún
  // campo obligatorio no vino en el mensaje, se rellena con un valor
  // provisional en vez de fallar — el equipo lo corrige al revisarlo.
  const notas = [
    extraido.notas,
    `--- Mensaje original de WhatsApp (${remitente ?? "número desconocido"}) ---`,
    mensaje,
  ]
    .filter(Boolean)
    .join("\n\n");

  const supabase = createServiceClient();
  const { error } = await supabase.from("pedidos").insert({
    cliente: extraido.cliente?.trim() || "Cliente sin identificar (WhatsApp)",
    direccion: extraido.direccion,
    obra: extraido.obra,
    fecha_entrega: extraido.fecha_entrega ?? toDateStr(new Date()),
    materiales: extraido.materiales,
    tipo: "porte_propio" as TipoPedido,
    estado: "pendiente" as EstadoPedido,
    requiere_revision: true,
    camion_id: null,
    notas,
  });

  if (error) {
    console.error("[whatsapp webhook] Error insertando el pedido:", error);
    return respuestaTwiML(
      "Hubo un error registrando el pedido, por favor contacta directamente con la oficina."
    );
  }

  return respuestaTwiML("✅ Pedido recibido, pendiente de revisión por el equipo.");
}

import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { createServiceClient } from "@/lib/supabase/service";

function respuestaTwiML(mensaje: string) {
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(mensaje);
  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(request: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    throw new Error("Falta la variable de entorno TWILIO_AUTH_TOKEN");
  }

  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = String(value);
  });

  // Verificar que la petición viene realmente de Twilio (y no de cualquiera
  // que conozca esta URL pública) antes de guardar nada.
  const firma = request.headers.get("x-twilio-signature") ?? "";
  const firmaValida = twilio.validateRequest(authToken, firma, request.url, params);

  if (!firmaValida) {
    console.error("[whatsapp webhook] Firma de Twilio inválida");
    return new NextResponse("Firma inválida", { status: 403 });
  }

  const mensaje = params["Body"]?.trim();
  const remitente = params["From"] || null;

  if (!mensaje) {
    return respuestaTwiML("No he recibido ningún texto en tu mensaje.");
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("mensajes_whatsapp").insert({
    texto: mensaje,
    telefono: remitente,
  });

  if (error) {
    console.error("[whatsapp webhook] Error guardando el mensaje:", error);
    return respuestaTwiML(
      "Hubo un error registrando tu mensaje, por favor contacta directamente con la oficina."
    );
  }

  return respuestaTwiML("✅ Mensaje recibido, el equipo lo revisará en breve.");
}

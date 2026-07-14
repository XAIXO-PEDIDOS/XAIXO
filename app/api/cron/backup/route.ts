import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/service";
import { construirWorkbookBackup, nombreArchivoBackup } from "@/lib/backup";

const DESTINATARIO = "javierxaixo@gmail.com";
const REMITENTE = "XAIXO Pedidos <onboarding@resend.dev>";

// Ruta invocada semanalmente por Vercel Cron (ver vercel.json). Vercel añade
// automáticamente la cabecera `Authorization: Bearer $CRON_SECRET` cuando la
// variable de entorno CRON_SECRET está definida en el proyecto — así nos
// aseguramos de que nadie más puede disparar el envío llamando a esta URL.
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    throw new Error("Falta la variable de entorno CRON_SECRET");
  }

  const autorizacion = request.headers.get("authorization");
  if (autorizacion !== `Bearer ${cronSecret}`) {
    console.error("[cron backup] Autorización inválida");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error("Falta la variable de entorno RESEND_API_KEY");
  }

  const supabase = createServiceClient();
  const workbook = await construirWorkbookBackup(supabase);
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  const fechaLabel = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({
    from: REMITENTE,
    to: DESTINATARIO,
    subject: `Backup semanal - XAIXO Pedidos - ${fechaLabel}`,
    html: `<p>Backup semanal automático de XAIXO Pedidos adjunto (hojas: Pedidos, Clientes, Productos).</p>`,
    attachments: [
      {
        filename: nombreArchivoBackup(),
        content: buffer,
      },
    ],
  });

  if (error) {
    console.error("[cron backup] Error enviando el email:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

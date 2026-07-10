import Anthropic from "@anthropic-ai/sdk";
import type { MaterialItem } from "@/types/database";
import { toDateStr } from "@/lib/semana";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface PedidoExtraido {
  es_pedido: boolean;
  cliente: string | null;
  direccion: string | null;
  obra: string | null;
  fecha_entrega: string | null;
  materiales: MaterialItem[];
  notas: string | null;
}

// Esquema de salida estructurada: garantiza que Claude devuelva JSON válido
// con esta forma exacta (sin texto extra, sin fences de markdown), en vez de
// depender de que siga al pie de la letra un "responde solo con JSON".
const PEDIDO_SCHEMA = {
  type: "object",
  properties: {
    es_pedido: {
      type: "boolean",
      description:
        "true si el mensaje describe un pedido de materiales; false si es un saludo, una pregunta, spam, o cualquier otra cosa que no sea un pedido.",
    },
    cliente: {
      type: ["string", "null"],
      description: "Nombre del cliente o empresa que hace el pedido, si se menciona.",
    },
    direccion: {
      type: ["string", "null"],
      description: "Dirección de entrega, si se menciona.",
    },
    obra: {
      type: ["string", "null"],
      description: "Nombre o referencia de la obra, si se menciona.",
    },
    fecha_entrega: {
      type: ["string", "null"],
      description:
        "Fecha de entrega en formato YYYY-MM-DD, interpretando expresiones relativas (mañana, el lunes, etc.) contra la fecha de hoy indicada en las instrucciones. null si no se menciona ninguna fecha.",
    },
    materiales: {
      type: "array",
      description: "Lista de materiales pedidos. Vacía si no se especifica ninguno.",
      items: {
        type: "object",
        properties: {
          material: { type: "string", description: "Nombre del material o producto." },
          cantidad: { type: ["number", "null"], description: "Cantidad pedida, si se menciona." },
          unidad: {
            type: ["string", "null"],
            description: "Unidad de la cantidad (ud, t, m2, sacos, big bag, etc.), si se menciona.",
          },
        },
        required: ["material", "cantidad", "unidad"],
        additionalProperties: false,
      },
    },
    notas: {
      type: ["string", "null"],
      description: "Cualquier información relevante del mensaje que no encaje en los campos anteriores.",
    },
  },
  required: ["es_pedido", "cliente", "direccion", "obra", "fecha_entrega", "materiales", "notas"],
  additionalProperties: false,
} as const;

/**
 * Interpreta un mensaje de WhatsApp con Claude y devuelve los datos
 * estructurados del pedido, o es_pedido=false si el mensaje no describe un
 * pedido real.
 */
export async function interpretarPedido(
  mensaje: string,
  fechaReferencia: Date
): Promise<PedidoExtraido> {
  const fechaHoy = toDateStr(fechaReferencia);
  const diaSemana = fechaReferencia.toLocaleDateString("es-ES", { weekday: "long" });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    thinking: { type: "disabled" },
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: PEDIDO_SCHEMA },
    },
    system: `Eres un asistente que interpreta mensajes de WhatsApp de clientes de una empresa de materiales de construcción, para extraer pedidos.

Hoy es ${fechaHoy} (${diaSemana}). Usa esta fecha como referencia para interpretar cualquier fecha relativa mencionada en el mensaje (ej. "mañana", "el lunes que viene", "el 15").

Si el mensaje es un saludo, una pregunta, spam, o no contiene información suficiente para tratarse de un pedido real, responde con es_pedido=false y deja el resto de los campos en null o vacío.

Si el mensaje sí describe un pedido, extrae la información con es_pedido=true. No inventes datos que no estén en el mensaje: si algo no se menciona, deja ese campo en null.`,
    messages: [{ role: "user", content: mensaje }],
  });

  const bloqueTexto = response.content.find((b) => b.type === "text");
  if (!bloqueTexto || bloqueTexto.type !== "text") {
    throw new Error("Claude no devolvió un bloque de texto con el JSON esperado.");
  }

  return JSON.parse(bloqueTexto.text) as PedidoExtraido;
}

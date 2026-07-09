import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Pedido, MaterialItem } from "@/types/database";
import PrintControls from "./PrintControls";

// ── CSS inyectado en <head> ──────────────────────────────────────────────────

const ESTILOS = `
  body { background: white !important; font-family: Arial, Helvetica, sans-serif; }

  @page {
    size: A4 portrait;
    margin: 1.2cm 1.5cm;
  }

  @media print {
    .no-print { display: none !important; }
    .pagina { padding: 0 !important; box-shadow: none !important; }
  }

  .pagina {
    background: white;
    max-width: 18cm;
    margin: 0 auto;
    padding: 1cm;
    font-size: 10pt;
    color: #000;
    line-height: 1.45;
  }

  /* ── Cabecera del documento ── */
  .doc-cabecera {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 0.3cm;
    border-bottom: 2px solid #000;
    margin-bottom: 0.25cm;
  }
  .doc-logo { height: 1cm; width: auto; }
  .doc-meta { text-align: right; font-size: 8pt; color: #555; line-height: 1.7; }

  /* ── Título ── */
  .doc-titulo {
    font-size: 17pt;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0.2cm 0 0.35cm 0;
  }

  /* ── Tabla de datos del pedido ── */
  .datos-tabla {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 0.35cm;
    font-size: 10pt;
  }
  .datos-tabla td {
    padding: 0.09cm 0;
    vertical-align: top;
    border-bottom: 1px solid #e5e7eb;
  }
  .datos-tabla td:first-child {
    width: 30%;
    font-weight: 600;
    color: #333;
    padding-right: 0.3cm;
    white-space: nowrap;
  }

  /* ── Sección materiales ── */
  .mat-titulo {
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #555;
    padding-bottom: 0.1cm;
    border-bottom: 1.5px solid #000;
    margin-bottom: 0;
  }
  .mat-tabla {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 0.35cm;
    font-size: 10pt;
  }
  .mat-tabla th {
    text-align: left;
    font-size: 7.5pt;
    font-weight: 600;
    color: #666;
    padding: 0.08cm 0.2cm 0.08cm 0;
    border-bottom: 1px solid #ccc;
  }
  .mat-tabla th.r { text-align: right; }
  .mat-tabla th.c { text-align: center; width: 0.9cm; }
  .mat-tabla td {
    padding: 0.11cm 0.2cm 0.11cm 0;
    border-bottom: 1px solid #eee;
    font-size: 10pt;
  }
  .mat-tabla td.r { text-align: right; font-weight: 600; }
  .mat-tabla td.c { text-align: center; }
  .check-cuadro {
    display: inline-block;
    width: 0.45cm;
    height: 0.45cm;
    border: 1.5px solid #000;
    border-radius: 2px;
    vertical-align: middle;
  }

  /* ── Firma ── */
  .firma-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1cm;
    padding-top: 0.35cm;
    border-top: 1.5px solid #000;
    margin-top: 0.1cm;
  }
  .firma-etiqueta { font-size: 9pt; font-weight: 600; margin-bottom: 0.6cm; }
  .firma-linea {
    border-bottom: 1.5px solid #000;
    margin-bottom: 0.12cm;
    height: 0.55cm;
  }
  .firma-sub { font-size: 7.5pt; color: #666; }

  /* ── Línea de corte ── */
  .linea-corte {
    display: flex;
    align-items: center;
    gap: 0.4cm;
    margin: 0.45cm 0;
    color: #bbb;
    font-size: 8pt;
    letter-spacing: 0.06em;
    user-select: none;
  }
  .linea-corte::before, .linea-corte::after {
    content: '';
    flex: 1;
    border-top: 1.5px dashed #ccc;
  }
`;

// ── Componente de una copia ──────────────────────────────────────────────────

function Copia({ pedido, rotulo }: { pedido: Pedido; rotulo: string }) {
  const esTrailer = pedido.tipo === "trailer_fabrica";
  const materiales: MaterialItem[] = pedido.materiales ?? [];

  const fechaEntrega = new Date(pedido.fecha_entrega + "T00:00:00").toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const hoy = new Date().toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      {/* Cabecera */}
      <div className="doc-cabecera">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-xaixo.png" alt="XAIXO" className="doc-logo" />
        <div className="doc-meta">
          Impreso: {hoy}<br />
          Copia: <strong>{rotulo}</strong>
        </div>
      </div>

      {/* Título */}
      <div className="doc-titulo">Verificación de carga</div>

      {/* Datos */}
      <table className="datos-tabla">
        <tbody>
          <tr>
            <td>Cliente</td>
            <td><strong>{pedido.cliente}</strong></td>
          </tr>

          {(pedido.direccion || pedido.obra) && (
            <tr>
              <td>Dirección / Obra</td>
              <td>{pedido.direccion ?? pedido.obra}</td>
            </tr>
          )}

          <tr>
            <td>Fecha de entrega</td>
            <td>
              <strong>{fechaEntrega}</strong>
              {pedido.franja_horaria && (
                <span style={{ fontWeight: "normal", color: "#555" }}>
                  {" "}·{" "}{pedido.franja_horaria}
                </span>
              )}
            </td>
          </tr>

          {esTrailer ? (
            pedido.fabrica_origen && (
              <tr>
                <td>Fábrica origen</td>
                <td>{pedido.fabrica_origen}</td>
              </tr>
            )
          ) : (
            pedido.camiones ? (
              <tr>
                <td>Camión / Chofer</td>
                <td>
                  {pedido.camiones.nombre}
                  {pedido.camiones.chofer_habitual && (
                    <span style={{ color: "#555" }}>
                      {" "}·{" "}{pedido.camiones.chofer_habitual}
                    </span>
                  )}
                </td>
              </tr>
            ) : (
              <tr>
                <td>Camión</td>
                <td style={{ color: "#888", fontStyle: "italic" }}>Sin asignar</td>
              </tr>
            )
          )}

          {pedido.notas && (
            <tr>
              <td>Notas</td>
              <td style={{ fontStyle: "italic" }}>{pedido.notas}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Materiales */}
      <div className="mat-titulo">Materiales a cargar</div>
      <table className="mat-tabla">
        <thead>
          <tr>
            <th>Material</th>
            <th className="r">Cantidad</th>
            <th className="r">Unidad</th>
            <th className="c">✓</th>
          </tr>
        </thead>
        <tbody>
          {materiales.length > 0 ? (
            materiales.map((m, i) => (
              <tr key={i}>
                <td>{m.material}</td>
                <td className="r">{m.cantidad ?? "—"}</td>
                <td className="r">{m.unidad || ""}</td>
                <td className="c">
                  <span className="check-cuadro" />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={4}
                style={{ color: "#999", fontStyle: "italic", padding: "0.25cm 0" }}
              >
                Sin materiales especificados
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Firma del operario */}
      <div className="firma-grid">
        <div>
          <div className="firma-etiqueta">Operario que carga el camión:</div>
          <div className="firma-linea" />
          <div className="firma-sub">Nombre legible</div>
        </div>
        <div>
          <div className="firma-etiqueta">Firma:</div>
          <div className="firma-linea" />
          <div className="firma-sub">Carga verificada y conforme</div>
        </div>
      </div>
    </div>
  );
}

// ── Página ───────────────────────────────────────────────────────────────────

export default async function ImprimirPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pedido, error } = await supabase
    .from("pedidos")
    .select("*, camiones(*)")
    .eq("id", params.id)
    .single();

  if (error || !pedido) notFound();

  const p = pedido as Pedido;

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: ESTILOS }} />
      <PrintControls cliente={p.cliente} />
      <div className="pagina">
        <Copia pedido={p} rotulo="ALMACÉN" />
        <div className="linea-corte">✂ &nbsp; CORTAR &nbsp; ✂</div>
        <Copia pedido={p} rotulo="CAMIÓN" />
      </div>
    </>
  );
}

interface Props {
  icono: string;
  etiqueta: string;
  valor: string;
  acento?: string;
}

// Contrato de "stat tile": etiqueta + valor grande — el acento de marca vive
// en la franja superior y el chip del icono, nunca en el propio número
// (el valor se queda en tinta neutra para que siga siendo legible).
export default function StatTile({ icono, etiqueta, valor, acento = "#E5231B" }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: acento }} />
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
          style={{ backgroundColor: `${acento}1A`, color: acento }}
        >
          {icono}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm text-gray-500">{etiqueta}</p>
          <p className="mt-0.5 text-2xl font-semibold text-gray-900 md:text-3xl">{valor}</p>
        </div>
      </div>
    </div>
  );
}

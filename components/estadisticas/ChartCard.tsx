interface Props {
  titulo: string;
  subtitulo?: string;
  className?: string;
  children: React.ReactNode;
}

export default function ChartCard({ titulo, subtitulo, className = "", children }: Props) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6 ${className}`}>
      <h3 className="text-base font-semibold text-gray-900">{titulo}</h3>
      {subtitulo && <p className="mt-0.5 text-sm text-gray-500">{subtitulo}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

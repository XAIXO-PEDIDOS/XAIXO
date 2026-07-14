// Enlace simple, no botón con JS: el navegador gestiona la descarga del
// adjunto directamente a partir de la cabecera Content-Disposition que
// devuelve /api/backup, sin pasos intermedios ni estado de carga que gestionar.
export default function BackupButton() {
  return (
    <a
      href="/api/backup"
      download
      className="min-h-11 md:min-h-0 inline-flex items-center justify-center rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
      title="Descargar backup en Excel (Pedidos, Clientes, Productos)"
    >
      ⬇️ Backup
    </a>
  );
}

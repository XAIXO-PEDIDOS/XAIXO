export function formatTiempoRelativo(iso: string): string {
  const fecha = new Date(iso);
  const segundos = Math.floor((Date.now() - fecha.getTime()) / 1000);

  if (segundos < 60) return "hace un momento";

  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} minuto${minutos === 1 ? "" : "s"}`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} hora${horas === 1 ? "" : "s"}`;

  const dias = Math.floor(horas / 24);
  if (dias < 30) return `hace ${dias} día${dias === 1 ? "" : "s"}`;

  const meses = Math.floor(dias / 30);
  if (meses < 12) return `hace ${meses} ${meses === 1 ? "mes" : "meses"}`;

  const anios = Math.floor(dias / 365);
  return `hace ${anios} año${anios === 1 ? "" : "s"}`;
}

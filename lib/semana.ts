export function lunesDeSemana(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  // 0=Dom → -6, 1=Lun → 0, 2=Mar → -1 …
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
}

export function addDias(date: Date, dias: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + dias);
  return d;
}

/** YYYY-MM-DD en zona local */
export function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Devuelve los 5 días (Lun–Vie) de la semana que empieza en `lunes` */
export function diasLaborables(lunes: Date): Date[] {
  return [0, 1, 2, 3, 4].map((i) => addDias(lunes, i));
}

export function formatDiaCorto(date: Date): string {
  return date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" });
}

export function formatRangoSemana(lunes: Date): string {
  const viernes = addDias(lunes, 4);
  const mismoMes = lunes.getMonth() === viernes.getMonth();
  if (mismoMes) {
    return `${lunes.getDate()} – ${viernes.getDate()} ${viernes.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    })}`;
  }
  return `${lunes.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} – ${viernes.toLocaleDateString(
    "es-ES",
    { day: "numeric", month: "short", year: "numeric" }
  )}`;
}

export function esHoy(date: Date): boolean {
  return toDateStr(date) === toDateStr(new Date());
}

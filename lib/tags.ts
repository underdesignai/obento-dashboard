export type TagKey =
  | "vip" | "frecuente" | "nuevo" | "noshow-recurrente" | "alto-consumo" | "bajo-consumo"
  | "conflictivo" | "exigente" | "premium" | "influencer" | "empresa" | "eventos";

export const TAG_META: Record<TagKey, { label: string; labelEn: string; emoji: string; color: string; bg: string; auto: boolean }> = {
  "vip":              { label: "VIP",               labelEn: "VIP",             emoji: "⭐", color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  auto: true  },
  "frecuente":        { label: "Frecuente",          labelEn: "Frequent",        emoji: "🔄", color: "#4ade80", bg: "rgba(74,222,128,0.12)",  auto: true  },
  "nuevo":            { label: "Nuevo",              labelEn: "New",             emoji: "🟡", color: "#facc15", bg: "rgba(250,204,21,0.12)",  auto: true  },
  "noshow-recurrente":{ label: "No Show Recurrente", labelEn: "Recurring No Show",emoji:"👻", color: "#ef4444", bg: "rgba(239,68,68,0.12)",   auto: true  },
  "alto-consumo":     { label: "Alto Consumo",       labelEn: "High Spend",      emoji: "💎", color: "#a78bfa", bg: "rgba(167,139,250,0.12)", auto: true  },
  "bajo-consumo":     { label: "Bajo Consumo",       labelEn: "Low Spend",       emoji: "📉", color: "#94a3b8", bg: "rgba(148,163,184,0.12)", auto: true  },
  "conflictivo":      { label: "Conflictivo",        labelEn: "Difficult",       emoji: "🔴", color: "#f87171", bg: "rgba(248,113,113,0.12)", auto: false },
  "exigente":         { label: "Exigente",           labelEn: "Demanding",       emoji: "🎯", color: "#fb923c", bg: "rgba(251,146,60,0.12)",  auto: false },
  "premium":          { label: "Premium",            labelEn: "Premium",         emoji: "👑", color: "#c9a84c", bg: "rgba(201,168,76,0.12)",  auto: false },
  "influencer":       { label: "Influencer",         labelEn: "Influencer",      emoji: "📸", color: "#f472b6", bg: "rgba(244,114,182,0.12)", auto: false },
  "empresa":          { label: "Empresa",            labelEn: "Business",        emoji: "🔵", color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  auto: false },
  "eventos":          { label: "Eventos",            labelEn: "Events",          emoji: "🎉", color: "#34d399", bg: "rgba(52,211,153,0.12)",  auto: false },
};

export const AUTO_TAGS: TagKey[] = ["vip","frecuente","nuevo","noshow-recurrente","alto-consumo","bajo-consumo"];
export const MANUAL_TAGS: TagKey[] = ["conflictivo","exigente","premium","influencer","empresa","eventos"];

export function calcAutoTags(stats: {
  totalReservas: number; noShows: number; pctAsistencia: number; canceladas: number; personas?: number;
}): TagKey[] {
  const tags: TagKey[] = [];
  const { totalReservas, noShows, pctAsistencia, canceladas } = stats;
  const avgPersonas = stats.personas ?? 0;

  if (pctAsistencia >= 90 && totalReservas >= 5) tags.push("vip");
  if (totalReservas >= 6 && pctAsistencia >= 70)  tags.push("frecuente");
  if (totalReservas <= 2)                          tags.push("nuevo");
  if (noShows >= 2)                                tags.push("noshow-recurrente");
  if (avgPersonas >= 5 || totalReservas >= 10)     tags.push("alto-consumo");
  if (totalReservas >= 3 && totalReservas <= 5 && pctAsistencia < 60) tags.push("bajo-consumo");

  return tags;
}

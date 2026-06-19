"use client";

import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { UserRound, RefreshCw, Download, ChevronDown, ChevronUp, Phone, Mail, Users, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useAdminLanguage } from "@/lib/LanguageContext";
import { TAG_META, AUTO_TAGS, MANUAL_TAGS, calcAutoTags, type TagKey } from "@/lib/tags";

const ESTADOS: Record<string, { color: string; label: string; emoji: string }> = {
  pendiente:               { color: "#fbbf24", label: "Pendiente",               emoji: "⏳" },
  confirmada:              { color: "#4ade80", label: "Confirmada",               emoji: "✅" },
  llego:                   { color: "#60a5fa", label: "Llegó",                   emoji: "🏠" },
  "no-show":               { color: "#ef4444", label: "No Show",                 emoji: "👻" },
  "cancelada-cliente":     { color: "#9ca3af", label: "Cancelada (cliente)",     emoji: "❌" },
  "cancelada-restaurante": { color: "#f87171", label: "Cancelada (restaurante)", emoji: "🚫" },
  cancelada:               { color: "#9ca3af", label: "Cancelada",               emoji: "❌" },
};

type Reserva = { id: number; fecha: string; personas: number; seccion: string; estado: string; mensaje?: string | null };
type Lead = {
  nombre: string; email: string; telefono?: string;
  totalReservas: number; canceladas: number; noShows: number; pctAsistencia: number;
  ultimaReserva: string | null; secciones: string[];
};

const PAGE_SIZE = 25;

function HistorialRow({ r, lang }: { r: Reserva; lang: string }) {
  const est = ESTADOS[r.estado] ?? ESTADOS["pendiente"];
  const d = new Date(r.fecha);
  const fecha = d.toLocaleDateString(lang === "es" ? "es-ES" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
  const hora  = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="history-row">
      <span className="h-fecha">{fecha} · {hora}</span>
      <span className="h-personas"><Users size={10} /> {r.personas}p</span>
      <span className={r.seccion === "sushi" ? "badge-sushi" : "badge-mex"}>{r.seccion === "sushi" ? "🍣" : "🌮"}</span>
      <span className="h-msg">{r.mensaje ?? ""}</span>
      <span style={{ color: est.color, fontSize: 17, fontWeight: 700, whiteSpace: "nowrap" }}>{est.emoji} {est.label}</span>
    </div>
  );
}

function LeadExpanded({ lead, lang }: { lead: Lead; lang: string }) {
  const [reservas, setReservas] = useState<Reserva[] | null>(null);
  const [manualTags, setManualTags] = useState<TagKey[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);

  useEffect(() => {
    const param = lead.email
      ? `email=${encodeURIComponent(lead.email)}`
      : `nombre=${encodeURIComponent(lead.nombre)}`;
    fetch(`/api/admin/leads/historial?${param}`).then(r => r.json()).then(setReservas).catch(() => setReservas([]));
    fetch(`/api/admin/tags?${param}`).then(r => r.json()).then(setManualTags).catch(() => {});
  }, [lead.email, lead.nombre]);

  const toggleTag = async (tag: TagKey) => {
    setTagsLoading(true);
    const has = manualTags.includes(tag);
    await fetch("/api/admin/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: lead.email, nombre: lead.nombre, tag, action: has ? "remove" : "add" }),
    });
    setManualTags(prev => has ? prev.filter(t => t !== tag) : [...prev, tag]);
    setTagsLoading(false);
  };

  const autoTags = calcAutoTags({ totalReservas: lead.totalReservas, noShows: lead.noShows, pctAsistencia: lead.pctAsistencia, canceladas: lead.canceladas });
  const allActiveTags = [...new Set([...autoTags, ...manualTags])];

  return (
    <div className="lead-history">
      {/* Tags */}
      <div style={{ marginBottom: 12 }}>
        <p className="lead-history-title">Tags</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {allActiveTags.length === 0
            ? <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Sin tags</span>
            : allActiveTags.map(tag => {
                const m = TAG_META[tag];
                return <span key={tag} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: m.bg, color: m.color, fontWeight: 700, border: `1px solid ${m.color}40` }}>{m.emoji} {m.label}</span>;
              })
          }
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {MANUAL_TAGS.map(tag => {
            const m = TAG_META[tag];
            const active = manualTags.includes(tag);
            return (
              <button key={tag} onClick={() => toggleTag(tag)} disabled={tagsLoading}
                style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, border: `1px solid ${active ? m.color : "rgba(255,255,255,0.1)"}`, background: active ? m.bg : "transparent", color: active ? m.color : "rgba(255,255,255,0.3)", cursor: "pointer", fontWeight: 600, opacity: tagsLoading ? 0.6 : 1 }}>
                {m.emoji} {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="lead-history-title">Historial de reservas</p>
      {reservas === null ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
          <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Cargando...
        </div>
      ) : reservas.length === 0 ? (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", margin: 0 }}>Sin reservas</p>
      ) : (
        reservas.map(r => <HistorialRow key={r.id} r={r} lang={lang} />)
      )}
    </div>
  );
}

const LeadRow = memo(function LeadRow({ l, open, onToggle, lang, manualTagsMap }: { l: Lead; open: boolean; onToggle: () => void; lang: string; manualTagsMap: Record<string, TagKey[]> }) {
  const pct = l.pctAsistencia;
  const pctColor = pct >= 80 ? "#4ade80" : pct >= 50 ? "#fbbf24" : "#ef4444";
  const clientKey = l.email?.toLowerCase().trim() || l.nombre.toLowerCase().trim();
  const autoTags  = calcAutoTags({ totalReservas: l.totalReservas, noShows: l.noShows, pctAsistencia: l.pctAsistencia, canceladas: l.canceladas });
  const manualTags: TagKey[] = manualTagsMap[clientKey] ?? [];
  const allTags   = [...new Set([...autoTags, ...manualTags])];

  return (
    <div className="lead-card">
      <div onClick={onToggle} className={`lead-row${open ? " lead-row--open" : ""}`}>
        <div className="lead-col-name">
          <span className="lead-nombre">{l.nombre}</span>
          <span className="lead-contact">
            {l.email && <><Mail size={10} /> {l.email}</>}
            {l.telefono && <><Phone size={10} /> {l.telefono}</>}
          </span>
          {allTags.length > 0 && (
            <span className="lead-tags-row">
              {allTags.map(tag => {
                const m = TAG_META[tag];
                return (
                  <span key={tag} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: m.bg, color: m.color, fontWeight: 700, border: `1px solid ${m.color}50`, whiteSpace: "nowrap" }}>
                    {m.emoji} {m.label}
                  </span>
                );
              })}
            </span>
          )}
        </div>
        <div className="lead-col-sec">
          {l.secciones.map(s => (
            <span key={s} className={s === "sushi" ? "badge-sushi" : "badge-mex"}>
              {s === "sushi" ? "🍣 Sushi" : "🌮 Mex"}
            </span>
          ))}
        </div>
        <div className="lead-metric"><span style={{ color: "#c9a84c" }}>{l.totalReservas}</span><small>reservas</small></div>
        <div className="lead-metric"><span style={{ color: l.canceladas > 0 ? "#f87171" : "rgba(255,255,255,0.2)" }}>{l.canceladas}</span><small>cancel.</small></div>
        <div className="lead-metric"><span style={{ color: l.noShows > 0 ? "#ef4444" : "rgba(255,255,255,0.2)" }}>{l.noShows}</span><small>no show</small></div>
        <div className="lead-col-pct">
          <div className="pct-track"><div className="pct-fill" style={{ width: `${pct}%`, background: pctColor }} /></div>
          <span style={{ color: pctColor, fontSize: 12, fontWeight: 700 }}>{pct}%</span>
        </div>
        <div className="lead-chevron">{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</div>
      </div>
      {open && <LeadExpanded lead={l} lang={lang} />}
    </div>
  );
});

export default function LeadsPage() {
  const { tr, lang } = useAdminLanguage();
  const a = tr.admin;
  const [leads, setLeads]           = useState<Lead[]>([]);
  const [loading, setLoading]       = useState(true);
  const [openKey, setOpenKey]       = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [sortBy, setSortBy]         = useState<"reservas"|"asistencia"|"canceladas"|"noshow">("reservas");
  const [page, setPage]             = useState(0);
  const [manualTagsMap, setManualTagsMap] = useState<Record<string, TagKey[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/leads");
      if (res.ok) setLeads(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(0); setOpenKey(null); }, []);
  const handleSort   = useCallback((v: typeof sortBy) => { setSortBy(v); setPage(0); }, []);
  const toggle       = useCallback((key: string) => setOpenKey(prev => prev === key ? null : key), []);

  const filtrados = useMemo(() => {
    const q = search.toLowerCase();
    const arr = q
      ? leads.filter(l => l.nombre.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || (l.telefono ?? "").includes(q))
      : leads;
    return [...arr].sort((a, b) => {
      if (sortBy === "asistencia") return b.pctAsistencia - a.pctAsistencia;
      if (sortBy === "canceladas") return b.canceladas - a.canceladas;
      if (sortBy === "noshow")     return b.noShows - a.noShows;
      return b.totalReservas - a.totalReservas;
    });
  }, [leads, search, sortBy]);

  const totalPages = Math.ceil(filtrados.length / PAGE_SIZE);
  const pagina = useMemo(() => filtrados.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtrados, page]);

  // Carga tags manuales para los clientes visibles en la página actual
  useEffect(() => {
    const toLoad = pagina.filter(l => {
      const key = l.email?.toLowerCase().trim() || l.nombre.toLowerCase().trim();
      return !(key in manualTagsMap);
    });
    if (toLoad.length === 0) return;
    toLoad.forEach(l => {
      const key = l.email?.toLowerCase().trim() || l.nombre.toLowerCase().trim();
      const param = l.email ? `email=${encodeURIComponent(l.email)}` : `nombre=${encodeURIComponent(l.nombre)}`;
      fetch(`/api/admin/tags?${param}`)
        .then(r => r.json())
        .then((tags: TagKey[]) => setManualTagsMap(prev => ({ ...prev, [key]: tags })))
        .catch(() => setManualTagsMap(prev => ({ ...prev, [key]: [] })));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina]);

  function exportCSV() {
    const rows = leads.map(l => [l.nombre, l.email, l.telefono ?? "", l.totalReservas, l.canceladas, l.noShows, `${l.pctAsistencia}%`]);
    const csv = [["Cliente","Email","Teléfono","Reservas","Canceladas","No Shows","% Asistencia"], ...rows]
      .map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a2 = document.createElement("a"); a2.href = url; a2.download = `leads-${new Date().toISOString().slice(0,10)}.csv`; a2.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .lead-card{border:1px solid rgba(255,255,255,0.07);border-radius:8px;overflow:hidden;margin-bottom:4px}
        .lead-row{display:grid;grid-template-columns:2fr 1.5fr 90px 90px 90px 130px 40px;gap:16px;padding:18px 20px;align-items:center;cursor:pointer;background:transparent;transition:background .1s}
        .lead-row:hover{background:rgba(255,255,255,0.02)}
        .lead-row--open{background:rgba(201,168,76,0.04)}
        .lead-row--open:hover{background:rgba(201,168,76,0.05)}
        .lead-col-name{overflow:hidden}
        .lead-nombre{display:block;font-size:18px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .lead-contact{display:flex;gap:14px;margin-top:4px;font-size:14px;color:rgba(255,255,255,0.3);align-items:center;flex-wrap:wrap}
        .lead-tags-row{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}
        .lead-col-sec{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
        .lead-metric{text-align:center}
        .lead-metric span{display:block;font-size:26px;font-weight:700}
        .lead-metric small{font-size:12px;color:rgba(255,255,255,0.2);text-transform:uppercase}
        .lead-col-pct{display:flex;align-items:center;gap:8px}
        .pct-track{flex:1;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden}
        .pct-fill{height:100%;border-radius:3px}
        .lead-chevron{display:flex;justify-content:center;color:rgba(255,255,255,0.3)}
        .badge-sushi{font-size:13px;padding:4px 11px;border-radius:20px;background:rgba(96,165,250,0.1);color:#60a5fa;font-weight:700;white-space:nowrap}
        .badge-mex{font-size:13px;padding:4px 11px;border-radius:20px;background:rgba(201,168,76,0.08);color:#c9a84c;font-weight:700;white-space:nowrap}
        .lead-history{border-top:1px solid rgba(255,255,255,0.05);padding:10px 20px 14px}
        .lead-history-title{font-size:12px;text-transform:uppercase;letter-spacing:.2em;color:rgba(201,168,76,0.35);margin:0 0 6px}
        .history-row{display:grid;grid-template-columns:200px 60px 28px 1fr auto;gap:14px;align-items:center;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
        .h-fecha{font-size:16px;color:rgba(255,255,255,0.55);text-transform:capitalize;font-weight:500}
        .h-personas{font-size:16px;color:rgba(255,255,255,0.4);display:flex;align-items:center;gap:4px}
        .h-msg{font-size:15px;color:rgba(201,168,76,0.5);font-style:italic;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .sort-btn{font-size:14px;padding:7px 14px;border-radius:20px;cursor:pointer;font-weight:600;white-space:nowrap;transition:border-color .1s,color .1s}
      `}</style>

      {/* Cabecera */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", gap: "1rem", flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "0.625rem", margin: 0 }}>
          <UserRound size={20} style={{ color: "#c9a84c" }} /> {a.leads}
          <span style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.25)" }}>{filtrados.length} clientes</span>
        </h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={exportCSV} style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 6, padding: "6px 12px", color: "#c9a84c", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Download size={13} /> CSV
          </button>
          <button onClick={load} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "6px 10px", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div style={{ marginBottom: "0.75rem" }}>
        <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Buscar cliente..."
          style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 16px", color: "#fff", fontSize: 17, outline: "none" }} />
      </div>

      {/* Cabecera de columnas — mismo grid que .lead-row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 90px 90px 90px 130px 40px", gap: "16px", padding: "6px 21px 8px", marginBottom: "4px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => handleSort("reservas")} style={{ background:"none", border:"none", padding:0, textAlign:"left", cursor:"pointer", fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:".1em", color:"rgba(255,255,255,0.3)" }}>Cliente</button>
        <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:".1em", color:"rgba(255,255,255,0.2)" }}>Sección</div>
        <button onClick={() => handleSort("reservas")}   style={{ background:"none", border:"none", padding:0, cursor:"pointer", fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:".1em", color: sortBy==="reservas"   ? "#c9a84c" : "rgba(255,255,255,0.3)", textAlign:"center" }}>↕ Visitas</button>
        <button onClick={() => handleSort("canceladas")} style={{ background:"none", border:"none", padding:0, cursor:"pointer", fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:".1em", color: sortBy==="canceladas" ? "#c9a84c" : "rgba(255,255,255,0.3)", textAlign:"center" }}>↕ Cancel.</button>
        <button onClick={() => handleSort("noshow")}     style={{ background:"none", border:"none", padding:0, cursor:"pointer", fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:".1em", color: sortBy==="noshow"     ? "#c9a84c" : "rgba(255,255,255,0.3)", textAlign:"center" }}>↕ N.Show</button>
        <button onClick={() => handleSort("asistencia")} style={{ background:"none", border:"none", padding:0, cursor:"pointer", fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:".1em", color: sortBy==="asistencia" ? "#c9a84c" : "rgba(255,255,255,0.3)" }}>↕ Asistencia</button>
        <div />
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.25)", fontSize: 13, padding: "2rem 0" }}>
          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Cargando clientes...
        </div>
      ) : filtrados.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, textAlign: "center", padding: "3rem" }}>{a.noHayLeads}</p>
      ) : (
        <>
          {pagina.map(l => {
            const key = l.email || l.nombre;
            return <LeadRow key={key} l={l} open={openKey === key} onToggle={() => toggle(key)} lang={lang} manualTagsMap={manualTagsMap} />;
          })}

          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", padding: "1rem 0" }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "6px 10px", color: page === 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)", cursor: page === 0 ? "default" : "pointer" }}>
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                {page + 1} / {totalPages} · {filtrados.length} clientes
              </span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "6px 10px", color: page === totalPages - 1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)", cursor: page === totalPages - 1 ? "default" : "pointer" }}>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

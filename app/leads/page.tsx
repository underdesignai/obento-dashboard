"use client";

import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { UserRound, RefreshCw, Download, ChevronDown, ChevronUp, Phone, Mail, Users, ChevronLeft, ChevronRight, Loader2, ArrowUpDown } from "lucide-react";
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
  totalReservas: number; totalPedidos: number; canceladas: number; noShows: number; pctAsistencia: number;
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

const GRID_COLS = "minmax(240px, 2fr) 100px 100px 105px 100px 135px 44px";

function SortIcon({ col, sortKey, sortDir }: { col: string; sortKey: string; sortDir: "asc" | "desc" }) {
  if (col !== sortKey) return <ChevronUp size={12} style={{ opacity: 0.2 }} />;
  return sortDir === "asc"
    ? <ChevronUp size={12} style={{ color: "#60a5fa" }} />
    : <ChevronDown size={12} style={{ color: "#60a5fa" }} />;
}

const LeadRow = memo(function LeadRow({
  l,
  open,
  onToggle,
  lang,
  manualTagsMap,
  isEven,
  isLast,
}: {
  l: Lead;
  open: boolean;
  onToggle: () => void;
  lang: string;
  manualTagsMap: Record<string, TagKey[]>;
  isEven: boolean;
  isLast: boolean;
}) {
  const pct = l.pctAsistencia;
  const pctColor = pct >= 80 ? "#4ade80" : pct >= 50 ? "#fbbf24" : "#ef4444";
  const clientKey = l.email?.toLowerCase().trim() || l.nombre.toLowerCase().trim();
  const autoTags  = calcAutoTags({ totalReservas: l.totalReservas, noShows: l.noShows, pctAsistencia: l.pctAsistencia, canceladas: l.canceladas });
  const manualTags: TagKey[] = manualTagsMap[clientKey] ?? [];
  const allTags   = [...new Set([...autoTags, ...manualTags])];

  return (
    <div style={{
      borderBottom: isLast && !open ? "none" : "1px solid rgba(255,255,255,0.04)",
      background: open ? "rgba(96,165,250,0.04)" : isEven ? "transparent" : "rgba(255,255,255,0.01)",
      transition: "background 0.15s",
    }}>
      <div
        onClick={onToggle}
        style={{
          display: "grid",
          gridTemplateColumns: GRID_COLS,
          gap: "0.75rem",
          padding: "0.9rem 1.5rem",
          alignItems: "center",
          cursor: "pointer",
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.parentElement!.style.background = "rgba(255,255,255,0.03)"; }}
        onMouseLeave={e => { if (!open) e.currentTarget.parentElement!.style.background = isEven ? "transparent" : "rgba(255,255,255,0.01)"; }}
      >
        {/* Cliente */}
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {l.nombre}
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 2, fontSize: 12, color: "rgba(255,255,255,0.35)", alignItems: "center", flexWrap: "wrap" }}>
            {l.email && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Mail size={11} /> {l.email}</span>}
            {l.telefono && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Phone size={11} /> {l.telefono}</span>}
          </div>
          {allTags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
              {allTags.map(tag => {
                const m = TAG_META[tag];
                return (
                  <span key={tag} style={{ fontSize: 10, padding: "1px 7px", borderRadius: 12, background: m.bg, color: m.color, fontWeight: 700, border: `1px solid ${m.color}40`, whiteSpace: "nowrap" }}>
                    {m.emoji} {m.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>


        {/* Reservas */}
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#c9a84c", fontVariantNumeric: "tabular-nums", fontFamily: "monospace" }}>
            {l.totalReservas}
          </span>
        </div>

        {/* Pedidos */}
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#60a5fa", fontVariantNumeric: "tabular-nums", fontFamily: "monospace" }}>
            {l.totalPedidos}
          </span>
        </div>

        {/* Canceladas */}
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: l.canceladas > 0 ? "#f87171" : "rgba(255,255,255,0.2)", fontVariantNumeric: "tabular-nums", fontFamily: "monospace" }}>
            {l.canceladas}
          </span>
        </div>

        {/* No Show */}
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: l.noShows > 0 ? "#ef4444" : "rgba(255,255,255,0.2)", fontVariantNumeric: "tabular-nums", fontFamily: "monospace" }}>
            {l.noShows}
          </span>
        </div>

        {/* % Asistencia */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 6 }}>
          <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: pctColor, borderRadius: 3 }} />
          </div>
          <span style={{ color: pctColor, fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums", minWidth: 32, textAlign: "right" }}>
            {pct}%
          </span>
        </div>

        {/* Chevron */}
        <div style={{ display: "flex", justifyContent: "center", color: open ? "#60a5fa" : "rgba(255,255,255,0.3)" }}>
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
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
  const [syncing, setSyncing]       = useState(false);
  const [openKey, setOpenKey]       = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [sortBy, setSortBy]         = useState<"reservas"|"asistencia"|"canceladas"|"noshow"|"pedidos"|"nombre">("reservas");
  const [sortDir, setSortDir]       = useState<"asc" | "desc">("desc");
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

  const handleSync = async () => {
    setSyncing(true);
    await fetch("/api/admin/leads/sync", { method: "POST" });
    await load();
    setSyncing(false);
  };

  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(0); setOpenKey(null); }, []);
  const toggleSort   = useCallback((key: typeof sortBy) => {
    if (sortBy === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDir(key === "nombre" ? "asc" : "desc");
    }
    setPage(0);
  }, [sortBy]);
  const toggle       = useCallback((key: string) => setOpenKey(prev => prev === key ? null : key), []);

  const filtrados = useMemo(() => {
    const q = search.toLowerCase();
    const arr = q
      ? leads.filter(l => l.nombre.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || (l.telefono ?? "").includes(q))
      : leads;
    return [...arr].sort((a, b) => {
      let diff = 0;
      if (sortBy === "nombre")          diff = a.nombre.localeCompare(b.nombre);
      else if (sortBy === "asistencia") diff = a.pctAsistencia - b.pctAsistencia;
      else if (sortBy === "canceladas") diff = a.canceladas - b.canceladas;
      else if (sortBy === "noshow")     diff = a.noShows - b.noShows;
      else if (sortBy === "pedidos")    diff = a.totalPedidos - b.totalPedidos;
      else                              diff = a.totalReservas - b.totalReservas;
      return sortDir === "asc" ? diff : -diff;
    });
  }, [leads, search, sortBy, sortDir]);

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

  const thStyle: React.CSSProperties = {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.15em",
    color: "rgba(96,165,250,0.5)",
    fontWeight: 700,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    whiteSpace: "nowrap",
  };

  return (
    <div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .lead-history{border-top:1px solid rgba(255,255,255,0.05);padding:10px 20px 14px;background:rgba(96,165,250,0.02)}
        .lead-history-title{font-size:12px;text-transform:uppercase;letter-spacing:.2em;color:rgba(201,168,76,0.35);margin:0 0 6px}
        .history-row{display:grid;grid-template-columns:200px 60px 1fr auto;gap:14px;align-items:center;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
        .h-fecha{font-size:14px;color:rgba(255,255,255,0.55);text-transform:capitalize;font-weight:500}
        .h-personas{font-size:14px;color:rgba(255,255,255,0.4);display:flex;align-items:center;gap:4px}
        .h-msg{font-size:13px;color:rgba(201,168,76,0.5);font-style:italic;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      `}</style>

      {/* Cabecera */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", gap: "1rem", flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "0.625rem", margin: 0 }}>
          <UserRound size={20} style={{ color: "#c9a84c" }} /> {a.leads}
          <span style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.25)" }}>{filtrados.length} {a.clientesCount}</span>
        </h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={exportCSV} style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 6, padding: "6px 12px", color: "#c9a84c", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Download size={13} /> CSV
          </button>
          <button onClick={handleSync} disabled={syncing} title="Sincronizar desde reservas y pedidos"
            style={{ background: syncing ? "rgba(201,168,76,0.15)" : "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 6, padding: "6px 12px", color: "#c9a84c", cursor: syncing ? "not-allowed" : "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={13} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
            {syncing ? a.sincronizando : a.sincronizar}
          </button>
          <button onClick={load} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "6px 10px", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div style={{ marginBottom: "0.75rem" }}>
        <input value={search} onChange={e => handleSearch(e.target.value)} placeholder={a.buscarCliente}
          style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 16px", color: "#fff", fontSize: 14, outline: "none" }} />
      </div>

      {/* ── DESKTOP: tabla idéntica a Pedidos ── */}
      <div style={{ overflowX: "auto", width: "100%", paddingBottom: "1rem" }}>
        <div style={{ minWidth: 980, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden" }}>
          {/* Head */}
          <div style={{
            display: "grid",
            gridTemplateColumns: GRID_COLS,
            gap: "0.75rem",
            padding: "0.85rem 1.5rem",
            background: "rgba(96,165,250,0.04)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            alignItems: "center"
          }}>
            <button onClick={() => toggleSort("nombre")} style={{ ...thStyle, color: sortBy === "nombre" ? "#60a5fa" : thStyle.color }}>
              {a.cliente} <SortIcon col="nombre" sortKey={sortBy} sortDir={sortDir} />
            </button>
            <button onClick={() => toggleSort("reservas")} style={{ ...thStyle, justifyContent: "center", color: sortBy === "reservas" ? "#60a5fa" : thStyle.color }}>
              {a.reservas2} <SortIcon col="reservas" sortKey={sortBy} sortDir={sortDir} />
            </button>
            <button onClick={() => toggleSort("pedidos")} style={{ ...thStyle, justifyContent: "center", color: sortBy === "pedidos" ? "#60a5fa" : thStyle.color }}>
              {a.pedidos} <SortIcon col="pedidos" sortKey={sortBy} sortDir={sortDir} />
            </button>
            <button onClick={() => toggleSort("canceladas")} style={{ ...thStyle, justifyContent: "center", color: sortBy === "canceladas" ? "#60a5fa" : thStyle.color }}>
              {a.thCanceladas} <SortIcon col="canceladas" sortKey={sortBy} sortDir={sortDir} />
            </button>
            <button onClick={() => toggleSort("noshow")} style={{ ...thStyle, justifyContent: "center", color: sortBy === "noshow" ? "#60a5fa" : thStyle.color }}>
              {a.noShow} <SortIcon col="noshow" sortKey={sortBy} sortDir={sortDir} />
            </button>
            <button onClick={() => toggleSort("asistencia")} style={{ ...thStyle, justifyContent: "center", color: sortBy === "asistencia" ? "#60a5fa" : thStyle.color }}>
              {a.asistencia} <SortIcon col="asistencia" sortKey={sortBy} sortDir={sortDir} />
            </button>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(96,165,250,0.5)", fontWeight: 700, textAlign: "center", display: "block" }}>
              {a.thAccion || "ACCIÓN"}
            </span>
          </div>

          {/* Rows */}
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "rgba(255,255,255,0.25)", fontSize: 13, padding: "3rem 0" }}>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> {a.cargandoClientes}
            </div>
          ) : filtrados.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, textAlign: "center", padding: "3rem" }}>{a.noHayLeads}</p>
          ) : (
            pagina.map((l, i) => {
              const key = l.email || l.nombre;
              return (
                <LeadRow
                  key={key}
                  l={l}
                  open={openKey === key}
                  onToggle={() => toggle(key)}
                  lang={lang}
                  manualTagsMap={manualTagsMap}
                  isEven={i % 2 === 0}
                  isLast={i === pagina.length - 1}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", padding: "1rem 0" }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "6px 10px", color: page === 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)", cursor: page === 0 ? "default" : "pointer" }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            {page + 1} / {totalPages} · {filtrados.length} {a.clientesCount}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "6px 10px", color: page === totalPages - 1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)", cursor: page === totalPages - 1 ? "default" : "pointer" }}>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

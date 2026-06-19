"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  ShoppingBag, RefreshCw, List, LayoutGrid, Search, Download,
  ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
  CheckSquare, Square, Trash2, X, Clock, CreditCard,
  ChefHat, Bell, Package, TrendingUp,
} from "lucide-react";
import { useSession } from "@/lib/session";
import { useAdminLanguage } from "@/lib/LanguageContext";

type Pedido = {
  id: number;
  nombre: string;
  email?: string;
  telefono?: string;
  horaRecogida?: string;
  items: { name: string; nameEn?: string; qty: number; price: number }[];
  total: number;
  estado: string;
  createdAt: string;
  metodoPago?: string;
};

type SortKey = "id" | "nombre" | "total" | "estado" | "createdAt";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 25;

const ESTADOS = ["pendiente_pago", "nuevo", "preparando", "listo", "entregado"];

function getEstadoCfg(a: Record<string, string>): Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> {
  return {
    pendiente_pago: { label: a.pagoPendiente,    color: "#a855f7", bg: "rgba(168,85,247,0.12)", icon: <CreditCard size={14} /> },
    nuevo:          { label: a.statusNuevo,       color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  icon: <ShoppingBag size={14} /> },
    preparando:     { label: a.statusPreparando,  color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  icon: <ChefHat size={14} /> },
    listo:          { label: a.statusListo,       color: "#4ade80", bg: "rgba(74,222,128,0.12)",  icon: <Bell size={14} /> },
    entregado:      { label: a.statusEntregado,   color: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.05)", icon: <Package size={14} /> },
  };
}

const NEXT_ESTADO: Record<string, string> = {
  pendiente_pago: "nuevo",
  nuevo:          "preparando",
  preparando:     "listo",
  listo:          "entregado",
};

function getNextLabel(a: Record<string, string>): Record<string, string> {
  return {
    pendiente_pago: a.confirmarPago,
    nuevo:          a.enPreparacion,
    preparando:     a.listoParaRecoger,
    listo:          a.statusEntregado,
  };
}

const NEXT_BG: Record<string, string> = {
  pendiente_pago: "linear-gradient(135deg,#a855f7,#7c3aed)",
  nuevo:          "linear-gradient(135deg,#f97316,#ea580c)",
  preparando:     "linear-gradient(135deg,#4ade80,#16a34a)",
  listo:          "linear-gradient(135deg,#60a5fa,#2563eb)",
};

// ── Dropdown personalizado ──
function Dropdown({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 6, color: "#fff", fontSize: 13, padding: "0.5rem 0.75rem",
        cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem",
        whiteSpace: "nowrap", outline: "none",
      }}>
        {selected?.label}
        <ChevronDown size={12} style={{ color: "rgba(255,255,255,0.3)", transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 1000,
          background: "#141210", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, overflow: "hidden", minWidth: "100%",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        }}>
          {options.map(o => (
            <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "0.55rem 1rem", fontSize: 13, cursor: "pointer",
                background: o.value === value ? "rgba(201,168,76,0.1)" : "transparent",
                color: o.value === value ? "#c9a84c" : "rgba(255,255,255,0.7)",
                border: "none", outline: "none", transition: "background 0.1s", whiteSpace: "nowrap",
              }}
              onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.background = "transparent"; }}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Badge de estado ──
function EstadoBadge({ estado, estadoCfg }: { estado: string; estadoCfg: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> }) {
  const cfg = estadoCfg[estado] ?? { label: estado, color: "rgba(255,255,255,0.4)", bg: "transparent", icon: null };
  return (
    <span style={{
      fontSize: 12, fontWeight: 700, padding: "4px 13px", borderRadius: 999,
      textTransform: "uppercase", letterSpacing: "0.1em",
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}40`, whiteSpace: "nowrap",
      display: "inline-flex", width: "fit-content",
    }}>{cfg.label}</span>
  );
}

// ── Botón avanzar estado ──
function BtnAvanzar({ pedido, onUpdate, nextLabel }: { pedido: Pedido; onUpdate: (id: number, e: string) => void; nextLabel: Record<string, string> }) {
  const next = NEXT_ESTADO[pedido.estado];
  if (!next) return null;
  return (
    <button onClick={() => onUpdate(pedido.id, next)} style={{
      display: "flex", alignItems: "center", gap: "0.4rem",
      background: NEXT_BG[pedido.estado], border: "none", borderRadius: 6,
      cursor: "pointer", padding: "0.35rem 0.875rem",
      fontSize: 11, fontWeight: 700, color: "#fff",
      letterSpacing: "0.06em", textTransform: "uppercase",
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)", whiteSpace: "nowrap", flexShrink: 0,
      width: "fit-content",
      transition: "opacity 0.15s, transform 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.transform = "scale(1.02)"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}>
      {nextLabel[pedido.estado]}
    </button>
  );
}

// ── Stat card ──
function StatCard({ icon, label, value, color, sub }: { icon: React.ReactNode; label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 8, padding: "1.35rem 1.75rem", display: "flex", alignItems: "center",
      gap: "1.25rem", flex: "1 1 170px", minWidth: 0,
    }}>
      <div style={{ color, flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", margin: "6px 0 0" }}>{label}</p>
        {sub && <p style={{ fontSize: 12, color, margin: "2px 0 0" }}>{sub}</p>}
      </div>
    </div>
  );
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronUp size={12} style={{ opacity: 0.2 }} />;
  return sortDir === "asc" ? <ChevronUp size={12} style={{ color: "#60a5fa" }} /> : <ChevronDown size={12} style={{ color: "#60a5fa" }} />;
}

export default function PedidosPage() {
  const { tr, lang } = useAdminLanguage();
  const a = tr.admin;
  const estadoCfg = getEstadoCfg(a);
  const nextLabel = getNextLabel(a);

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView]       = useState<"lista" | "kanban">("lista");
  const [isMobile, setIsMobile] = useState(false);
  const { role, loaded } = useSession();
  const canEdit = loaded && role === "admin";

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Filters
  const [search, setSearch]           = useState("");
  const [filtroEstado, setFiltroEstado] = useState("all");
  const [fechaDesde, setFechaDesde]   = useState("");
  const [fechaHasta, setFechaHasta]   = useState("");

  // Vista
  const [vistaMode, setVistaMode] = useState<"hoy" | "todos">("hoy");

  // Sort + pagination
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage]       = useState(1);

  // Bulk
  const [bulkSelected, setBulkSelected] = useState<Set<number>>(new Set());

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await fetch("/api/admin/pedidos");
    if (res.ok) {
      const data = await res.json();
      sessionStorage.setItem("coyo_pedidos", JSON.stringify(data));
      setPedidos(data);
    }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    const cached = sessionStorage.getItem("coyo_pedidos");
    if (cached) { setPedidos(JSON.parse(cached)); setLoading(false); }
    load();
    const interval = setInterval(() => load(true), 5000);
    return () => clearInterval(interval);
  }, [load]);

  const updateEstado = async (id: number, estado: string) => {
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado } : p));
    await fetch(`/api/admin/pedidos/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
  };

  // Stats
  const stats = useMemo(() => {
    const activos = pedidos.filter(p => p.estado !== "entregado" && p.estado !== "pendiente_pago");
    return {
      total:      pedidos.length,
      nuevo:      pedidos.filter(p => p.estado === "nuevo").length,
      preparando: pedidos.filter(p => p.estado === "preparando").length,
      listo:      pedidos.filter(p => p.estado === "listo").length,
      ingresos:   pedidos.filter(p => p.estado !== "pendiente_pago").reduce((s, p) => s + p.total, 0),
    };
  }, [pedidos]);

  // Filtered + sorted
  const todayStr = new Date().toISOString().slice(0, 10);
  const filtered = useMemo(() => {
    let r = pedidos;
    if (vistaMode === "hoy") {
      r = r.filter(p => p.createdAt.slice(0, 10) === todayStr);
    }
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(p => p.nombre.toLowerCase().includes(q) || (p.telefono ?? "").includes(q) || (p.email ?? "").toLowerCase().includes(q));
    }
    if (filtroEstado !== "all") r = r.filter(p => p.estado === filtroEstado);
    if (vistaMode === "todos" && fechaDesde) r = r.filter(p => new Date(p.createdAt) >= new Date(fechaDesde));
    if (vistaMode === "todos" && fechaHasta) r = r.filter(p => new Date(p.createdAt) <= new Date(fechaHasta + "T23:59:59"));

    return [...r].sort((a, b) => {
      let va: string | number = a[sortKey] ?? "";
      let vb: string | number = b[sortKey] ?? "";
      if (sortKey === "total") { va = a.total; vb = b.total; }
      if (sortKey === "id")    { va = a.id;    vb = b.id; }
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      return sortDir === "asc" ? (va < vb ? -1 : 1) : (va > vb ? -1 : 1);
    });
  }, [pedidos, search, filtroEstado, fechaDesde, fechaHasta, sortKey, sortDir, vistaMode, todayStr]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => setPage(1), [search, filtroEstado, fechaDesde, fechaHasta, vistaMode]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  // Bulk
  const allPageSelected = paginated.length > 0 && paginated.every(p => bulkSelected.has(p.id));
  function toggleBulkAll() {
    setBulkSelected(prev => {
      const next = new Set(prev);
      if (allPageSelected) paginated.forEach(p => next.delete(p.id));
      else paginated.forEach(p => next.add(p.id));
      return next;
    });
  }
  function toggleBulkOne(id: number) {
    setBulkSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  async function bulkDelete() {
    if (!confirm(`${a.eliminar} ${bulkSelected.size}?`)) return;
    await Promise.all([...bulkSelected].map(id => fetch(`/api/admin/pedidos/${id}`, { method: "DELETE" })));
    setPedidos(prev => prev.filter(p => !bulkSelected.has(p.id)));
    setBulkSelected(new Set());
  }

  // CSV
  function exportCSV() {
    const cols = ["ID","Name","Email","Phone","Pick-up time","Items","Total","Status","Date"];
    const rows = filtered.map(p => [
      `CY-${String(p.id).padStart(4,"0")}`,
      `"${p.nombre}"`, p.email ?? "", p.telefono ?? "", p.horaRecogida ?? "",
      `"${p.items?.map(i => `${i.qty}x ${i.name}`).join(", ") ?? ""}"`,
      p.total.toFixed(2), p.estado,
      new Date(p.createdAt).toLocaleString("es-ES"),
    ].join(","));
    const csv  = [cols.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `pedidos_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 6, color: "#fff", fontSize: 14, padding: "0.6rem 0.9rem", outline: "none",
  };

  const thStyle: React.CSSProperties = {
    fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em",
    color: "rgba(96,165,250,0.5)", fontWeight: 700,
    background: "none", border: "none", cursor: "pointer", padding: 0,
    display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
  };

  const BTN_VIEW: React.CSSProperties = {
    width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", transition: "all 0.15s",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(96,165,250,0.5)", marginBottom: "0.25rem" }}>{a.gestion}</p>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, fontFamily: "var(--font-playfair, serif)", color: "#fff", display: "flex", alignItems: "center", gap: "0.75rem", margin: 0 }}>
              <ShoppingBag size={isMobile ? 20 : 24} style={{ color: "#60a5fa" }} /> {a.pedidos}
            </h1>
            <div style={{ display: "flex", gap: "0.3rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "3px" }}>
              {(["hoy", "todos"] as const).map(m => (
                <button key={m} onClick={() => { setVistaMode(m); setPage(1); setFechaDesde(""); setFechaHasta(""); }}
                  style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", padding: "0.35rem 0.85rem", borderRadius: 6, border: "none", cursor: "pointer", transition: "all 0.15s",
                    background: vistaMode === m ? "rgba(96,165,250,0.15)" : "transparent",
                    color: vistaMode === m ? "#60a5fa" : "rgba(255,255,255,0.3)",
                    boxShadow: vistaMode === m ? "0 0 0 1px rgba(96,165,250,0.2)" : "none",
                  }}>
                  {m === "hoy" ? "Pedidos hoy" : "Todos los pedidos"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          {!isMobile && (
            <button onClick={exportCSV} style={{ ...inputStyle, display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", cursor: "pointer", color: "rgba(201,168,76,0.7)", borderColor: "rgba(201,168,76,0.15)" }}>
              <Download size={13} /> {a.exportarCSV}
            </button>
          )}
          {!isMobile && <>
            <button onClick={() => setView("lista")} style={{ ...BTN_VIEW, background: view === "lista" ? "rgba(96,165,250,0.12)" : "rgba(255,255,255,0.03)", borderColor: view === "lista" ? "rgba(96,165,250,0.3)" : "rgba(255,255,255,0.08)" }}>
              <List size={15} style={{ color: view === "lista" ? "#60a5fa" : "rgba(255,255,255,0.3)" }} />
            </button>
            <button onClick={() => setView("kanban")} style={{ ...BTN_VIEW, background: view === "kanban" ? "rgba(96,165,250,0.12)" : "rgba(255,255,255,0.03)", borderColor: view === "kanban" ? "rgba(96,165,250,0.3)" : "rgba(255,255,255,0.08)" }}>
              <LayoutGrid size={15} style={{ color: view === "kanban" ? "#60a5fa" : "rgba(255,255,255,0.3)" }} />
            </button>
          </>}
          <button onClick={() => load()} style={{ ...BTN_VIEW, background: "rgba(255,255,255,0.03)" }} title="Actualizar">
            <RefreshCw size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
          </button>
        </div>
      </div>

      {/* Stats — en móvil solo 3 compactas */}
      {isMobile ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
          {[
            { label: a.nuevos,     value: stats.nuevo,      color: "#60a5fa" },
            { label: a.preparando, value: stats.preparando, color: "#fbbf24" },
            { label: a.listos,     value: stats.listo,      color: "#4ade80" },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "0.75rem 1rem", textAlign: "center" }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", margin: "5px 0 0" }}>{s.label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <StatCard icon={<ShoppingBag size={22} />} label={a.totalPedidos} value={stats.total}                        color="#60a5fa" />
          <StatCard icon={<ShoppingBag size={22} />} label={a.nuevos}       value={stats.nuevo}                        color="#60a5fa" />
          <StatCard icon={<ChefHat size={22} />}     label={a.preparando}   value={stats.preparando}                   color="#fbbf24" />
          <StatCard icon={<Bell size={22} />}        label={a.listos}       value={stats.listo}                        color="#4ade80" />
          <StatCard icon={<TrendingUp size={22} />}  label={a.ingresos}     value={`${stats.ingresos.toFixed(0)},-`}  color="#c9a84c" />
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem", alignItems: isMobile ? "stretch" : "center" }}>
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 0 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", pointerEvents: "none" }} />
          <input type="text" placeholder={a.buscarPedido} value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, width: "100%", paddingLeft: "2rem", boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Dropdown value={filtroEstado} onChange={setFiltroEstado} options={[
            { value: "all",           label: a.todosEstados },
            { value: "pendiente_pago",label: a.pagoPendiente },
            { value: "nuevo",         label: a.statusNuevo },
            { value: "preparando",    label: a.statusPreparando },
            { value: "listo",         label: a.statusListo },
            { value: "entregado",     label: a.statusEntregado },
          ]} />

          {vistaMode === "todos" && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }} />
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>—</span>
              <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }} />
            </div>
          )}

          {(search || filtroEstado !== "all" || fechaDesde || fechaHasta) && (
            <button onClick={() => { setSearch(""); setFiltroEstado("all"); setFechaDesde(""); setFechaHasta(""); }}
              style={{ ...inputStyle, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 4, padding: "0.5rem 0.75rem", cursor: "pointer" }}>
              <X size={12} /> {a.limpiar}
            </button>
          )}
        </div>
      </div>

      {/* Bulk actions */}
      {bulkSelected.size > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem", padding: "0.65rem 1rem", background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.15)", borderRadius: 6 }}>
          <span style={{ fontSize: 12, color: "rgba(96,165,250,0.7)", fontWeight: 600 }}>{bulkSelected.size} {a.seleccionados}</span>
          <div style={{ display: "flex", gap: "0.4rem", marginLeft: "auto" }}>
            <button onClick={bulkDelete} style={{ ...inputStyle, fontSize: 11, padding: "4px 10px", color: "#fca5a5", borderColor: "rgba(252,165,165,0.2)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <Trash2 size={11} /> {a.eliminar}
            </button>
            <button onClick={() => setBulkSelected(new Set())} style={{ ...inputStyle, fontSize: 11, padding: "4px 8px", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>
              <X size={11} />
            </button>
          </div>
        </div>
      )}

      {/* Results info */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>
          {filtered.length} {filtered.length !== 1 ? a.resultados : a.resultado}{filtered.length !== pedidos.length && ` ${a.de} ${pedidos.length}`}
        </p>
        {totalPages > 1 && view === "lista" && (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>{a.pagina} {page} {a.de} {totalPages}</p>
        )}
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 14 }}>{a.cargando}</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "4rem", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 14 }}>
          {pedidos.length === 0 ? a.noHayPedidos : a.ningunPedidoFiltros}
        </div>
      ) : (isMobile || view === "lista") && view !== "kanban" ? (
        <>
          {/* ── MÓVIL: tarjetas ── */}
          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {paginated.map(p => {
                const cfg = estadoCfg[p.estado];
                return (
                  <div key={p.id} style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderLeft: `3px solid ${cfg?.color ?? "rgba(255,255,255,0.1)"}`,
                    borderRadius: 8, padding: "0.9rem 1rem",
                  }}>
                    {/* Fila 1: nombre + total */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: "2px 0 0", fontFamily: "monospace" }}>CY-{String(p.id).padStart(4,"0")}</p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem", flexShrink: 0 }}>
                        <span style={{ fontSize: 17, fontWeight: 700, color: "#c9a84c" }}>{p.total.toFixed(0)},-</span>
                        {p.metodoPago === "local"
                          ? <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "2px 7px", borderRadius: 20, background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>💵 Al recoger</span>
                          : <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "2px 7px", borderRadius: 20, background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.25)" }}>✓ Pagado</span>
                        }
                      </div>
                    </div>

                    {/* Items */}
                    {p.items?.length > 0 && (
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "0 0 0.5rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.items.map(i => `${i.qty}× ${lang === "en" && i.nameEn ? i.nameEn : i.name}`).join(", ")}
                      </p>
                    )}

                    {/* Fila 2: hora + estado + botón */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      {p.horaRecogida && (
                        <span style={{ fontSize: 12, color: "#c9a84c", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                          <Clock size={11} /> {p.horaRecogida}
                        </span>
                      )}
                      <EstadoBadge estado={p.estado} estadoCfg={estadoCfg} />
                      {canEdit && <BtnAvanzar pedido={p} onUpdate={updateEstado} nextLabel={nextLabel} />}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
          /* ── DESKTOP: tabla ── */
          <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden" }}>
            {/* Head */}
            <div style={{ display: "grid", gridTemplateColumns: "2rem 5rem 1.6fr 1.2fr 1fr 1fr 0.8fr 1.2fr 1.1fr", gap: "0.75rem", padding: "0.85rem 1.5rem", background: "rgba(96,165,250,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)", alignItems: "center" }}>
              <button onClick={toggleBulkAll} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0, display: "flex" }}>
                {allPageSelected ? <CheckSquare size={14} style={{ color: "#60a5fa" }} /> : <Square size={14} />}
              </button>
              {([[`nombre`,a.thCliente], [`id`,`#`], [`email`,a.thEmail], [`telefono`,a.thTelefono], [`horaRecogida`,a.thRecogida], [`total`,a.thTotal], [`estado`,a.thEstado]] as [SortKey, string][]).map(([key, label]) => (
                <button key={key} onClick={() => toggleSort(key as SortKey)} style={thStyle}>
                  {label} <SortIcon col={key as SortKey} sortKey={sortKey} sortDir={sortDir} />
                </button>
              ))}
              <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(96,165,250,0.5)", fontWeight: 700 }}>{a.thAccion}</span>
            </div>

            {/* Rows */}
            {paginated.map((p, i) => {
              const isSelected = bulkSelected.has(p.id);
              const cfg = estadoCfg[p.estado];
              return (
                <div key={p.id} style={{
                  display: "grid", gridTemplateColumns: "2rem 5rem 1.6fr 1.2fr 1fr 1fr 0.8fr 1.2fr 1.1fr",
                  gap: "0.75rem", padding: "0.9rem 1.5rem", alignItems: "center",
                  borderBottom: i < paginated.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  borderLeft: `3px solid ${cfg?.color ?? "transparent"}`,
                  background: isSelected ? "rgba(96,165,250,0.04)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                  transition: "background 0.15s",
                }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)"; }}>
                  <div onClick={() => toggleBulkOne(p.id)} style={{ display: "flex", cursor: "pointer" }}>
                    {isSelected ? <CheckSquare size={14} style={{ color: "#60a5fa" }} /> : <Square size={14} style={{ color: "rgba(255,255,255,0.2)" }} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</p>
                    {p.items?.length > 0 && (
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.items.map(i => `${i.qty}× ${lang === "en" && i.nameEn ? i.nameEn : i.name}`).join(", ")}
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>CY-{String(p.id).padStart(4,"0")}</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.email || "—"}</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontVariantNumeric: "tabular-nums" }}>{p.telefono || "—"}</span>
                  <span style={{ fontSize: 13, color: "#c9a84c", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{p.horaRecogida ?? "—"}</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#c9a84c", fontVariantNumeric: "tabular-nums" }}>{p.total.toFixed(0)},-</span>
                    {p.metodoPago === "local"
                      ? <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", padding: "2px 6px", borderRadius: 20, background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)", whiteSpace: "nowrap" }}>💵 Al recoger</span>
                      : <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", padding: "2px 6px", borderRadius: 20, background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.25)", whiteSpace: "nowrap" }}>✓ Pagado</span>
                    }
                  </div>
                  <EstadoBadge estado={p.estado} estadoCfg={estadoCfg} />
                  {canEdit ? <BtnAvanzar pedido={p} onUpdate={updateEstado} nextLabel={nextLabel} /> : <span />}
                </div>
              );
            })}
          </div>

          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", marginTop: "1.25rem" }}>
              <button onClick={() => setPage(1)} disabled={page === 1} style={{ ...inputStyle, padding: "0.4rem 0.6rem", opacity: page === 1 ? 0.3 : 1, fontSize: 12, cursor: "pointer" }}>«</button>
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} style={{ ...inputStyle, padding: "0.4rem 0.6rem", opacity: page === 1 ? 0.3 : 1, display: "flex", alignItems: "center", cursor: "pointer" }}>
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                  acc.push(p); return acc;
                }, [])
                .map((p, i) => p === "…" ? (
                  <span key={`e-${i}`} style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, padding: "0 4px" }}>…</span>
                ) : (
                  <button key={p} onClick={() => setPage(p as number)} style={{ ...inputStyle, padding: "0.4rem 0.7rem", fontSize: 12, fontWeight: page === p ? 700 : 400, background: page === p ? "rgba(96,165,250,0.12)" : inputStyle.background, color: page === p ? "#60a5fa" : "rgba(255,255,255,0.4)", borderColor: page === p ? "rgba(96,165,250,0.25)" : "rgba(255,255,255,0.08)", cursor: "pointer" }}>
                    {p}
                  </button>
                ))}
              <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} style={{ ...inputStyle, padding: "0.4rem 0.6rem", opacity: page === totalPages ? 0.3 : 1, display: "flex", alignItems: "center", cursor: "pointer" }}>
                <ChevronRight size={14} />
              </button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ ...inputStyle, padding: "0.4rem 0.6rem", opacity: page === totalPages ? 0.3 : 1, fontSize: 12, cursor: "pointer" }}>»</button>
            </div>
          )}
        </>
      ) : (
        /* ── KANBAN ── */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(180px, 1fr))", gap: "0.75rem", overflowX: "auto", minWidth: 0 }}>
          {ESTADOS.map(estado => {
            const cfg = estadoCfg[estado];
            const cols = filtered.filter(p => p.estado === estado);
            return (
              <div key={estado} style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden" }}>
                {/* Column header */}
                <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "0.5rem", background: `${cfg.color}08` }}>
                  <span style={{ color: cfg.color, display: "flex" }}>{cfg.icon}</span>
                  <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>{cfg.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: "1px 8px", borderRadius: 999 }}>{cols.length}</span>
                </div>
                {/* Cards */}
                <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem", minHeight: 80 }}>
                  {cols.length === 0 && (
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.15)", textAlign: "center", padding: "1rem 0" }}>—</p>
                  )}
                  {cols.map(p => (
                    <div key={p.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "0.75rem", borderLeft: `3px solid ${cfg.color}` }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.4rem" }}>
                        <p style={{ fontWeight: 600, fontSize: 13, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</p>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "monospace", flexShrink: 0 }}>#{p.id}</span>
                      </div>
                      {p.telefono && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 4px" }}>{p.telefono}</p>}
                      {p.horaRecogida && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                          <Clock size={10} style={{ color: "#c9a84c" }} />
                          <span style={{ fontSize: 11, color: "#c9a84c", fontWeight: 600 }}>{p.horaRecogida}</span>
                        </div>
                      )}
                      {p.items?.length > 0 && (
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.items.map(i => `${i.qty}× ${lang === "en" && i.nameEn ? i.nameEn : i.name}`).join(", ")}
                        </p>
                      )}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#c9a84c" }}>{p.total.toFixed(0)},-</span>
                        {canEdit && <BtnAvanzar pedido={p} onUpdate={updateEstado} nextLabel={nextLabel} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

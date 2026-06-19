"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  ConciergeBell, RefreshCw, X, Trash2, Search, ChevronDown,
  ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock,
  Users, Download, CheckSquare, Square, Filter, Plus,
} from "lucide-react";
import { useAdminLanguage } from "@/lib/LanguageContext";

const GOLD = "#c9a84c";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Servicio {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  servicio: string;
  fecha: string;
  personas: number;
  mensaje?: string;
  empresa?: string;
  menu?: string;
  estado: string;
  createdAt: string;
}

type SortKey = "nombre" | "email" | "servicio" | "fecha" | "personas" | "estado" | "createdAt";
type SortDir = "asc" | "desc";
const PAGE_SIZE = 25;

// ── Helpers ───────────────────────────────────────────────────────────────────
function getEstadoStyles(a: Record<string, string>): Record<string, { bg: string; text: string; label: string }> {
  return {
    pendiente:  { bg: "rgba(251,191,36,0.12)",  text: "#fbbf24", label: a.statusPendiente  },
    confirmada: { bg: "rgba(74,222,128,0.12)",  text: "#4ade80", label: a.statusConfirmada },
    cancelada:  { bg: "rgba(252,165,165,0.12)", text: "#fca5a5", label: a.statusCancelada  },
    completada: { bg: "rgba(167,139,250,0.12)", text: "#a78bfa", label: a.statusCompletada },
  };
}

const SERVICIO_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  sushi_experience: { bg: "rgba(96,165,250,0.12)",  text: "#60a5fa", label: "Cocina y Aprende" },
  catering:         { bg: "rgba(201,168,76,0.12)",   text: GOLD,      label: "Catering"         },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function Badge({ estado, estadoStyles }: { estado: string; estadoStyles: Record<string, { bg: string; text: string; label: string }> }) {
  const s = estadoStyles[estado] ?? { bg: "rgba(255,255,255,0.06)", text: "rgba(255,255,255,0.5)", label: estado };
  return (
    <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em", padding: "4px 13px", borderRadius: 20, background: s.bg, color: s.text, fontWeight: 700, whiteSpace: "nowrap", display: "inline-flex", width: "fit-content" }}>
      {s.label}
    </span>
  );
}

function ServicioBadge({ servicio }: { servicio: string }) {
  const s = SERVICIO_STYLES[servicio] ?? { bg: "rgba(255,255,255,0.06)", text: "rgba(255,255,255,0.4)", label: servicio };
  return (
    <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em", padding: "4px 13px", borderRadius: 20, background: s.bg, color: s.text, fontWeight: 700, whiteSpace: "nowrap", display: "inline-flex", width: "fit-content" }}>
      {s.label}
    </span>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "1.35rem 1.75rem", display: "flex", alignItems: "center", gap: "1.25rem", flex: "1 1 160px", minWidth: 0 }}>
      <div style={{ color, flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", margin: "6px 0 0" }}>{label}</p>
      </div>
    </div>
  );
}

function Dropdown({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", flex: "0 0 auto" }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#fff", fontSize: 13, padding: "0.5rem 0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap", outline: "none" }}>
        {selected?.label}
        <ChevronDown size={12} style={{ color: "rgba(255,255,255,0.3)", transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 1000, background: "#141210", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, overflow: "hidden", minWidth: "100%", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
          {options.map(o => (
            <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "0.55rem 1rem", fontSize: 13, cursor: "pointer", background: o.value === value ? "rgba(201,168,76,0.1)" : "transparent", color: o.value === value ? GOLD : "rgba(255,255,255,0.7)", border: "none", outline: "none", transition: "background 0.1s", whiteSpace: "nowrap" }}
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

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronDown size={12} style={{ opacity: 0.2 }} />;
  return sortDir === "asc"
    ? <ChevronDown size={12} style={{ color: GOLD, transform: "rotate(180deg)" }} />
    : <ChevronDown size={12} style={{ color: GOLD }} />;
}

// ── Modal detalle ─────────────────────────────────────────────────────────────
function DetailModal({ item, onClose, onDelete, onEstadoChange, a, estadoStyles }: {
  item: Servicio; onClose: () => void;
  onDelete: (id: number) => void;
  onEstadoChange: (id: number, estado: string) => void;
  a: Record<string, string>;
  estadoStyles: Record<string, { bg: string; text: string; label: string }>;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savingEstado, setSavingEstado] = useState(false);

  async function handleDelete() {
    await fetch(`/api/admin/servicios/${item.id}`, { method: "DELETE" });
    onDelete(item.id);
    onClose();
  }

  async function handleEstado(nuevoEstado: string) {
    if (nuevoEstado === item.estado) return;
    setSavingEstado(true);
    await fetch(`/api/admin/servicios/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado: nuevoEstado }) });
    onEstadoChange(item.id, nuevoEstado);
    setSavingEstado(false);
  }

  const fecha = new Date(item.fecha);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#0e0d0b", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 12, width: "100%", maxWidth: 480, padding: "1.75rem", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div>
            <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(201,168,76,0.5)", margin: 0 }}>Servicio #{item.id}</p>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "0.25rem 0 0.5rem" }}>{item.nombre}</h2>
            <ServicioBadge servicio={item.servicio} />
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center", flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>

        {/* Datos */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: "1.5rem", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden" }}>
          {([
            ["Email",    item.email || "—"],
            ["Teléfono", item.telefono || "—"],
            ["Fecha",    fecha.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })],
            ["Personas", String(item.personas)],
            ...(item.empresa ? [["Empresa", item.empresa] as [string,string]] : []),
            ...(item.menu    ? [["Menú",    item.menu]    as [string,string]] : []),
            ...(item.mensaje ? [["Mensaje", item.mensaje] as [string,string]] : []),
          ] as [string,string][]).map(([label, value], i, arr) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", padding: "0.65rem 1rem", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
              <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 13, color: label === "Mensaje" ? "rgba(255,255,255,0.5)" : "#fff", textAlign: "right", fontStyle: label === "Mensaje" ? "italic" : "normal" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Cambiar estado */}
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", marginBottom: "0.5rem" }}>{a.thEstado}</p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {Object.entries(estadoStyles).map(([key, s]) => {
              const active = item.estado === key;
              return (
                <button key={key} onClick={() => handleEstado(key)} disabled={savingEstado}
                  style={{ flex: 1, padding: "0.5rem", borderRadius: 6, cursor: "pointer", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, transition: "all 0.15s", background: active ? s.bg : "rgba(255,255,255,0.03)", border: `1px solid ${active ? s.text + "40" : "rgba(255,255,255,0.07)"}`, color: active ? s.text : "rgba(255,255,255,0.35)", opacity: savingEstado ? 0.5 : 1 }}>
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Eliminar */}
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)}
            style={{ width: "100%", padding: "0.65rem", background: "transparent", border: "1px solid rgba(252,165,165,0.15)", borderRadius: 6, color: "rgba(252,165,165,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontSize: 12, fontWeight: 600, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(252,165,165,0.06)"; e.currentTarget.style.color = "rgba(252,165,165,0.8)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(252,165,165,0.5)"; }}>
            <Trash2 size={13} /> {a.eliminarReserva}
          </button>
        ) : (
          <div style={{ background: "rgba(252,165,165,0.04)", border: "1px solid rgba(252,165,165,0.15)", borderRadius: 6, padding: "1rem", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "rgba(252,165,165,0.7)", marginBottom: "0.75rem" }}>{a.confirmarEliminar}</p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: "0.6rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 12 }}>{a.cancelar}</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: "0.6rem", background: "rgba(252,165,165,0.12)", border: "1px solid rgba(252,165,165,0.25)", borderRadius: 4, color: "#fca5a5", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>{a.siEliminar}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Modal nueva reserva ────────────────────────────────────────────────────────
function ModalNueva({ onClose, onCreated, a }: { onClose: () => void; onCreated: () => void; a: Record<string, string> }) {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", servicio: "sushi_experience", fecha: "", personas: "2", empresa: "", menu: "", mensaje: "", estado: "pendiente" });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const submit = async () => {
    if (!form.nombre || !form.email || !form.fecha) return;
    setSaving(true);
    await fetch("/api/admin/servicios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, personas: Number(form.personas), fecha: new Date(form.fecha).toISOString() }) });
    setSaving(false);
    onCreated();
    onClose();
  };
  const inputStyle: React.CSSProperties = { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#fff", fontSize: 13, padding: "0.55rem 0.75rem", outline: "none", boxSizing: "border-box" };
  const inp = (k: string, label: string, type = "text", placeholder = "") => (
    <div>
      <label style={{ display: "block", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)", marginBottom: 5 }}>{label}</label>
      <input type={type} value={(form as Record<string,string>)[k]} onChange={e => set(k, e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  );
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: "1rem" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#0e0d0b", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 12, padding: "1.75rem", width: "100%", maxWidth: 540, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>Nueva reserva de servicio</h2>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: "6px", display: "flex" }}><X size={16} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {inp("nombre", "Nombre *")}
            {inp("email", "Email *", "email")}
            {inp("telefono", "Teléfono", "tel")}
            {inp("personas", "Personas", "number")}
            {inp("fecha", "Fecha *", "date")}
            <div>
              <label style={{ display: "block", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)", marginBottom: 5 }}>Servicio</label>
              <select value={form.servicio} onChange={e => set("servicio", e.target.value)} style={{ ...inputStyle }}>
                <option value="sushi_experience">Cocina y Aprende</option>
                <option value="catering">Catering</option>
              </select>
            </div>
          </div>
          {form.servicio === "catering" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {inp("empresa", "Empresa")}
              {inp("menu", "Menú elegido")}
            </div>
          )}
          <div>
            <label style={{ display: "block", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)", marginBottom: 5 }}>Mensaje</label>
            <textarea value={form.mensaje} onChange={e => set("mensaje", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
          <button onClick={submit} disabled={saving} style={{ flex: 1, background: `linear-gradient(135deg,${GOLD},#a07830)`, border: "none", borderRadius: 6, color: "#0a0a0f", fontSize: 13, fontWeight: 700, padding: "0.7rem", cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? a.guardando : a.crearReserva}
          </button>
          <button onClick={onClose} style={{ padding: "0.7rem 1.25rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "rgba(255,255,255,0.6)", fontSize: 13, cursor: "pointer" }}>
            {a.cancelar}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ServiciosPage() {
  const { tr } = useAdminLanguage();
  const a = tr.admin;
  const estadoStyles = getEstadoStyles(a);
  const [items, setItems]       = useState<Servicio[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<Servicio | null>(null);
  const [showNueva, setShowNueva] = useState(false);

  // Filters
  const [search, setSearch]         = useState("");
  const [filtroEstado, setFiltroEstado]   = useState("all");
  const [filtroServicio, setFiltroServicio] = useState("all");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Pagination
  const [page, setPage] = useState(1);

  // Bulk
  const [bulkSelected, setBulkSelected] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/servicios?limit=500");
    if (res.ok) {
      const data = await res.json();
      setItems(data.items ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Stats
  const stats = useMemo(() => ({
    total:      items.length,
    pendientes: items.filter(i => i.estado === "pendiente").length,
    confirmadas:items.filter(i => i.estado === "confirmada").length,
    sushi:      items.filter(i => i.servicio === "sushi_experience").length,
    catering:   items.filter(i => i.servicio === "catering").length,
  }), [items]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let r = items;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(x => x.nombre.toLowerCase().includes(q) || x.email.toLowerCase().includes(q) || (x.empresa ?? "").toLowerCase().includes(q) || (x.telefono ?? "").toLowerCase().includes(q));
    }
    if (filtroEstado !== "all")   r = r.filter(x => x.estado === filtroEstado);
    if (filtroServicio !== "all") r = r.filter(x => x.servicio === filtroServicio);
    if (fechaDesde) r = r.filter(x => new Date(x.fecha) >= new Date(fechaDesde));
    if (fechaHasta) r = r.filter(x => new Date(x.fecha) <= new Date(fechaHasta + "T23:59:59"));
    r = [...r].sort((a, b) => {
      let va: string | number = (a as unknown as Record<string, string | number>)[sortKey] ?? "";
      let vb: string | number = (b as unknown as Record<string, string | number>)[sortKey] ?? "";
      if (sortKey === "personas") { va = a.personas; vb = b.personas; }
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      return sortDir === "asc" ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
    });
    return r;
  }, [items, search, filtroEstado, filtroServicio, fechaDesde, fechaHasta, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [search, filtroEstado, filtroServicio, fechaDesde, fechaHasta]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  // Bulk
  const allPageSelected = paginated.length > 0 && paginated.every(r => bulkSelected.has(r.id));
  function toggleBulkAll() {
    setBulkSelected(prev => {
      const next = new Set(prev);
      if (allPageSelected) paginated.forEach(r => next.delete(r.id));
      else paginated.forEach(r => next.add(r.id));
      return next;
    });
  }
  function toggleBulkOne(id: number) {
    setBulkSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }
  async function bulkDelete() {
    if (!confirm(`¿Eliminar ${bulkSelected.size} reservas?`)) return;
    await Promise.all([...bulkSelected].map(id => fetch(`/api/admin/servicios/${id}`, { method: "DELETE" })));
    setItems(prev => prev.filter(r => !bulkSelected.has(r.id)));
    setBulkSelected(new Set());
  }
  async function bulkEstado(estado: string) {
    await Promise.all([...bulkSelected].map(id =>
      fetch(`/api/admin/servicios/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado }) })
    ));
    setItems(prev => prev.map(r => bulkSelected.has(r.id) ? { ...r, estado } : r));
    setBulkSelected(new Set());
  }

  // CSV Export
  function exportCSV() {
    const cols = ["ID","Nombre","Email","Teléfono","Servicio","Fecha","Personas","Empresa","Menú","Estado","Mensaje"];
    const rows = filtered.map(r => [
      r.id, `"${r.nombre}"`, r.email, r.telefono ?? "", r.servicio,
      new Date(r.fecha).toLocaleDateString("es-ES"), r.personas,
      r.empresa ?? "", r.menu ?? "", r.estado, `"${(r.mensaje ?? "").replace(/"/g,"'")}"`
    ].join(","));
    const csv  = [cols.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `servicios_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  const handleDelete      = (id: number) => setItems(prev => prev.filter(r => r.id !== id));
  const handleEstadoChange = (id: number, estado: string) => {
    setItems(prev => prev.map(r => r.id === id ? { ...r, estado } : r));
    setSelected(prev => prev?.id === id ? { ...prev, estado } : prev);
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 6, color: "#fff", fontSize: 14, padding: "0.6rem 0.9rem",
    outline: "none", cursor: "pointer",
  } as React.CSSProperties;

  const thStyle = {
    fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.15em",
    color: "rgba(201,168,76,0.5)", fontWeight: 700, background: "none", border: "none",
    cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" as const,
  };

  return (
    <div>
      {selected && <DetailModal item={selected} onClose={() => setSelected(null)} onDelete={handleDelete} onEstadoChange={handleEstadoChange} a={a} estadoStyles={estadoStyles} />}
      {showNueva && <ModalNueva onClose={() => setShowNueva(false)} onCreated={load} a={a} />}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(201,168,76,0.5)", marginBottom: "0.25rem" }}>{a.gestion}</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-playfair, serif)", color: "#fff", display: "flex", alignItems: "center", gap: "0.75rem", margin: 0 }}>
              <ConciergeBell size={24} style={{ color: GOLD }} /> {a.servicios}
            </h1>
            {[
              { value: "catering",         label: "Catering"         },
              { value: "sushi_experience", label: "Cocina y Aprende" },
            ].map(opt => {
              const active = filtroServicio === opt.value;
              return (
                <button key={opt.value} onClick={() => { setFiltroServicio(active ? "all" : opt.value); setPage(1); }}
                  style={{ padding: "0.3rem 0.9rem", borderRadius: 6, background: active ? `linear-gradient(135deg,${GOLD},#a07830)` : "rgba(255,255,255,0.04)", border: `1px solid ${active ? "transparent" : "rgba(201,168,76,0.2)"}`, color: active ? "#0a0a0f" : GOLD, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={exportCSV} style={{ ...inputStyle, display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", color: "rgba(201,168,76,0.7)", borderColor: "rgba(201,168,76,0.15)" }}>
            <Download size={13} /> {a.exportarCSV}
          </button>
          <button onClick={load} style={{ ...inputStyle, display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", color: "rgba(255,255,255,0.4)" }}>
            <RefreshCw size={13} /> {a.actualizar}
          </button>
          <button onClick={() => setShowNueva(true)} style={{ background: `linear-gradient(135deg,${GOLD},#a07830)`, border: "none", borderRadius: 6, color: "#0a0a0f", cursor: "pointer", padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: 13, fontWeight: 700 }}>
            <Plus size={14} /> {a.nueva}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <StatCard icon={<ConciergeBell size={22} />} label={a.totalReservas} value={stats.total} color={GOLD} />
        <StatCard icon={<Clock size={22} />} label={a.pendientes} value={stats.pendientes} color="#fbbf24" />
        <StatCard icon={<CheckCircle size={22} />} label={a.confirmadas} value={stats.confirmadas} color="#4ade80" />
        <StatCard icon={<Users size={22} />} label="Cocina y Aprende" value={stats.sushi} color="#60a5fa" />
        <StatCard icon={<XCircle size={22} />} label="Catering" value={stats.catering} color={GOLD} />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 0 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", pointerEvents: "none" }} />
          <input type="text" placeholder={a.buscarServicio} value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, width: "100%", paddingLeft: "2rem", boxSizing: "border-box" }} />
        </div>
        <Dropdown value={filtroEstado} onChange={v => { setFiltroEstado(v); setPage(1); }}
          options={[{ value: "all", label: a.todosEstados }, ...Object.entries(estadoStyles).map(([v, s]) => ({ value: v, label: s.label }))]} />
        <Dropdown value={filtroServicio} onChange={v => { setFiltroServicio(v); setPage(1); }}
          options={[{ value: "all", label: a.todosServicios }, { value: "sushi_experience", label: "Cocina y Aprende" }, { value: "catering", label: "Catering" }]} />
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flex: "0 0 auto" }}>
          <Filter size={12} style={{ color: "rgba(255,255,255,0.25)" }} />
          <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} style={{ ...inputStyle }} />
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>—</span>
          <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} style={{ ...inputStyle }} />
        </div>
        {(search || filtroEstado !== "all" || filtroServicio !== "all" || fechaDesde || fechaHasta) && (
          <button onClick={() => { setSearch(""); setFiltroEstado("all"); setFiltroServicio("all"); setFechaDesde(""); setFechaHasta(""); }}
            style={{ ...inputStyle, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: "4px", padding: "0.5rem 0.75rem" }}>
            <X size={12} /> {a.limpiar}
          </button>
        )}
      </div>

      {/* Bulk actions */}
      {bulkSelected.size > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem", padding: "0.65rem 1rem", background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 6 }}>
          <span style={{ fontSize: 12, color: "rgba(201,168,76,0.7)", fontWeight: 600 }}>{bulkSelected.size} {a.seleccionadas}</span>
          <div style={{ display: "flex", gap: "0.4rem", marginLeft: "auto" }}>
            <button onClick={() => bulkEstado("confirmada")} style={{ ...inputStyle, fontSize: 11, padding: "4px 10px", color: "#4ade80", borderColor: "rgba(74,222,128,0.2)" }}>{a.confirmar}</button>
            <button onClick={() => bulkEstado("cancelada")}  style={{ ...inputStyle, fontSize: 11, padding: "4px 10px", color: "#fca5a5", borderColor: "rgba(252,165,165,0.2)" }}>{a.cancelar}</button>
            <button onClick={bulkDelete} style={{ ...inputStyle, fontSize: 11, padding: "4px 10px", color: "#fca5a5", borderColor: "rgba(252,165,165,0.2)", display: "flex", alignItems: "center", gap: 4 }}>
              <Trash2 size={11} /> {a.eliminar}
            </button>
            <button onClick={() => setBulkSelected(new Set())} style={{ ...inputStyle, fontSize: 11, padding: "4px 8px", color: "rgba(255,255,255,0.3)" }}><X size={11} /></button>
          </div>
        </div>
      )}

      {/* Results info */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>
          {filtered.length} {filtered.length !== 1 ? a.resultados : a.resultado}
          {filtered.length !== items.length && ` ${a.de} ${items.length}`}
        </p>
        {totalPages > 1 && (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>{a.pagina} {page} {a.de} {totalPages}</p>
        )}
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 14 }}>{a.cargando}</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "4rem", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 14 }}>
          {items.length === 0 ? a.noHayServicios : a.ningunServicioFiltros}
        </div>
      ) : (
        <>
          {/* Table */}
          <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden" }}>
            {/* Head */}
            <div style={{ display: "grid", gridTemplateColumns: "2rem 1.8fr 1.6fr 1.2fr 0.9fr 0.6fr 1.2fr", gap: "0.75rem", padding: "0.85rem 1.5rem", background: "rgba(201,168,76,0.05)", borderBottom: "1px solid rgba(255,255,255,0.06)", alignItems: "center" }}>
              <button onClick={toggleBulkAll} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0, display: "flex" }}>
                {allPageSelected ? <CheckSquare size={14} style={{ color: GOLD }} /> : <Square size={14} />}
              </button>
              {([[`nombre`,a.thCliente],[`email`,a.thEmail],[`servicio`,a.thServicio],[`fecha`,a.thFecha],[`personas`,a.thPax],[`estado`,a.thEstado]] as [SortKey,string][]).map(([key, label], idx) => (
                <button key={`${key}-${idx}`} onClick={() => toggleSort(key)} style={thStyle}>
                  {label} <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
                </button>
              ))}
            </div>

            {/* Rows */}
            {paginated.map((r, i) => {
              const isSelected = bulkSelected.has(r.id);
              return (
                <div key={r.id}
                  style={{ display: "grid", gridTemplateColumns: "2rem 1.8fr 1.6fr 1.2fr 0.9fr 0.6fr 1.2fr", gap: "0.75rem", padding: "0.9rem 1.5rem", alignItems: "center", borderBottom: i < paginated.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", background: isSelected ? "rgba(201,168,76,0.04)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)"; }}
                  onClick={() => setSelected(r)}>
                  <div onClick={e => { e.stopPropagation(); toggleBulkOne(r.id); }} style={{ display: "flex", cursor: "pointer" }}>
                    {isSelected ? <CheckSquare size={14} style={{ color: GOLD }} /> : <Square size={14} style={{ color: "rgba(255,255,255,0.2)" }} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.nombre}</p>
                    {r.empresa && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontStyle: "italic", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.empresa}</p>}
                  </div>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.email || "—"}</span>
                  <ServicioBadge servicio={r.servicio} />
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontVariantNumeric: "tabular-nums" }}>
                    {new Date(r.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)", fontVariantNumeric: "tabular-nums" }}>{r.personas}</span>
                  <Badge estado={r.estado} estadoStyles={estadoStyles} />
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", marginTop: "1.25rem" }}>
              <button onClick={() => setPage(1)} disabled={page === 1} style={{ ...inputStyle, padding: "0.4rem 0.6rem", opacity: page === 1 ? 0.3 : 1, fontSize: 12 }}>«</button>
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} style={{ ...inputStyle, padding: "0.4rem 0.6rem", opacity: page === 1 ? 0.3 : 1, display: "flex", alignItems: "center" }}><ChevronLeft size={14} /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                  acc.push(p); return acc;
                }, [])
                .map((p, i) => p === "…" ? (
                  <span key={`e-${i}`} style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, padding: "0 4px" }}>…</span>
                ) : (
                  <button key={p} onClick={() => setPage(p as number)}
                    style={{ ...inputStyle, padding: "0.4rem 0.7rem", fontSize: 12, fontWeight: page === p ? 700 : 400, background: page === p ? "rgba(201,168,76,0.12)" : inputStyle.background, color: page === p ? GOLD : "rgba(255,255,255,0.4)", borderColor: page === p ? "rgba(201,168,76,0.25)" : "rgba(255,255,255,0.08)" }}>
                    {p}
                  </button>
                ))}
              <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} style={{ ...inputStyle, padding: "0.4rem 0.6rem", opacity: page === totalPages ? 0.3 : 1, display: "flex", alignItems: "center" }}><ChevronRight size={14} /></button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ ...inputStyle, padding: "0.4rem 0.6rem", opacity: page === totalPages ? 0.3 : 1, fontSize: 12 }}>»</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

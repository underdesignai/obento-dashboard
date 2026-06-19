"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  CalendarCheck, RefreshCw, X, Trash2, Search, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, Download, CheckSquare, Square, Filter,
  Users, CheckCircle, XCircle,
} from "lucide-react";
import { useSession } from "@/lib/session";
import { useAdminLanguage } from "@/lib/LanguageContext";

function Dropdown({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", flex: "0 0 auto" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 6, color: "#fff", fontSize: 13,
          padding: "0.5rem 0.75rem", cursor: "pointer",
          display: "flex", alignItems: "center", gap: "0.5rem",
          whiteSpace: "nowrap", outline: "none",
        }}
      >
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
                border: "none", outline: "none", transition: "background 0.1s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.background = "transparent"; }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type Reserva = {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  fecha: string;
  personas: number;
  mensaje?: string;
  seccion: string;
  estado: string;
  createdAt: string;
};

type SortKey = "nombre" | "fecha" | "personas" | "estado" | "seccion" | "createdAt";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 25;

// Labels are set dynamically per language — see getEstadoStyles()
const ESTADO_STYLES_BASE: Record<string, { bg: string; text: string }> = {
  confirmada: { bg: "rgba(74,222,128,0.12)",  text: "#4ade80"  },
  cancelada:  { bg: "rgba(252,165,165,0.12)", text: "#fca5a5"  },
};

function getEstadoStyles(a: Record<string, string>): Record<string, { bg: string; text: string; label: string }> {
  return {
    confirmada: { ...ESTADO_STYLES_BASE.confirmada, label: a.statusConfirmada },
    cancelada:  { ...ESTADO_STYLES_BASE.cancelada,  label: a.statusCancelada  },
  };
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 8,
      padding: "1.35rem 1.75rem",
      display: "flex",
      alignItems: "center",
      gap: "1.25rem",
      flex: "1 1 180px",
      minWidth: 0,
    }}>
      <div style={{ color, flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", margin: "6px 0 0" }}>{label}</p>
      </div>
    </div>
  );
}

function Badge({ estado, estadoStyles }: { estado: string; estadoStyles: Record<string, { bg: string; text: string; label: string }> }) {
  const s = estadoStyles[estado] ?? { bg: "rgba(255,255,255,0.06)", text: "rgba(255,255,255,0.5)", label: estado };
  return (
    <span style={{
      fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em",
      padding: "4px 13px", borderRadius: 20,
      background: s.bg, color: s.text, fontWeight: 700, whiteSpace: "nowrap",
      display: "inline-flex", width: "fit-content",
    }}>{s.label}</span>
  );
}

function SeccionBadge({ seccion }: { seccion: string }) {
  const isSushi = seccion === "sushi";
  return (
    <span style={{
      fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em",
      padding: "4px 13px", borderRadius: 20, fontWeight: 700, whiteSpace: "nowrap",
      display: "inline-flex", width: "fit-content",
      background: isSushi ? "rgba(96,165,250,0.12)" : "rgba(201,168,76,0.1)",
      color: isSushi ? "#60a5fa" : "#c9a84c",
    }}>
      {isSushi ? "Sushi" : "Mexican"}
    </span>
  );
}

function DetailModal({ reserva, onClose, onDelete, onEstadoChange, a, estadoStyles }: {
  reserva: Reserva;
  onClose: () => void;
  onDelete: (id: number) => void;
  onEstadoChange: (id: number, estado: string) => void;
  a: Record<string, string>;
  estadoStyles: Record<string, { bg: string; text: string; label: string }>;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savingEstado, setSavingEstado] = useState(false);
  const fecha = new Date(reserva.fecha);

  async function handleDelete() {
    await fetch(`/api/admin/reservas/${reserva.id}`, { method: "DELETE" });
    onDelete(reserva.id);
    onClose();
  }

  async function handleEstado(nuevoEstado: string) {
    if (nuevoEstado === reserva.estado) return;
    setSavingEstado(true);
    await fetch(`/api/admin/reservas/${reserva.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado }),
    });
    onEstadoChange(reserva.id, nuevoEstado);
    setSavingEstado(false);
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#0e0d0b", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 12, width: "100%", maxWidth: 480, padding: "1.75rem", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div>
            <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(201,168,76,0.5)", margin: 0 }}>Reserva #{reserva.id}</p>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "0.25rem 0 0.5rem" }}>{reserva.nombre}</h2>
            <SeccionBadge seccion={reserva.seccion} />
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center", flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>

        {/* Datos */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0", marginBottom: "1.5rem", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden" }}>
          {[
            ["Email",    reserva.email || "—"],
            ["Teléfono", reserva.telefono || "—"],
            ["Fecha",    fecha.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })],
            ["Hora",     fecha.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })],
            ["Personas", String(reserva.personas)],
            ...(reserva.mensaje ? [["Mensaje", reserva.mensaje]] : []),
          ].map(([label, value], i, arr) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              gap: "1rem", padding: "0.65rem 1rem",
              borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
            }}>
              <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 13, color: label === "Mensaje" ? "rgba(255,255,255,0.5)" : "#fff", textAlign: "right", fontStyle: label === "Mensaje" ? "italic" : "normal" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Cambiar estado */}
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", marginBottom: "0.5rem" }}>{a.thEstado}</p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {["confirmada", "cancelada"].map(e => {
              const s = estadoStyles[e];
              const active = reserva.estado === e;
              return (
                <button key={e} onClick={() => handleEstado(e)} disabled={savingEstado}
                  style={{
                    flex: 1, padding: "0.5rem", borderRadius: 6, cursor: "pointer", fontSize: 11,
                    textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, transition: "all 0.15s",
                    background: active ? s.bg : "rgba(255,255,255,0.03)",
                    border: `1px solid ${active ? s.text + "40" : "rgba(255,255,255,0.07)"}`,
                    color: active ? s.text : "rgba(255,255,255,0.35)",
                    opacity: savingEstado ? 0.5 : 1,
                  }}>
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
              <button onClick={() => setConfirmDelete(false)}
                style={{ flex: 1, padding: "0.6rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 12 }}>
                {a.cancelar}
              </button>
              <button onClick={handleDelete}
                style={{ flex: 1, padding: "0.6rem", background: "rgba(252,165,165,0.12)", border: "1px solid rgba(252,165,165,0.25)", borderRadius: 4, color: "#fca5a5", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                {a.siEliminar}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronUp size={12} style={{ opacity: 0.2 }} />;
  return sortDir === "asc" ? <ChevronUp size={12} style={{ color: "#c9a84c" }} /> : <ChevronDown size={12} style={{ color: "#c9a84c" }} />;
}

export default function ReservasPage() {
  const { tr } = useAdminLanguage();
  const a = tr.admin;
  const estadoStyles = getEstadoStyles(a);

  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<Reserva | null>(null);

  // Filters
  const [search, setSearch]       = useState("");
  const [filtroEstado, setFiltroEstado] = useState("all");
  const [filtroSeccion, setFiltroSeccion] = useState("all");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // Sort
  const [sortKey, setSortKey]   = useState<SortKey>("fecha");
  const [sortDir, setSortDir]   = useState<SortDir>("desc");

  // Pagination
  const [page, setPage] = useState(1);

  // Bulk
  const [bulkSelected, setBulkSelected] = useState<Set<number>>(new Set());

  const { loaded } = useSession();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/reservas");
    if (res.ok) {
      const data = await res.json();
      sessionStorage.setItem("coyo_reservas", JSON.stringify(data));
      setReservas(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const cached = sessionStorage.getItem("coyo_reservas");
    if (cached) { setReservas(JSON.parse(cached)); setLoading(false); }
    load();
    const es = new EventSource("/api/admin/reservas/stream");
    es.onmessage = (e) => {
      try {
        const nueva = JSON.parse(e.data);
        setReservas(prev => {
          const updated = [nueva, ...prev.filter(r => r.id !== nueva.id)];
          sessionStorage.setItem("coyo_reservas", JSON.stringify(updated));
          return updated;
        });
      } catch { /* ping */ }
    };
    return () => es.close();
  }, [load]);

  // Stats
  const stats = useMemo(() => ({
    total:      reservas.length,
    confirmada: reservas.filter(r => r.estado === "confirmada").length,
    cancelada:  reservas.filter(r => r.estado === "cancelada").length,
    personas:   reservas.filter(r => r.estado !== "cancelada").reduce((s, r) => s + r.personas, 0),
  }), [reservas]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let r = reservas;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(x =>
        x.nombre.toLowerCase().includes(q) ||
        x.email.toLowerCase().includes(q) ||
        (x.telefono ?? "").toLowerCase().includes(q) ||
        (x.mensaje ?? "").toLowerCase().includes(q)
      );
    }
    if (filtroEstado !== "all")  r = r.filter(x => x.estado === filtroEstado);
    if (filtroSeccion !== "all") r = r.filter(x => x.seccion === filtroSeccion);
    if (fechaDesde) r = r.filter(x => new Date(x.fecha) >= new Date(fechaDesde));
    if (fechaHasta) r = r.filter(x => new Date(x.fecha) <= new Date(fechaHasta + "T23:59:59"));

    r = [...r].sort((a, b) => {
      let va: string | number = a[sortKey] ?? "";
      let vb: string | number = b[sortKey] ?? "";
      if (sortKey === "personas") { va = a.personas; vb = b.personas; }
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      return sortDir === "asc" ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
    });
    return r;
  }, [reservas, search, filtroEstado, filtroSeccion, fechaDesde, fechaHasta, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page on filter change
  useEffect(() => setPage(1), [search, filtroEstado, filtroSeccion, fechaDesde, fechaHasta]);

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
    setBulkSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  async function bulkDelete() {
    if (!confirm(`${a.eliminar} ${bulkSelected.size}?`)) return;
    await Promise.all([...bulkSelected].map(id => fetch(`/api/admin/reservas/${id}`, { method: "DELETE" })));
    setReservas(prev => prev.filter(r => !bulkSelected.has(r.id)));
    setBulkSelected(new Set());
  }
  async function bulkEstado(estado: string) {
    await Promise.all([...bulkSelected].map(id =>
      fetch(`/api/admin/reservas/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado }) })
    ));
    setReservas(prev => prev.map(r => bulkSelected.has(r.id) ? { ...r, estado } : r));
    setBulkSelected(new Set());
  }

  // CSV Export
  function exportCSV() {
    const cols = ["ID","Nombre","Email","Phone","Section","Date","Time","Pax","Status","Notes"];
    const rows = filtered.map(r => {
      const f = new Date(r.fecha);
      return [
        r.id,
        `"${r.nombre}"`,
        r.email,
        r.telefono ?? "",
        r.seccion,
        f.toLocaleDateString("es-ES"),
        f.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        r.personas,
        r.estado,
        `"${(r.mensaje ?? "").replace(/"/g, "'")}"`,
      ].join(",");
    });
    const csv  = [cols.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `reservas_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  const handleDelete = (id: number) => setReservas(prev => prev.filter(r => r.id !== id));
  const handleEstadoChange = (id: number, estado: string) => {
    setReservas(prev => prev.map(r => r.id === id ? { ...r, estado } : r));
    setSelected(prev => prev?.id === id ? { ...prev, estado } : prev);
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 6,
    color: "#fff",
    fontSize: 14,
    padding: "0.6rem 0.9rem",
    outline: "none",
    cursor: "pointer",
  } as React.CSSProperties;

  const thStyle = {
    fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.15em",
    color: "rgba(201,168,76,0.5)", fontWeight: 700,
    background: "none", border: "none", cursor: "pointer", padding: 0,
    display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" as const,
  };

  return (
    <div>
      {selected && (
        <DetailModal
          reserva={selected}
          onClose={() => setSelected(null)}
          onDelete={handleDelete}
          onEstadoChange={handleEstadoChange}
          a={a}
          estadoStyles={estadoStyles}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(201,168,76,0.5)", marginBottom: "0.25rem" }}>{a.gestion}</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-playfair, serif)", color: "#fff", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <CalendarCheck size={24} style={{ color: "#c9a84c" }} /> {a.reservas}
          </h1>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={exportCSV} style={{ ...inputStyle, display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", color: "rgba(201,168,76,0.7)", borderColor: "rgba(201,168,76,0.15)" }}>
            <Download size={13} /> {a.exportarCSV}
          </button>
          <button onClick={load} style={{ ...inputStyle, display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", color: "rgba(255,255,255,0.4)" }}>
            <RefreshCw size={13} /> {a.actualizar}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <StatCard icon={<CalendarCheck size={22} />} label={a.totalReservas} value={stats.total} color="#c9a84c" />
        <StatCard icon={<CheckCircle size={22} />} label={a.confirmadas} value={stats.confirmada} color="#4ade80" />
        <StatCard icon={<XCircle size={22} />} label={a.canceladas} value={stats.cancelada} color="#fca5a5" />
        <StatCard icon={<Users size={22} />} label={a.comensales} value={stats.personas} color="#60a5fa" />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 0 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", pointerEvents: "none" }} />
          <input
            type="text" placeholder={a.buscarReserva} value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, width: "100%", paddingLeft: "2rem", boxSizing: "border-box" }}
          />
        </div>

        <Dropdown
          value={filtroEstado}
          onChange={setFiltroEstado}
          options={[
            { value: "all", label: a.todosEstados },
            { value: "confirmada", label: a.statusConfirmada },
            { value: "cancelada", label: a.statusCancelada },
          ]}
        />

        <Dropdown
          value={filtroSeccion}
          onChange={setFiltroSeccion}
          options={[
            { value: "all", label: a.todasSecciones },
            { value: "mexican", label: "Mexican" },
            { value: "sushi", label: "Sushi Bar" },
          ]}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flex: "0 0 auto" }}>
          <Filter size={12} style={{ color: "rgba(255,255,255,0.25)" }} />
          <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} style={{ ...inputStyle }} />
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>—</span>
          <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} style={{ ...inputStyle }} />
        </div>

        {(search || filtroEstado !== "all" || filtroSeccion !== "all" || fechaDesde || fechaHasta) && (
          <button onClick={() => { setSearch(""); setFiltroEstado("all"); setFiltroSeccion("all"); setFechaDesde(""); setFechaHasta(""); }}
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
            <button onClick={() => bulkEstado("cancelada")}  style={{ ...inputStyle, fontSize: 11, padding: "4px 10px", color: "#fca5a5", borderColor: "rgba(252,165,165,0.2)" }}>{a.statusCancelada}</button>
            <button onClick={bulkDelete} style={{ ...inputStyle, fontSize: 11, padding: "4px 10px", color: "#fca5a5", borderColor: "rgba(252,165,165,0.2)", display: "flex", alignItems: "center", gap: 4 }}>
              <Trash2 size={11} /> {a.eliminar}
            </button>
            <button onClick={() => setBulkSelected(new Set())} style={{ ...inputStyle, fontSize: 11, padding: "4px 8px", color: "rgba(255,255,255,0.3)" }}>
              <X size={11} />
            </button>
          </div>
        </div>
      )}

      {/* Results info */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>
          {filtered.length} {filtered.length !== 1 ? a.resultados : a.resultado}
          {filtered.length !== reservas.length && ` ${a.de} ${reservas.length}`}
        </p>
        {totalPages > 1 && (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>
            {a.pagina} {page} {a.de} {totalPages}
          </p>
        )}
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 14 }}>{a.cargando}</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "4rem", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 14 }}>
          {reservas.length === 0 ? a.noHayReservas : a.ningunaCoincidefiltros}
        </div>
      ) : (
        <>
          {/* Table */}
          <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden" }}>
            {/* Head */}
            <div style={{ display: "grid", gridTemplateColumns: "2rem 1.8fr 1.6fr 1fr 1fr 0.9fr 0.6fr 0.7fr 1.1fr", gap: "0.75rem", padding: "0.85rem 1.5rem", background: "rgba(201,168,76,0.05)", borderBottom: "1px solid rgba(255,255,255,0.06)", alignItems: "center" }}>
              <button onClick={toggleBulkAll} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0, display: "flex" }}>
                {allPageSelected ? <CheckSquare size={14} style={{ color: "#c9a84c" }} /> : <Square size={14} />}
              </button>
              {([ ["nombre",a.thCliente], ["email",a.thEmail], ["seccion",a.thSeccion], ["telefono",a.thTelefono], ["fecha",a.thFecha], ["fecha",a.thHora], ["personas",a.thPax], ["estado",a.thEstado] ] as [SortKey, string][]).map(([key, label], i) => (
                <button key={`${key}-${i}`} onClick={() => toggleSort(key)} style={thStyle}>
                  {label} <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
                </button>
              ))}
            </div>

            {/* Rows */}
            {paginated.map((r, i) => {
              const fecha = new Date(r.fecha);
              const isSelected = bulkSelected.has(r.id);
              return (
                <div key={r.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2rem 1.8fr 1.6fr 1fr 1fr 0.9fr 0.6fr 0.7fr 1.1fr",
                    gap: "0.75rem", padding: "0.9rem 1.5rem", alignItems: "center",
                    borderBottom: i < paginated.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    background: isSelected ? "rgba(201,168,76,0.04)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                    cursor: "pointer", transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)"; }}
                  onClick={() => setSelected(r)}
                >
                  <div onClick={e => { e.stopPropagation(); toggleBulkOne(r.id); }} style={{ display: "flex", cursor: "pointer" }}>
                    {isSelected ? <CheckSquare size={14} style={{ color: "#c9a84c" }} /> : <Square size={14} style={{ color: "rgba(255,255,255,0.2)" }} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.nombre}</p>
                    {r.mensaje && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontStyle: "italic", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{r.mensaje}"</p>}
                  </div>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.email || "—"}</span>
                  <SeccionBadge seccion={r.seccion} />
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontVariantNumeric: "tabular-nums" }}>{r.telefono || "—"}</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontVariantNumeric: "tabular-nums" }}>
                    {fecha.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#c9a84c", fontVariantNumeric: "tabular-nums" }}>
                    {fecha.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
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
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} style={{ ...inputStyle, padding: "0.4rem 0.6rem", opacity: page === 1 ? 0.3 : 1, display: "flex", alignItems: "center" }}>
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
                  <button key={p} onClick={() => setPage(p as number)}
                    style={{ ...inputStyle, padding: "0.4rem 0.7rem", fontSize: 12, fontWeight: page === p ? 700 : 400, background: page === p ? "rgba(201,168,76,0.12)" : inputStyle.background, color: page === p ? "#c9a84c" : "rgba(255,255,255,0.4)", borderColor: page === p ? "rgba(201,168,76,0.25)" : "rgba(255,255,255,0.08)" }}>
                    {p}
                  </button>
                ))}
              <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} style={{ ...inputStyle, padding: "0.4rem 0.6rem", opacity: page === totalPages ? 0.3 : 1, display: "flex", alignItems: "center" }}>
                <ChevronRight size={14} />
              </button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ ...inputStyle, padding: "0.4rem 0.6rem", opacity: page === totalPages ? 0.3 : 1, fontSize: 12 }}>»</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

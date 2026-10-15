"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Bike, Calendar, Clock, MapPin, User, Phone, DollarSign,
  TrendingUp, Download, RefreshCw, ChevronLeft, ChevronRight,
  ExternalLink, CheckCircle2, AlertTriangle, Package, Loader2,
  Navigation, CreditCard, Banknote, ShieldCheck, CloudUpload, FolderOpen
} from "lucide-react";
import { useAdminLanguage } from "@/lib/LanguageContext";

type PedidoReparto = {
  id: number;
  numero_pedido: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_email?: string;
  direccion_entrega: string;
  direccion_detalles?: string;
  codigo_postal: string;
  repartidor_id?: string | null;
  repartidor_nombre?: string | null;
  fecha_salida_reparto?: string | null;
  fecha_entregado?: string | null;
  tiempo_entrega_minutos?: number | null;
  total: number;
  metodo_pago: string;
  estado_pago: string;
  estado_pedido: string;
  created_at: string;
  itemsCount: number;
  itemsSummary: string;
};

type RepartoKPIs = {
  totalRepartos: number;
  entregados: number;
  enReparto: number;
  pendientes: number;
  cancelados: number;
  facturacionTotal: number;
  ticketMedio: number;
  tiempoMedio: number;
  efectivoALiquidar: number;
  tarjetaOnline: number;
};

type DiaSemanaStats = {
  dia: string;
  fecha: string;
  total: number;
  facturacion: number;
  mediodia: number;
  noche: number;
};

type CPStats = {
  cp: string;
  total: number;
  facturacion: number;
};

type RepartidorStats = {
  nombre: string;
  total: number;
  entregados: number;
  enReparto: number;
  efectivo: number;
  tiempoPromedio: number;
};

type RepartosApiResponse = {
  tipo: "diario" | "semanal" | "mensual";
  periodo: { inicio: string; fin: string };
  kpis: RepartoKPIs;
  diasSemana: DiaSemanaStats[];
  zonasCP: CPStats[];
  rendimientoRepartidores: RepartidorStats[];
  repartidoresDisponibles: string[];
  pedidos: PedidoReparto[];
};

const GOLD = "#c9a84c";
const CRIMSON = "#c81e22";
const BLUE_HEADER = "rgba(96,165,250,0.04)";
const BLUE_TEXT = "rgba(96,165,250,0.5)";

const GRID_COLS = "110px minmax(180px, 1.2fr) minmax(220px, 1.5fr) 140px 90px 110px 120px 110px";

const thStyle: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.15em",
  color: BLUE_TEXT,
  fontWeight: 700,
  background: "none",
  border: "none",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  whiteSpace: "nowrap",
};

export default function RepartosPage() {
  const { lang } = useAdminLanguage();
  const [tipo, setTipo] = useState<"diario" | "semanal" | "mensual">("semanal");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<RepartosApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [expandedPedidoId, setExpandedPedidoId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/repartos?tipo=${tipo}&fecha=${fecha}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Error cargando datos de repartos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tipo, fecha]);

  const handlePrevDay = () => {
    const d = new Date(fecha);
    if (tipo === "mensual") {
      d.setMonth(d.getMonth() - 1);
    } else if (tipo === "semanal") {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setFecha(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(fecha);
    if (tipo === "mensual") {
      d.setMonth(d.getMonth() + 1);
    } else if (tipo === "semanal") {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
    setFecha(d.toISOString().slice(0, 10));
  };

  const handleDownloadPDF = (reporteTipo: "diario" | "semanal") => {
    window.open(`/api/admin/repartos/reporte?tipo=${reporteTipo}&fecha=${fecha}`, "_blank");
  };

  const [uploadingDrive, setUploadingDrive] = useState(false);
  const [driveResult, setDriveResult] = useState<{ url: string; name: string } | null>(null);

  const handleUploadDrive = async () => {
    setUploadingDrive(true);
    setDriveResult(null);
    try {
      const res = await fetch("/api/admin/repartos/subir-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "semanal", fecha }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setDriveResult({ url: json.webViewLink, name: json.fileName });
      } else {
        alert(json.error || "Error al subir a Google Drive");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión al subir reporte a Google Drive");
    } finally {
      setUploadingDrive(false);
    }
  };

  const handleUpdatePedido = async (pedidoId: number, changes: { estado_pedido?: string; repartidor_nombre?: string }) => {
    setUpdatingId(pedidoId);
    try {
      const res = await fetch("/api/admin/repartos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId, ...changes }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Error actualizando pedido:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const maxDiaTotal = useMemo(() => {
    if (!data?.diasSemana?.length) return 1;
    return Math.max(...data.diasSemana.map(d => d.total), 1);
  }, [data]);

  const kpis = data?.kpis ?? {
    totalRepartos: 0,
    entregados: 0,
    enReparto: 0,
    pendientes: 0,
    cancelados: 0,
    facturacionTotal: 0,
    ticketMedio: 0,
    tiempoMedio: 0,
    efectivoALiquidar: 0,
    tarjetaOnline: 0,
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .repartos-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 1.25rem;
        }
        .repartos-row {
          display: grid;
          grid-template-columns: ${GRID_COLS};
          gap: 0.75rem;
          padding: 0.9rem 1.5rem;
          align-items: center;
          transition: background 150ms;
        }
        .repartos-row:hover {
          background: rgba(255,255,255,0.02) !important;
        }
      `}</style>

      {/* ── TOP HEADER & CONTROLS ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bike size={20} style={{ color: GOLD }} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "-0.01em" }}>
              Seguimiento de Repartos & Repartidores
            </h1>
          </div>
          <p style={{ margin: "0.3rem 0 0 44px", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            Control diario, semanal y mensual de envíos a domicilio, rutas, tiempos y liquidación de efectivo.
          </p>
        </div>

        {/* Action Buttons & PDF */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <button
            onClick={() => handleDownloadPDF("diario")}
            style={{
              background: "rgba(201,168,76,0.08)",
              border: "1px solid rgba(201,168,76,0.25)",
              color: GOLD,
              borderRadius: 6,
              padding: "7px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 150ms",
            }}
          >
            <Download size={14} /> Reporte Diario (PDF)
          </button>

          <button
            onClick={() => handleDownloadPDF("semanal")}
            style={{
              background: "rgba(96,165,250,0.08)",
              border: "1px solid rgba(96,165,250,0.25)",
              color: "#60a5fa",
              borderRadius: 6,
              padding: "7px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 150ms",
            }}
          >
            <Download size={14} /> Reporte Semanal (PDF)
          </button>

          <button
            onClick={handleUploadDrive}
            disabled={uploadingDrive}
            style={{
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.25)",
              color: "#4ade80",
              borderRadius: 6,
              padding: "7px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: uploadingDrive ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 150ms",
            }}
          >
            {uploadingDrive ? (
              <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <CloudUpload size={14} />
            )}
            {uploadingDrive ? "Subiendo a Drive..." : "Subir a Google Drive"}
          </button>

          <a
            href="https://drive.google.com/drive/folders/1D7Js-cGvqfdCPnTtdXm_m-VwmDC5-FaG"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
              borderRadius: 6,
              padding: "7px 12px",
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 150ms",
            }}
          >
            <FolderOpen size={14} /> Abrir Drive
          </a>

          <button
            onClick={fetchData}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6,
              padding: "7px 10px",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
            title="Recargar datos"
          >
            <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

      {/* ── BANNER EXITO GOOGLE DRIVE ── */}
      {driveResult && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(34,197,94,0.1)",
          border: "1px solid rgba(34,197,94,0.3)",
          borderRadius: 8,
          padding: "0.75rem 1.25rem",
          marginBottom: "1.25rem",
          color: "#4ade80",
          fontSize: 13,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle2 size={16} />
            <span>Reporte semanal <strong>{driveResult.name}</strong> sincronizado y archivado con éxito en Google Drive.</span>
          </div>
          <a
            href={driveResult.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#fff",
              background: "rgba(34,197,94,0.25)",
              padding: "5px 12px",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Ver archivo en Drive <ExternalLink size={12} />
          </a>
        </div>
      )}

      {/* ── SELECTOR DE MODO Y FECHA ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
        {/* Toggle Tipo */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: 3 }}>
          <button
            onClick={() => setTipo("diario")}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              background: tipo === "diario" ? "rgba(200,30,34,0.18)" : "transparent",
              color: tipo === "diario" ? "#f3ede0" : "rgba(255,255,255,0.4)",
              transition: "all 150ms",
            }}
          >
            Vista Diaria
          </button>
          <button
            onClick={() => setTipo("semanal")}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              background: tipo === "semanal" ? "rgba(200,30,34,0.18)" : "transparent",
              color: tipo === "semanal" ? "#f3ede0" : "rgba(255,255,255,0.4)",
              transition: "all 150ms",
            }}
          >
            Vista Semanal
          </button>
          <button
            onClick={() => setTipo("mensual")}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              background: tipo === "mensual" ? "rgba(200,30,34,0.18)" : "transparent",
              color: tipo === "mensual" ? "#f3ede0" : "rgba(255,255,255,0.4)",
              transition: "all 150ms",
            }}
          >
            Vista Mensual / Histórico
          </button>
        </div>

        {/* Date Navigator */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={handlePrevDay}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6,
              padding: "6px 10px",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input
              type={tipo === "mensual" ? "month" : "date"}
              value={tipo === "mensual" ? fecha.slice(0, 7) : fecha}
              onChange={e => {
                if (tipo === "mensual") {
                  setFecha(`${e.target.value}-01`);
                } else {
                  setFecha(e.target.value);
                }
              }}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6,
                padding: "6px 12px",
                color: "#fff",
                fontSize: 13,
                fontFamily: "monospace",
                cursor: "pointer",
                outline: "none",
              }}
            />
          </div>

          <button
            onClick={handleNextDay}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6,
              padding: "6px 10px",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
            }}
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={() => setFecha(new Date().toISOString().slice(0, 10))}
            style={{
              background: "rgba(201,168,76,0.08)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: 6,
              padding: "6px 10px",
              color: GOLD,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Hoy
          </button>
        </div>
      </div>

      {/* ── TOP KPI CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {/* KPI 1: Volumen de Repartos */}
        <div className="repartos-card" style={{ borderLeft: `3px solid ${GOLD}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)" }}>
              Total Repartos
            </span>
            <Bike size={16} style={{ color: GOLD }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", fontFamily: "monospace", lineHeight: 1.1 }}>
            {kpis.totalRepartos}
          </div>
          <div style={{ marginTop: "0.5rem", fontSize: 12, color: "rgba(255,255,255,0.5)", display: "flex", gap: "0.5rem" }}>
            <span style={{ color: "#4ade80" }}>✓ {kpis.entregados} entregados</span>
            <span>·</span>
            <span style={{ color: "#60a5fa" }}>🛵 {kpis.enReparto} en ruta</span>
            {kpis.pendientes > 0 && (
              <>
                <span>·</span>
                <span style={{ color: "#fbbf24" }}>⏱ {kpis.pendientes} prep</span>
              </>
            )}
          </div>
        </div>

        {/* KPI 2: Facturación Delivery */}
        <div className="repartos-card" style={{ borderLeft: "3px solid #60a5fa" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)" }}>
              Facturación Delivery
            </span>
            <TrendingUp size={16} style={{ color: "#60a5fa" }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#60a5fa", fontFamily: "monospace", lineHeight: 1.1 }}>
            {Number(kpis.facturacionTotal).toFixed(2)} €
          </div>
          <div style={{ marginTop: "0.5rem", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
            Ticket medio:{" "}
            <span style={{ color: "#fff", fontWeight: 600 }}>
              {Number(kpis.ticketMedio || (kpis.totalRepartos > 0 ? kpis.facturacionTotal / kpis.totalRepartos : 0)).toFixed(2)} €
            </span>
          </div>
        </div>

        {/* KPI 3: Tiempo Medio de Entrega */}
        <div className="repartos-card" style={{ borderLeft: "3px solid #4ade80" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)" }}>
              Tiempo Medio de Entrega
            </span>
            <Clock size={16} style={{ color: "#4ade80" }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#4ade80", fontFamily: "monospace", lineHeight: 1.1 }}>
            {kpis.tiempoMedio > 0 ? `${kpis.tiempoMedio} min` : "—"}
          </div>
          <div style={{ marginTop: "0.5rem", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
            {kpis.tiempoMedio > 0 && kpis.tiempoMedio <= 35 ? (
              <span style={{ color: "#4ade80" }}>⚡ Servicio ágil (&lt;35m)</span>
            ) : kpis.tiempoMedio > 45 ? (
              <span style={{ color: "#ef4444" }}>⚠ Demoras detectadas (&gt;45m)</span>
            ) : (
              <span>Ritmo estándar de cocina y reparto</span>
            )}
          </div>
        </div>

        {/* KPI 4: Liquidación Efectivo vs Online */}
        <div className="repartos-card" style={{ borderLeft: "3px solid #fbbf24" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)" }}>
              Liquidación en Mano (Efectivo)
            </span>
            <Banknote size={16} style={{ color: "#fbbf24" }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#fbbf24", fontFamily: "monospace", lineHeight: 1.1 }}>
            {Number(kpis.efectivoALiquidar).toFixed(2)} €
          </div>
          <div style={{ marginTop: "0.5rem", fontSize: 12, color: "rgba(255,255,255,0.5)", display: "flex", justifyContent: "space-between" }}>
            <span>Cobrado en efectivo</span>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>Online: {Number(kpis.tarjetaOnline).toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {/* ── BARRAS SEMANALES: RASTREO POR DÍAS (LUNES A DOMINGO) ── */}
      <div className="repartos-card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>
              Rastreo de Repartos por Día de la Semana
            </h3>
            <p style={{ margin: "0.25rem 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              Distribución de volumen diario y turnos (Mediodía vs Noche)
            </p>
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
            {data?.periodo ? `${data.periodo.inicio.slice(0, 10)} / ${data.periodo.fin.slice(0, 10)}` : "Semana activa"}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.75rem", alignItems: "flex-end", minHeight: 180, paddingTop: "1rem" }}>
          {(data?.diasSemana ?? []).map((d) => {
            const barHeightPct = Math.max(12, Math.round((d.total / maxDiaTotal) * 100));
            const isToday = d.fecha === new Date().toISOString().slice(0, 10);
            return (
              <div
                key={d.dia}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  background: isToday ? "rgba(201,168,76,0.05)" : "rgba(255,255,255,0.01)",
                  border: isToday ? "1px solid rgba(201,168,76,0.25)" : "1px solid rgba(255,255,255,0.04)",
                  borderRadius: 6,
                  padding: "0.75rem 0.5rem",
                  transition: "all 150ms",
                }}
              >
                {/* Facturación sobre la barra */}
                <span style={{ fontSize: 11, fontWeight: 700, color: d.facturacion > 0 ? "#60a5fa" : "rgba(255,255,255,0.2)", fontFamily: "monospace", marginBottom: 6 }}>
                  {d.facturacion > 0 ? `${d.facturacion.toFixed(0)}€` : "—"}
                </span>

                {/* Barra Visual */}
                <div style={{ width: "100%", maxWidth: 36, height: 90, background: "rgba(255,255,255,0.03)", borderRadius: 4, display: "flex", alignItems: "flex-end", overflow: "hidden", position: "relative" }}>
                  <div
                    style={{
                      width: "100%",
                      height: `${barHeightPct}%`,
                      background: d.total > 0
                        ? isToday
                          ? "linear-gradient(180deg, #c9a84c 0%, rgba(201,168,76,0.5) 100%)"
                          : "linear-gradient(180deg, #60a5fa 0%, rgba(96,165,250,0.4) 100%)"
                        : "transparent",
                      borderRadius: "3px 3px 0 0",
                      transition: "height 300ms ease-out",
                    }}
                  />
                </div>

                {/* Cantidad Total */}
                <div style={{ marginTop: 8, fontSize: 16, fontWeight: 800, color: d.total > 0 ? "#fff" : "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
                  {d.total}
                </div>

                {/* Día */}
                <div style={{ marginTop: 2, fontSize: 12, fontWeight: 700, color: isToday ? GOLD : "rgba(255,255,255,0.7)" }}>
                  {d.dia}
                </div>

                {/* Turnos */}
                <div style={{ marginTop: 4, fontSize: 10, color: "rgba(255,255,255,0.35)", display: "flex", gap: 4 }}>
                  <span>☀ {d.mediodia}</span>
                  <span>·</span>
                  <span>🌙 {d.noche}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 2 COLUMNAS: RENDIMIENTO REPARTIDORES & CÓDIGOS POSTALES ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
        {/* Panel Repartidores & Liquidación de Efectivo */}
        <div className="repartos-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <User size={16} style={{ color: GOLD }} />
              Rendimiento de Repartidores & Liquidación
            </h3>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
              Efectivo a entregar en caja
            </span>
          </div>

          {(data?.rendimientoRepartidores ?? []).length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center", padding: "1.5rem 0" }}>
              No hay repartidores con entregas en este período
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {data?.rendimientoRepartidores.map((rep) => (
                <div
                  key={rep.nombre}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: GOLD }}>
                      {rep.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{rep.nombre}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                        {rep.entregados} de {rep.total} entregados
                        {rep.tiempoPromedio > 0 ? ` · ~${rep.tiempoPromedio} min/reparto` : ""}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>
                      Efectivo en mano
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: rep.efectivo > 0 ? "#fbbf24" : "#4ade80", fontFamily: "monospace" }}>
                      {rep.efectivo.toFixed(2)} €
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel Zonas & Códigos Postales */}
        <div className="repartos-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={16} style={{ color: "#60a5fa" }} />
              Zonas y Códigos Postales Top
            </h3>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
              Rastreo por zona geográfica
            </span>
          </div>

          {(data?.zonasCP ?? []).length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center", padding: "1.5rem 0" }}>
              Sin registros de códigos postales en este período
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {data?.zonasCP.map((item) => (
                <div
                  key={item.cp}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, color: "#60a5fa" }}>
                      CP
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "monospace" }}>
                        {item.cp}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                        {item.total} {item.total === 1 ? "reparto realizado" : "repartos realizados"}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>
                      Facturado
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#60a5fa", fontFamily: "monospace" }}>
                      {item.facturacion.toFixed(2)} €
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── TABLA DE REPARTOS CON EL FORMATO ESTANDARIZADO EXACTO ── */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>
              Listado Detallado de Pedidos y Entregas
            </h2>
            <p style={{ margin: "0.2rem 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              Asigna repartidores en tiempo real, abre la ruta en Google Maps y confirma la entrega.
            </p>
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            {data?.pedidos?.length ?? 0} pedidos encontrados
          </span>
        </div>

        {/* CONTENEDOR IDÉNTICO AL ESTÁNDAR DEL DASHBOARD */}
        <div style={{ overflowX: "auto", width: "100%", paddingBottom: "1rem" }}>
          <div style={{ minWidth: 1060, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden" }}>
            {/* CABECERA ESTANDARIZADA IDÉNTICA A PEDIDOS */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: GRID_COLS,
                gap: "0.75rem",
                padding: "0.85rem 1.5rem",
                background: BLUE_HEADER,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                alignItems: "center",
              }}
            >
              <span style={thStyle}>HORA / PEDIDO</span>
              <span style={thStyle}>CLIENTE / TELÉFONO</span>
              <span style={thStyle}>DIRECCIÓN / CP</span>
              <span style={thStyle}>REPARTIDOR</span>
              <span style={{ ...thStyle, justifyContent: "center" }}>TIEMPO</span>
              <span style={{ ...thStyle, justifyContent: "flex-end" }}>TOTAL / PAGO</span>
              <span style={{ ...thStyle, justifyContent: "center" }}>ESTADO</span>
              <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: BLUE_TEXT, fontWeight: 700, textAlign: "center", display: "block" }}>
                ACCIÓN
              </span>
            </div>

            {/* FILAS DE REPARTO */}
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "rgba(255,255,255,0.25)", fontSize: 13, padding: "3rem 0" }}>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Cargando repartos...
              </div>
            ) : (data?.pedidos ?? []).length === 0 ? (
              <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, textAlign: "center", padding: "3rem 0" }}>
                No hay pedidos de reparto a domicilio para el filtro seleccionado.
              </div>
            ) : (
              data?.pedidos.map((p, idx) => {
                const isEven = idx % 2 === 0;
                const isExpanded = expandedPedidoId === p.id;
                const isDelivered = p.estado_pedido === "entregado";
                const isOutForDelivery = p.estado_pedido === "en_reparto";
                const horaCreacion = new Date(p.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.direccion_entrega || ""}, ${p.codigo_postal || "Murcia"}`)}`;

                return (
                  <React.Fragment key={p.id}>
                    <div
                      className="repartos-row"
                      style={{
                        background: isEven ? "transparent" : "rgba(255,255,255,0.01)",
                        borderBottom: isExpanded ? "none" : "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      {/* 1. HORA / PEDIDO */}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "monospace" }}>
                          #{p.numero_pedido}
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 3 }}>
                          <Clock size={11} /> {horaCreacion}
                        </div>
                      </div>

                      {/* 2. CLIENTE / TELÉFONO */}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#f3ede0" }}>
                          {p.cliente_nombre || "Cliente"}
                        </div>
                        {p.cliente_telefono && (
                          <a
                            href={`tel:${p.cliente_telefono}`}
                            style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}
                          >
                            <Phone size={10} /> {p.cliente_telefono}
                          </a>
                        )}
                      </div>

                      {/* 3. DIRECCIÓN / CP */}
                      <div>
                        <div style={{ fontSize: 12, color: "#fff", lineHeight: 1.3, display: "flex", alignItems: "flex-start", gap: 4 }}>
                          <MapPin size={12} style={{ color: "#60a5fa", flexShrink: 0, marginTop: 2 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.direccion_entrega || "Dirección no especificada"}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginLeft: 16, display: "flex", alignItems: "center", gap: 6 }}>
                          <span>CP: {p.codigo_postal || "—"}</span>
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#60a5fa", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 2, fontSize: 10, fontWeight: 600 }}
                          >
                            <Navigation size={10} /> Mapa
                          </a>
                        </div>
                      </div>

                      {/* 4. REPARTIDOR SELECT */}
                      <div>
                        <select
                          value={p.repartidor_nombre || ""}
                          disabled={updatingId === p.id}
                          onChange={(e) => handleUpdatePedido(p.id, { repartidor_nombre: e.target.value })}
                          style={{
                            width: "100%",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 6,
                            padding: "4px 8px",
                            color: p.repartidor_nombre ? "#fff" : "rgba(255,255,255,0.4)",
                            fontSize: 12,
                            outline: "none",
                            cursor: "pointer",
                          }}
                        >
                          <option value="" style={{ background: "#0e0d0b", color: "#888" }}>Sin asignar</option>
                          {data?.repartidoresDisponibles.map((r) => (
                            <option key={r} value={r} style={{ background: "#0e0d0b", color: "#fff" }}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 5. TIEMPO */}
                      <div style={{ textAlign: "center" }}>
                        {p.tiempo_entrega_minutos ? (
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              fontFamily: "monospace",
                              color: p.tiempo_entrega_minutos <= 35 ? "#4ade80" : p.tiempo_entrega_minutos > 45 ? "#ef4444" : "#fbbf24",
                            }}
                          >
                            {p.tiempo_entrega_minutos} min
                          </span>
                        ) : isOutForDelivery ? (
                          <span style={{ fontSize: 11, color: "#60a5fa", fontWeight: 600 }}>En reparto</span>
                        ) : (
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>—</span>
                        )}
                      </div>

                      {/* 6. TOTAL / PAGO */}
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", fontFamily: "monospace" }}>
                          {Number(p.total).toFixed(2)} €
                        </div>
                        <div style={{ fontSize: 10, color: (p.metodo_pago === "local" || p.metodo_pago === "restaurante") ? "#fbbf24" : "#60a5fa", textTransform: "uppercase", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 2 }}>
                          {(p.metodo_pago === "local" || p.metodo_pago === "restaurante") ? (
                            <>
                              <Banknote size={10} /> Efectivo
                            </>
                          ) : (
                            <>
                              <CreditCard size={10} /> Online
                            </>
                          )}
                        </div>
                      </div>

                      {/* 7. ESTADO BADGE */}
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 12,
                            border: `1px solid ${
                              isDelivered
                                ? "rgba(74,222,128,0.3)"
                                : isOutForDelivery
                                ? "rgba(96,165,250,0.3)"
                                : "rgba(251,191,36,0.3)"
                            }`,
                            background: isDelivered
                              ? "rgba(74,222,128,0.08)"
                              : isOutForDelivery
                              ? "rgba(96,165,250,0.08)"
                              : "rgba(251,191,36,0.08)",
                            color: isDelivered
                              ? "#4ade80"
                              : isOutForDelivery
                              ? "#60a5fa"
                              : "#fbbf24",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isDelivered ? "Entregado" : isOutForDelivery ? "En Camino" : "Preparando"}
                        </span>
                      </div>

                      {/* 8. ACCIÓN */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        {!isDelivered && (
                          <button
                            disabled={updatingId === p.id}
                            onClick={() => {
                              if (isOutForDelivery) {
                                handleUpdatePedido(p.id, { estado_pedido: "entregado" });
                              } else {
                                handleUpdatePedido(p.id, { estado_pedido: "en_reparto" });
                              }
                            }}
                            title={isOutForDelivery ? "Marcar como Entregado" : "Enviar a Reparto"}
                            style={{
                              background: isOutForDelivery ? "rgba(74,222,128,0.1)" : "rgba(96,165,250,0.1)",
                              border: `1px solid ${isOutForDelivery ? "rgba(74,222,128,0.25)" : "rgba(96,165,250,0.25)"}`,
                              borderRadius: 6,
                              padding: "4px 8px",
                              color: isOutForDelivery ? "#4ade80" : "#60a5fa",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {updatingId === p.id ? (
                              <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                            ) : isOutForDelivery ? (
                              <>
                                <CheckCircle2 size={12} /> Entregar
                              </>
                            ) : (
                              <>
                                <Bike size={12} /> Salir
                              </>
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => setExpandedPedidoId(isExpanded ? null : p.id)}
                          style={{
                            background: isExpanded ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: 6,
                            padding: "4px 7px",
                            color: "rgba(255,255,255,0.5)",
                            fontSize: 11,
                            cursor: "pointer",
                          }}
                          title="Ver detalle del pedido"
                        >
                          {isExpanded ? "▲" : "▼"}
                        </button>
                      </div>
                    </div>

                    {/* EXPANDED ITEMS DRAWER */}
                    {isExpanded && (
                      <div
                        style={{
                          background: "rgba(96,165,250,0.02)",
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                          padding: "1rem 2rem",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                          <div>
                            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: GOLD, fontWeight: 700, marginBottom: "0.5rem" }}>
                              Platos y Productos
                            </div>
                            {!p.itemsSummary ? (
                              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>Sin desglose de platos disponible</p>
                            ) : (
                              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
                                {p.itemsSummary}
                              </div>
                            )}
                          </div>

                          {p.direccion_detalles && (
                            <div style={{ maxWidth: 300 }}>
                              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "#f87171", fontWeight: 700, marginBottom: "0.4rem" }}>
                                Detalles de Dirección / Notas
                              </div>
                              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.6)", fontStyle: "italic", background: "rgba(255,255,255,0.02)", padding: "6px 10px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.04)" }}>
                                "{p.direccion_detalles}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

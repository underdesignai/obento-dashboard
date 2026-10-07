"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp, TrendingDown, ShoppingBag, Euro, Users, ShoppingCart,
  AlertTriangle, CheckCircle2, Clock, Calendar, RefreshCw, Award,
  Flame, ArrowRight, CreditCard, Store, HelpCircle, Utensils
} from "lucide-react";
import { useAdminLanguage } from "@/lib/LanguageContext";

// ─── TIPOS ───────────────────────────────────────────────────────────────────

type Periodo = "hoy" | "semana" | "mes" | "ano" | "todo";

type DishStat = {
  rank: number;
  dishId?: string;
  id?: number;
  nombre: string;
  categoria: string;
  cantidad: number;
  ingresos?: number;
  precio?: number;
  porcentaje?: number;
  imagen?: string | null;
  estado?: string;
};

type CategoriaStat = {
  categoria: string;
  label: string;
  cantidad: number;
  ingresos: number;
  porcentaje: number;
};

type AnalyticsData = {
  period: string;
  rango: { desde: string; hasta: string };
  kpis: {
    totalPedidos: number;
    growthPedidos: number;
    totalFacturado: number;
    growthFacturado: number;
    ticketMedio: number;
    growthTicket: number;
    totalItemsVendidos: number;
    platosPorPedido: number;
    pagosOnline: number;
    pagosLocal: number;
  };
  funnel: {
    visitasWeb: number;
    anadidosCarrito: number;
    checkoutsIniciados: number;
    pedidosCompletados: number;
    carritosAbandonados: number;
    tasaAbandono: number;
    tasaConversion: number;
  };
  masVendidos: DishStat[];
  menosVendidos: DishStat[];
  ventasPorCategoria: CategoriaStat[];
  turnos: {
    almuerzo: number;
    cena: number;
    otros: number;
    porcentajeCena: number;
    porcentajeAlmuerzo: number;
  };
  horasDistribucion: { hora: string; pedidos: number }[];
  diasDistribucion: { dia: string; pedidos: number; porcentaje: number }[];
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fmtEur(n: number = 0) {
  return n.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";
}

function fmtNum(n: number = 0) {
  return n.toLocaleString("es-ES");
}

export default function AnalyticsPage() {
  const { tr } = useAdminLanguage();
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [tabPlatos, setTabPlatos] = useState<"mas" | "menos">("mas");

  const loadData = async (p: Periodo = periodo) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?period=${p}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Error al cargar analíticas:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(periodo);
  }, [periodo]);

  const k = data?.kpis;
  const f = data?.funnel;

  return (
    <div style={{ maxWidth: 1300, margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Cabecera Principal y Filtros Temporales */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1.25rem",
        marginBottom: "2rem",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        paddingBottom: "1.25rem",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#c81e22", display: "inline-block" }} />
            <p style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.25em",
              color: "#c9a84c",
              fontWeight: 700,
              margin: 0,
            }}>
              Métricas & Inteligencia de Negocio
            </p>
          </div>
          <h1 style={{
            fontSize: 26,
            fontWeight: 800,
            color: "#fff",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            letterSpacing: "-0.02em",
          }}>
            Analítica de Pedidos & Takeaway
          </h1>
        </div>

        {/* Selector de Períodos: Hoy | Semana | Mes | Año | Todo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{
            display: "flex",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            padding: 3,
            gap: 2,
          }}>
            {[
              { id: "hoy", label: "Hoy" },
              { id: "semana", label: "Semana (7d)" },
              { id: "mes", label: "Mes (30d)" },
              { id: "ano", label: "Año" },
              { id: "todo", label: "Histórico" },
            ].map((tab) => {
              const active = periodo === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPeriodo(tab.id as Periodo)}
                  style={{
                    border: "none",
                    outline: "none",
                    cursor: "pointer",
                    padding: "0.45rem 0.85rem",
                    borderRadius: 6,
                    fontSize: 12.5,
                    fontWeight: active ? 700 : 500,
                    background: active ? "linear-gradient(135deg, #c81e22, #991316)" : "transparent",
                    color: active ? "#fff" : "rgba(255,255,255,0.6)",
                    boxShadow: active ? "0 2px 8px rgba(200,30,34,0.35)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => loadData(periodo)}
            title="Actualizar datos"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "0.55rem 0.75rem",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hide-on-mobile">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Grid Superior de 6 KPIs Clave */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
        gap: "1rem",
        marginBottom: "1.75rem",
      }}>
        {/* KPI 1: Total Pedidos */}
        <div style={kpiCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={kpiLabelStyle}>Total Pedidos</span>
            <div style={{ ...iconBadgeStyle, background: "rgba(200,30,34,0.15)", color: "#ff6b6e" }}>
              <ShoppingBag size={17} />
            </div>
          </div>
          <div style={kpiValueStyle}>{k ? fmtNum(k.totalPedidos) : "—"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: 11.5, marginTop: "0.4rem" }}>
            {k && k.growthPedidos >= 0 ? (
              <span style={{ color: "#4ade80", fontWeight: 700, display: "flex", alignItems: "center" }}>
                <TrendingUp size={13} style={{ marginRight: 2 }} /> +{k.growthPedidos}%
              </span>
            ) : (
              <span style={{ color: "#f87171", fontWeight: 700, display: "flex", alignItems: "center" }}>
                <TrendingDown size={13} style={{ marginRight: 2 }} /> {k?.growthPedidos}%
              </span>
            )}
            <span style={{ color: "rgba(255,255,255,0.4)" }}>vs período anterior</span>
          </div>
        </div>

        {/* KPI 2: Facturación Total */}
        <div style={kpiCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={kpiLabelStyle}>Facturación Total</span>
            <div style={{ ...iconBadgeStyle, background: "rgba(201,168,76,0.15)", color: "#e8c970" }}>
              <Euro size={17} />
            </div>
          </div>
          <div style={{ ...kpiValueStyle, color: "#fff" }}>{k ? fmtEur(k.totalFacturado) : "—"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: 11.5, marginTop: "0.4rem" }}>
            {k && k.growthFacturado >= 0 ? (
              <span style={{ color: "#4ade80", fontWeight: 700, display: "flex", alignItems: "center" }}>
                <TrendingUp size={13} style={{ marginRight: 2 }} /> +{k.growthFacturado}%
              </span>
            ) : (
              <span style={{ color: "#f87171", fontWeight: 700, display: "flex", alignItems: "center" }}>
                <TrendingDown size={13} style={{ marginRight: 2 }} /> {k?.growthFacturado}%
              </span>
            )}
            <span style={{ color: "rgba(255,255,255,0.4)" }}>vs período anterior</span>
          </div>
        </div>

        {/* KPI 3: Ticket Medio */}
        <div style={kpiCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={kpiLabelStyle}>Ticket Medio</span>
            <div style={{ ...iconBadgeStyle, background: "rgba(56,189,248,0.15)", color: "#38bdf8" }}>
              <CreditCard size={17} />
            </div>
          </div>
          <div style={kpiValueStyle}>{k ? fmtEur(k.ticketMedio) : "—"}</div>
          <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginTop: "0.4rem" }}>
            Promedio: <b style={{ color: "#fff" }}>{k?.platosPorPedido || 0} platos</b> / pedido
          </div>
        </div>

        {/* KPI 4: Visitas Web */}
        <div style={kpiCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={kpiLabelStyle}>Visitas Web</span>
            <div style={{ ...iconBadgeStyle, background: "rgba(168,85,247,0.15)", color: "#c084fc" }}>
              <Users size={17} />
            </div>
          </div>
          <div style={kpiValueStyle}>{f ? fmtNum(f.visitasWeb) : "—"}</div>
          <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginTop: "0.4rem" }}>
            Tráfico en <b style={{ color: "#fff" }}>Obentojapanesefood.es</b>
          </div>
        </div>

        {/* KPI 5: Añadidos al Carrito */}
        <div style={kpiCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={kpiLabelStyle}>Entraron al Carrito</span>
            <div style={{ ...iconBadgeStyle, background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>
              <ShoppingCart size={17} />
            </div>
          </div>
          <div style={kpiValueStyle}>{f ? fmtNum(f.anadidosCarrito) : "—"}</div>
          <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginTop: "0.4rem" }}>
            <b style={{ color: "#fbbf24" }}>{f?.visitasWeb ? Math.round((f.anadidosCarrito / f.visitasWeb) * 100) : 0}%</b> de las visitas
          </div>
        </div>

        {/* KPI 6: Carritos Abandonados */}
        <div style={{ ...kpiCardStyle, borderColor: "rgba(200,30,34,0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={kpiLabelStyle}>Carritos Abandonados</span>
            <div style={{ ...iconBadgeStyle, background: "rgba(239,68,68,0.18)", color: "#f87171" }}>
              <AlertTriangle size={17} />
            </div>
          </div>
          <div style={{ ...kpiValueStyle, color: "#f87171" }}>{f ? fmtNum(f.carritosAbandonados) : "—"}</div>
          <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginTop: "0.4rem" }}>
            Tasa de abandono: <b style={{ color: "#f87171" }}>{f?.tasaAbandono || 0}%</b>
          </div>
        </div>
      </div>

      {/* Embudo de Conversión Takeaway (Funnel Step-by-Step) */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12,
        padding: "1.5rem",
        marginBottom: "1.75rem",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              Embudo de Conversión de Pedidos (Funnel Web)
            </h2>
            <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)", margin: "0.25rem 0 0 0" }}>
              Seguimiento desde que el cliente entra en la web hasta que confirma el pedido para recoger
            </p>
          </div>
          <div style={{
            background: "rgba(74,222,128,0.12)",
            border: "1px solid rgba(74,222,128,0.25)",
            padding: "0.35rem 0.75rem",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            color: "#4ade80",
          }}>
            Tasa de Conversión: {f?.tasaConversion || 0}%
          </div>
        </div>

        {/* 4 Pasos del Embudo */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem" }}>
          {/* Paso 1: Visitas */}
          <div style={funnelStepStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>1. Visitas a la Web</span>
              <span style={{ fontSize: 12, color: "#fff", fontWeight: 700 }}>100%</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: "0.5rem" }}>
              {f ? fmtNum(f.visitasWeb) : 0}
            </div>
            <div style={funnelTrackBar}>
              <div style={{ height: "100%", width: "100%", background: "#60a5fa", borderRadius: 4 }} />
            </div>
            <p style={funnelNoteStyle}>Personas que entraron a ver la web o carta</p>
          </div>

          {/* Paso 2: Añadieron a Cesta */}
          <div style={funnelStepStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>2. Añadieron Platos</span>
              <span style={{ fontSize: 12, color: "#fbbf24", fontWeight: 700 }}>
                {f?.visitasWeb ? Math.round((f.anadidosCarrito / f.visitasWeb) * 100) : 0}%
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fbbf24", marginBottom: "0.5rem" }}>
              {f ? fmtNum(f.anadidosCarrito) : 0}
            </div>
            <div style={funnelTrackBar}>
              <div style={{
                height: "100%",
                width: `${f?.visitasWeb ? Math.min(100, Math.round((f.anadidosCarrito / f.visitasWeb) * 100)) : 0}%`,
                background: "#fbbf24",
                borderRadius: 4,
              }} />
            </div>
            <p style={funnelNoteStyle}>Clientes con productos en su pedido</p>
          </div>

          {/* Paso 3: Abrieron Checkout */}
          <div style={funnelStepStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>3. Pasaron a Pagar</span>
              <span style={{ fontSize: 12, color: "#c084fc", fontWeight: 700 }}>
                {f?.anadidosCarrito ? Math.round((f.checkoutsIniciados / f.anadidosCarrito) * 100) : 0}%
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#c084fc", marginBottom: "0.5rem" }}>
              {f ? fmtNum(f.checkoutsIniciados) : 0}
            </div>
            <div style={funnelTrackBar}>
              <div style={{
                height: "100%",
                width: `${f?.visitasWeb ? Math.min(100, Math.round((f.checkoutsIniciados / f.visitasWeb) * 100)) : 0}%`,
                background: "#c084fc",
                borderRadius: 4,
              }} />
            </div>
            <p style={funnelNoteStyle}>Eligieron hora y método de pago</p>
          </div>

          {/* Paso 4: Pedido Confirmado */}
          <div style={{ ...funnelStepStyle, borderColor: "rgba(74,222,128,0.25)", background: "rgba(74,222,128,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>4. Pedidos Completados</span>
              <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>
                {f?.tasaConversion || 0}%
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#4ade80", marginBottom: "0.5rem" }}>
              {f ? fmtNum(f.pedidosCompletados) : 0}
            </div>
            <div style={funnelTrackBar}>
              <div style={{
                height: "100%",
                width: `${f?.visitasWeb ? Math.min(100, Math.round((f.pedidosCompletados / f.visitasWeb) * 100)) : 0}%`,
                background: "linear-gradient(90deg, #c81e22, #4ade80)",
                borderRadius: 4,
              }} />
            </div>
            <p style={{ ...funnelNoteStyle, color: "rgba(74,222,128,0.7)" }}>
              Pedidos confirmados para cocina
            </p>
          </div>
        </div>

        {/* Callout de Carritos Abandonados con Oportunidad de Venta */}
        <div style={{
          marginTop: "1.25rem",
          padding: "0.85rem 1.15rem",
          background: "rgba(200,30,34,0.08)",
          border: "1px solid rgba(200,30,34,0.2)",
          borderRadius: 8,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(200,30,34,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ff6b6e" }}>
              <AlertTriangle size={16} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>
                {f?.carritosAbandonados || 0} clientes seleccionaron platos pero no finalizaron su compra
              </p>
              <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", margin: "0.15rem 0 0 0" }}>
                Una tasa de abandono del {f?.tasaAbandono || 0}% es habitual en takeaway. Puedes incentivar la compra rápida mediante ofertas temporales o cupones de bienvenida.
              </p>
            </div>
          </div>

          <a
            href="/cupones"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 6,
              padding: "0.45rem 0.85rem",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            Crear Cupón de Oferta <ArrowRight size={13} />
          </a>
        </div>
      </div>

      {/* Grid de 2 Columnas: Platos Más Pedidos vs Platos Menos Pedidos */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
        gap: "1.5rem",
        marginBottom: "1.75rem",
      }}>
        {/* Columna Izquierda: Los Más Pedidos (Best Sellers) */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
          padding: "1.5rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Flame size={18} style={{ color: "#f97316" }} /> Top 10 Platos Más Pedidos
              </h2>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0.2rem 0 0 0" }}>
                Los favoritos de tus clientes con mayor rotación e ingresos
              </p>
            </div>
            <span style={{ fontSize: 11, background: "rgba(249,115,22,0.12)", color: "#f97316", padding: "0.25rem 0.6rem", borderRadius: 4, fontWeight: 700 }}>
              Best Sellers
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {data?.masVendidos?.map((dish, i) => {
              const medalla = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
              const esPodio = i < 3;
              return (
                <div
                  key={dish.nombre + i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.65rem 0.85rem",
                    background: esPodio ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.015)",
                    border: esPodio ? "1px solid rgba(201,168,76,0.2)" : "1px solid rgba(255,255,255,0.04)",
                    borderRadius: 8,
                    gap: "0.75rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                    <span style={{
                      fontSize: esPodio ? 16 : 12,
                      fontWeight: 700,
                      width: 24,
                      textAlign: "center",
                      color: esPodio ? "#c9a84c" : "rgba(255,255,255,0.4)",
                    }}>
                      {medalla}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {dish.nombre}
                      </p>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "capitalize" }}>
                        {dish.categoria}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 800, color: "#4ade80", margin: 0 }}>
                      {fmtNum(dish.cantidad)} <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>uds</span>
                    </p>
                    <p style={{ fontSize: 11.5, color: "#c9a84c", margin: "0.1rem 0 0 0", fontWeight: 600 }}>
                      {fmtEur(dish.ingresos)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna Derecha: Los Menos Pedidos (Baja Rotación / Oportunidad de Oferta) */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
          padding: "1.5rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertTriangle size={18} style={{ color: "#f87171" }} /> Platos Menos Pedidos (Baja Rotación)
              </h2>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0.2rem 0 0 0" }}>
                Platos de la carta con baja o nula salida en el período para optimizar stock u ofertar
              </p>
            </div>
            <span style={{ fontSize: 11, background: "rgba(239,68,68,0.12)", color: "#f87171", padding: "0.25rem 0.6rem", borderRadius: 4, fontWeight: 700 }}>
              Revisar Carta
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {data?.menosVendidos?.map((dish, i) => (
              <div
                key={dish.nombre + i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.65rem 0.85rem",
                  background: "rgba(255,255,255,0.015)",
                  border: "1px solid rgba(255,255,255,0.04)",
                  borderRadius: 8,
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, width: 20, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
                    #{i + 1}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: "rgba(255,255,255,0.85)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {dish.nombre}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "capitalize" }}>
                        {dish.categoria}
                      </span>
                      <span style={{ fontSize: 11, color: "#c9a84c" }}>
                        · {fmtEur(dish.precio)}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "0.25rem 0.55rem",
                    borderRadius: 4,
                    background: dish.cantidad === 0 ? "rgba(239,68,68,0.15)" : "rgba(251,191,36,0.12)",
                    color: dish.cantidad === 0 ? "#f87171" : "#fbbf24",
                  }}>
                    {dish.cantidad === 0 ? "0 pedidos" : `${dish.cantidad} uds`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Inferior: Categorías de la Carta + Horas Punta de Takeaway */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
        gap: "1.5rem",
      }}>
        {/* Desglose de Ventas por Categoría */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
          padding: "1.5rem",
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 0.25rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Utensils size={18} style={{ color: "#c9a84c" }} /> Ventas por Categoría de la Carta
          </h2>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 1.25rem 0" }}>
            Distribución de volumen y facturación según sección del menú
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {data?.ventasPorCategoria?.map((cat) => {
              const color =
                cat.categoria === "sushi" ? "#c81e22" :
                cat.categoria === "calientes" ? "#f97316" :
                cat.categoria === "entrantes" ? "#fbbf24" :
                cat.categoria === "postres" ? "#ec4899" : "#38bdf8";

              return (
                <div key={cat.categoria}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>{cat.label}</span>
                      <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)" }}>({fmtNum(cat.cantidad)} uds)</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>{fmtEur(cat.ingresos)}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: color, marginLeft: "0.5rem" }}>{cat.porcentaje}%</span>
                    </div>
                  </div>
                  <div style={{ height: 7, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${cat.porcentaje}%`,
                      background: color,
                      borderRadius: 4,
                      transition: "width 0.4s ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Horarios Punta y Modos de Pago */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
          padding: "1.5rem",
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 0.25rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Clock size={18} style={{ color: "#38bdf8" }} /> Horas Punta & Turnos de Pedido
          </h2>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 1.25rem 0" }}>
            Concentración de pedidos entre comidas y cenas
          </p>

          {/* Turnos Comida vs Cena */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
              padding: "1rem",
            }}>
              <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Turno Cenas (20h - 24h)
              </span>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginTop: "0.3rem" }}>
                {fmtNum(data?.turnos?.cena || 0)} <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>pedidos</span>
              </div>
              <p style={{ fontSize: 12, color: "#c81e22", fontWeight: 700, margin: "0.2rem 0 0 0" }}>
                {data?.turnos?.porcentajeCena || 0}% del volumen
              </p>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
              padding: "1rem",
            }}>
              <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Turno Comidas (13h - 16h)
              </span>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginTop: "0.3rem" }}>
                {fmtNum(data?.turnos?.almuerzo || 0)} <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>pedidos</span>
              </div>
              <p style={{ fontSize: 12, color: "#c9a84c", fontWeight: 700, margin: "0.2rem 0 0 0" }}>
                {data?.turnos?.porcentajeAlmuerzo || 0}% del volumen
              </p>
            </div>
          </div>

          {/* Métodos de Pago: Stripe vs Local */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.25rem" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Método de Pago Preferido
            </span>

            <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#4ade80" }} />
                <div>
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", margin: 0 }}>Tarjeta Online (Stripe)</p>
                  <p style={{ fontSize: 11.5, color: "#4ade80", margin: 0 }}>
                    {fmtNum(k?.pagosOnline || 0)} pedidos ({k?.totalPedidos ? Math.round(((k.pagosOnline) / k.totalPedidos) * 100) : 0}%)
                  </p>
                </div>
              </div>

              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#fbbf24" }} />
                <div>
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", margin: 0 }}>Al Recoger en Local</p>
                  <p style={{ fontSize: 11.5, color: "#fbbf24", margin: 0 }}>
                    {fmtNum(k?.pagosLocal || 0)} pedidos ({k?.totalPedidos ? Math.round(((k.pagosLocal) / k.totalPedidos) * 100) : 0}%)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ESTILOS REUTILIZABLES ───────────────────────────────────────────────────

const kpiCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 10,
  padding: "1.2rem 1.35rem",
  boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
};

const kpiLabelStyle: React.CSSProperties = {
  fontSize: 11.5,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "rgba(255,255,255,0.4)",
  fontWeight: 600,
};

const kpiValueStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
  color: "#fff",
  letterSpacing: "-0.02em",
  lineHeight: 1.1,
};

const iconBadgeStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const funnelStepStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.015)",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 8,
  padding: "1rem 1.15rem",
};

const funnelTrackBar: React.CSSProperties = {
  height: 6,
  background: "rgba(255,255,255,0.05)",
  borderRadius: 4,
  overflow: "hidden",
  marginBottom: "0.5rem",
};

const funnelNoteStyle: React.CSSProperties = {
  fontSize: 11,
  color: "rgba(255,255,255,0.4)",
  margin: 0,
};

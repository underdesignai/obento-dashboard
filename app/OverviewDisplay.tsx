"use client";

import {
  CalendarCheck, ShoppingBag, TrendingUp, Users,
  ArrowRight, Clock, CheckCircle2, XCircle, AlertCircle,
  Star, UtensilsCrossed, Layers,
} from "lucide-react";
import Link from "next/link";
import { useAdminLanguage } from "@/lib/LanguageContext";
import OverviewClient from "./OverviewClient";

const GOLD = "#c9a84c";

type ReservaRow = { id: number; nombre: string; fecha: string; personas: number; seccion: string | null; estado: string; createdAt: string };
type PedidoRow  = { id: number; nombre: string; total: number | null; estado: string; createdAt: string };

function fmtDate(d: string, lang: string) {
  return new Date(d).toLocaleDateString(lang === "es" ? "es-ES" : "en-GB", { day: "numeric", month: "short" });
}
function fmtTime(d: string, lang: string) {
  return new Date(d).toLocaleTimeString(lang === "es" ? "es-ES" : "en-GB", { hour: "2-digit", minute: "2-digit" });
}
function fmtMoney(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 }) + " NOK";
}

function EstadoBadge({ estado, a }: { estado: string; a: Record<string, string> }) {
  const ESTADO_CFG: Record<string, { bg: string; color: string; label: string; icon: React.ElementType }> = {
    confirmada: { bg: "rgba(74,222,128,0.12)",  color: "#4ade80", label: a.statusConfirmada, icon: CheckCircle2 },
    pendiente:  { bg: "rgba(251,191,36,0.12)",  color: "#fbbf24", label: a.statusPendiente,  icon: AlertCircle  },
    cancelada:  { bg: "rgba(248,113,113,0.12)", color: "#f87171", label: a.statusCancelada,  icon: XCircle      },
    nuevo:      { bg: "rgba(96,165,250,0.12)",  color: "#60a5fa", label: a.statusNuevo,      icon: Clock        },
    preparando: { bg: "rgba(251,191,36,0.12)",  color: "#fbbf24", label: a.statusPreparando, icon: AlertCircle  },
    listo:      { bg: "rgba(74,222,128,0.12)",  color: "#4ade80", label: a.statusListo,      icon: CheckCircle2 },
    entregado:  { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)", label: a.statusEntregado, icon: CheckCircle2 },
  };
  const c = ESTADO_CFG[estado] ?? { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", label: estado, icon: Clock };
  const Icon = c.icon;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, background: c.bg, color: c.color, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
      <Icon size={9} /> {c.label}
    </span>
  );
}

export default function OverviewDisplay({
  data,
}: {
  data: {
    reservasHoy: number; reservasSemana: number; reservasMes: number;
    pedidosNuevos: number; pedidosHoy: number; ingresosMes: number;
    reviewsPendientes: number; visitasHoy: number; visitasSemana: number;
    platosActivos: number; leadsTotales: number;
    ultimasReservas: ReservaRow[];
    ultimosPedidos: PedidoRow[];
  } | null;
}) {
  const { tr, lang } = useAdminLanguage();
  const a = tr.admin;

  const now  = new Date();
  const hora = now.getHours();
  const saludo = hora < 13 ? a.buenosDias : hora < 20 ? a.buenosTardes : a.buenasNoches;

  const kpis = [
    { label: a.reservasHoy,       value: data?.reservasHoy ?? 0,           sub: `${data?.reservasMes ?? 0} ${a.esteMes}`,        icon: CalendarCheck, color: GOLD,      rgb: "201,168,76",  accent: true },
    { label: a.pedidosPendientes, value: data?.pedidosNuevos ?? 0,         sub: `${data?.pedidosHoy ?? 0} ${a.hoy}`,              icon: ShoppingBag,   color: "#60a5fa",  rgb: "96,165,250"  },
    { label: a.ingresosMes,       value: fmtMoney(data?.ingresosMes ?? 0), sub: a.takeaway,                                        icon: TrendingUp,    color: "#4ade80",  rgb: "74,222,128"  },
    { label: a.visitasHoy,        value: data?.visitasHoy ?? 0,            sub: `${data?.visitasSemana ?? 0} ${a.estaSemana}`,    icon: Users,         color: "#f59e0b",  rgb: "245,158,11"  },
    { label: a.reviewsPendientes, value: data?.reviewsPendientes ?? 0,     sub: a.sinAprobar,                                      icon: Star,          color: "#f87171",  rgb: "248,113,113" },
    { label: a.platosActivos,     value: data?.platosActivos ?? 0,         sub: a.enCarta,                                         icon: UtensilsCrossed, color: GOLD,    rgb: "201,168,76"  },
    { label: a.leadsUnicos,       value: data?.leadsTotales ?? 0,          sub: a.totalAcumulado,                                  icon: Layers,        color: "#a78bfa",  rgb: "167,139,250" },
    { label: a.reservasSemana,    value: data?.reservasSemana ?? 0,        sub: a.ultimos7Dias,                                    icon: CalendarCheck, color: "#60a5fa",  rgb: "96,165,250"  },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.35em", color: "rgba(201,168,76,0.5)", marginBottom: 4 }}>{a.panelControl}</p>
          <h1 style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-playfair, serif)", color: "#fff", margin: 0, lineHeight: 1 }}>
            {saludo}, <span style={{ color: GOLD }}>Admin</span>
          </h1>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", margin: 0 }}>
          {now.toLocaleDateString(lang === "es" ? "es-ES" : "en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Accesos rápidos */}
      <OverviewClient
        reservasHoy={data?.reservasHoy ?? 0}
        pedidosNuevos={data?.pedidosNuevos ?? 0}
        platosActivos={data?.platosActivos ?? 0}
        leadsTotales={data?.leadsTotales ?? 0}
        reviewsPendientes={data?.reviewsPendientes ?? 0}
      />

      {/* 8 KPIs en grid 4x2 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.6rem" }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            background: k.accent
              ? `linear-gradient(135deg, rgba(${k.rgb},0.1), rgba(${k.rgb},0.03))`
              : "rgba(255,255,255,0.025)",
            border: `1px solid rgba(${k.rgb},${k.accent ? "0.25" : "0.1"})`,
            borderRadius: 6, padding: "1rem 1.1rem",
            borderTop: `2px solid rgba(${k.rgb},${k.accent ? "0.6" : "0.3"})`,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
              <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)" }}>{k.label}</span>
              <k.icon size={14} style={{ color: k.color, opacity: 0.7 }} />
            </div>
            <p style={{ fontSize: 24, fontWeight: 700, color: k.accent ? k.color : "#fff", fontFamily: "var(--font-playfair,serif)", lineHeight: 1, margin: 0 }}>{k.value}</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Tablas en 2 columnas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>

        {/* Últimas reservas */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.1rem", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", letterSpacing: "0.02em" }}>{a.ultimasReservas}</span>
            <Link href="/admin/reservas" style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: GOLD, textDecoration: "none", opacity: 0.8 }}>
              {a.verTodo} <ArrowRight size={11} />
            </Link>
          </div>
          {!data || data.ultimasReservas.length === 0 ? (
            <p style={{ padding: "1.25rem", fontSize: 12, color: "rgba(255,255,255,0.2)", margin: 0 }}>{a.sinReservasRecientes}</p>
          ) : data.ultimasReservas.map((r, i) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 1.1rem", borderBottom: i < data.ultimasReservas.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none", gap: "0.5rem" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.nombre}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "2px 0 0" }}>
                  {fmtDate(r.fecha, lang)} · {r.personas} pers · {r.seccion === "sushi" ? "Sushi" : "Mexican"}
                </p>
              </div>
              <EstadoBadge estado={r.estado} a={a} />
            </div>
          ))}
        </div>

        {/* Últimos pedidos */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.1rem", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", letterSpacing: "0.02em" }}>{a.ultimosPedidos}</span>
            <Link href="/admin/pedidos" style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: GOLD, textDecoration: "none", opacity: 0.8 }}>
              {a.verTodo} <ArrowRight size={11} />
            </Link>
          </div>
          {!data || data.ultimosPedidos.length === 0 ? (
            <p style={{ padding: "1.25rem", fontSize: 12, color: "rgba(255,255,255,0.2)", margin: 0 }}>{a.sinPedidosRecientes}</p>
          ) : data.ultimosPedidos.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 1.1rem", borderBottom: i < data.ultimosPedidos.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none", gap: "0.5rem" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "2px 0 0" }}>
                  CY-{String(p.id).padStart(4,"0")} · {fmtTime(p.createdAt, lang)}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>{(p.total ?? 0).toFixed(0)} kr</span>
                <EstadoBadge estado={p.estado} a={a} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DB status */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", background: "rgba(74,222,128,0.03)", border: "1px solid rgba(74,222,128,0.08)", borderRadius: 4 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: 0 }}>
          {a.dbConectada} — PostgreSQL en{" "}
          <code style={{ background: "rgba(255,255,255,0.06)", padding: "0 3px", borderRadius: 2, fontSize: 10 }}>127.0.0.1:5435/coyo_admin</code>
        </p>
      </div>

    </div>
  );
}

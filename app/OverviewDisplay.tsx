"use client";

import {
  CalendarCheck, ShoppingBag, TrendingUp, Users,
  ArrowRight, Clock, CheckCircle2, XCircle, AlertCircle,
  UtensilsCrossed, Layers,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAdminLanguage } from "@/lib/LanguageContext";
import OverviewClient from "./OverviewClient";

const GOLD = "#c9a84c";
const CRIMSON = "#c81e22";

type PedidoRow  = { id: number; numeroPedido?: string; nombre: string; total: number | null; estado: string; createdAt: string };
type Data = {
  pedidosNuevos: number; pedidosHoy: number; ingresosMes: number;
  reviewsPendientes: number; visitasHoy: number; visitasSemana: number;
  platosActivos: number; leadsTotales: number;
  ultimosPedidos: PedidoRow[];
};

function fmtDate(d: string, lang: string) {
  return new Date(d).toLocaleDateString(lang === "es" ? "es-ES" : "en-GB", { day: "numeric", month: "short" });
}
function fmtTime(d: string, lang: string) {
  return new Date(d).toLocaleTimeString(lang === "es" ? "es-ES" : "en-GB", { hour: "2-digit", minute: "2-digit" });
}
function fmtMoney(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function EstadoBadge({ estado, a }: { estado: string; a: Record<string, string> }) {
  const ESTADO_CFG: Record<string, { bg: string; color: string; label: string; icon: React.ElementType }> = {
    confirmada:             { bg: "rgba(74,222,128,0.12)",  color: "#4ade80", label: a.statusConfirmada ?? "Confirmada", icon: CheckCircle2 },
    llego:                  { bg: "rgba(96,165,250,0.12)",  color: "#60a5fa", label: a.statusLlego ?? "Llegó", icon: CheckCircle2 },
    pendiente:              { bg: "rgba(251,191,36,0.12)",  color: "#fbbf24", label: a.statusPendiente ?? "Pendiente",  icon: AlertCircle  },
    cancelada:              { bg: "rgba(248,113,113,0.12)", color: "#f87171", label: a.statusCancelada ?? "Cancelada",  icon: XCircle      },
    "cancelada-cliente":    { bg: "rgba(248,113,113,0.12)", color: "#f87171", label: a.statusCancelada ?? "Cancelada",  icon: XCircle      },
    "cancelada-restaurante":{ bg: "rgba(248,113,113,0.12)", color: "#f87171", label: a.statusCancelada ?? "Cancelada",  icon: XCircle      },
    "no-show":              { bg: "rgba(156,163,175,0.12)", color: "#9ca3af", label: "No Show",           icon: XCircle      },
    recibido:               { bg: "rgba(96,165,250,0.12)",  color: "#60a5fa", label: "Recibido",        icon: Clock        },
    nuevo:                  { bg: "rgba(96,165,250,0.12)",  color: "#60a5fa", label: a.statusNuevo ?? "Nuevo",      icon: Clock        },
    preparando:             { bg: "rgba(251,191,36,0.12)",  color: "#fbbf24", label: a.statusPreparando ?? "En Cocina", icon: AlertCircle  },
    listo:                  { bg: "rgba(74,222,128,0.12)",  color: "#4ade80", label: a.statusListo ?? "Listo",      icon: CheckCircle2 },
    entregado:              { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", label: a.statusEntregado ?? "Entregado", icon: CheckCircle2 },
  };
  const c = ESTADO_CFG[estado] ?? { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", label: estado, icon: Clock };
  const Icon = c.icon;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, background: c.bg, color: c.color, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
      <Icon size={9} /> {c.label}
    </span>
  );
}

export default function OverviewDisplay({ data: initialData }: { data: Data | null }) {
  const { tr, lang } = useAdminLanguage();
  const a = tr.admin;
  const [data, setData] = useState<Data | null>(initialData);

  useEffect(() => {
    const load = () =>
      fetch("/api/admin/overview").then(r => r.json()).then(setData).catch(() => {});
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const now  = new Date();
  const hora = now.getHours();
  const saludo = hora < 13 ? a.buenosDias : hora < 20 ? a.buenosTardes : a.buenasNoches;

  const kpis = [
    { label: a.pedidosPendientes, value: data?.pedidosNuevos ?? 0,         sub: `${data?.pedidosHoy ?? 0} ${a.hoy}`,              icon: ShoppingBag,   color: "#60a5fa",  rgb: "96,165,250"  },
    { label: a.ingresosMes,       value: fmtMoney(data?.ingresosMes ?? 0), sub: "Total Takeaway",                                 icon: TrendingUp,    color: "#4ade80",  rgb: "74,222,128",  accent: true },
    { label: a.visitasHoy,        value: data?.visitasHoy ?? 0,            sub: `${data?.visitasSemana ?? 0} ${a.estaSemana}`,    icon: Users,         color: "#f59e0b",  rgb: "245,158,11"  },
    { label: a.platosActivos,     value: data?.platosActivos ?? 0,         sub: "En carta Obento",                                 icon: UtensilsCrossed, color: GOLD,    rgb: "201,168,76"  },
    { label: a.leadsUnicos,       value: data?.leadsTotales ?? 0,          sub: a.totalAcumulado,                                  icon: Layers,        color: "#a78bfa",  rgb: "167,139,250" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.35em", color: CRIMSON, fontWeight: 700, marginBottom: 4 }}>OBENTO JAPANESE FOOD</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-dm-sans, system-ui, sans-serif)", color: "#fff", margin: 0, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            {saludo}, <span style={{ color: GOLD }}>Admin</span>
          </h1>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>
          {now.toLocaleDateString(lang === "es" ? "es-ES" : "en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Accesos rápidos */}
      <OverviewClient
        pedidosNuevos={data?.pedidosNuevos ?? 0}
        platosActivos={data?.platosActivos ?? 0}
        leadsTotales={data?.leadsTotales ?? 0}
        reviewsPendientes={data?.reviewsPendientes ?? 0}
      />

      {/* 6 KPIs en grid 3x2 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem" }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            background: k.accent
              ? `linear-gradient(135deg, rgba(200,30,34,0.15), rgba(0,0,0,0.4))`
              : "rgba(255,255,255,0.02)",
            border: `1px solid ${k.accent ? "rgba(200,30,34,0.3)" : "rgba(255,255,255,0.07)"}`,
            borderRadius: 8, padding: "1.1rem 1.2rem",
            borderTop: `2px solid ${k.accent ? CRIMSON : k.color}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
              <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>{k.label}</span>
              <k.icon size={15} style={{ color: k.color, opacity: 0.85 }} />
            </div>
            <p style={{ fontSize: 24, fontWeight: 800, color: k.accent ? "#fff" : "#fff", fontFamily: "var(--font-dm-sans, system-ui, sans-serif)", letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>{k.value}</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabla Últimos pedidos Takeaway */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.75rem" }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", letterSpacing: "0.02em" }}>{a.ultimosPedidos} (Takeaway)</span>
            <Link href="/pedidos" style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: GOLD, textDecoration: "none", opacity: 0.9 }}>
              {a.verTodo} <ArrowRight size={11} />
            </Link>
          </div>
          {!data || data.ultimosPedidos.length === 0 ? (
            <p style={{ padding: "1.5rem", fontSize: 13, color: "rgba(255,255,255,0.3)", margin: 0 }}>{a.sinPedidosRecientes}</p>
          ) : data.ultimosPedidos.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.25rem", borderBottom: i < data.ultimosPedidos.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", gap: "0.5rem" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "3px 0 0" }}>
                  <span style={{ color: GOLD, fontFamily: "monospace", fontWeight: 700 }}>{p.numeroPedido || `OB-${p.id}`}</span> · {fmtTime(p.createdAt, lang)}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: GOLD, fontFamily: "monospace" }}>{(p.total ?? 0).toFixed(2)} €</span>
                <EstadoBadge estado={p.estado} a={a} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

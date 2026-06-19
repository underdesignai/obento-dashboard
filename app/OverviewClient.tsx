"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, ShoppingBag, Star, Users, UtensilsCrossed, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAdminLanguage } from "@/lib/LanguageContext";

const GOLD = "#c9a84c";

function QuickLink({ href, icon: Icon, label, count, color = GOLD, mobile = false }: {
  href: string; icon: React.ElementType; label: string; count?: number; color?: string; mobile?: boolean;
}) {
  if (mobile) {
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "0.85rem 0.5rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, cursor: "pointer" }}>
          <Icon size={18} style={{ color }} />
          {count !== undefined && (
            <span style={{ fontSize: 15, fontWeight: 700, color }}>{count}</span>
          )}
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textAlign: "center", lineHeight: 1.3 }}>{label}</span>
        </div>
      </Link>
    );
  }
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.9rem 1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, cursor: "pointer", transition: "border-color 0.15s" }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Icon size={16} style={{ color }} />
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {count !== undefined && (
            <span style={{ fontSize: 12, fontWeight: 700, color, background: "rgba(201,168,76,0.08)", padding: "2px 10px", borderRadius: 20 }}>{count}</span>
          )}
          <ArrowRight size={13} style={{ color: "rgba(255,255,255,0.2)" }} />
        </div>
      </div>
    </Link>
  );
}

export default function OverviewClient({
  reservasHoy, pedidosNuevos, platosActivos, leadsTotales, reviewsPendientes,
}: {
  reservasHoy: number; pedidosNuevos: number; platosActivos: number; leadsTotales: number; reviewsPendientes: number;
}) {
  const [isMobile, setIsMobile] = useState(false);
  const { tr } = useAdminLanguage();
  const a = tr.admin;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const links = [
    { href: "/admin/reservas",  icon: CalendarCheck,   label: a.reservas,    count: reservasHoy,       color: GOLD       },
    { href: "/admin/pedidos",   icon: ShoppingBag,     label: a.pedidos,     count: pedidosNuevos,     color: "#60a5fa"  },
    { href: "/admin/carta",     icon: UtensilsCrossed, label: a.carta,       count: platosActivos,     color: GOLD       },
    { href: "/admin/leads",     icon: Users,           label: a.leads,       count: leadsTotales,      color: "#a78bfa"  },
    { href: "/admin/reviews",   icon: Star,            label: a.reviews,     count: reviewsPendientes, color: "#f59e0b"  },
    { href: "/admin/analytics", icon: TrendingUp,      label: a.analytics,   count: undefined,         color: "#4ade80"  },
  ];

  return (
    <div>
      <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.2)", marginBottom: "0.75rem" }}>{a.accesosRapidos}</p>
      {isMobile ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
          {links.map(l => <QuickLink key={l.href} {...l} mobile />)}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "0.6rem" }}>
          {links.map(l => <QuickLink key={l.href} {...l} />)}
        </div>
      )}
    </div>
  );
}

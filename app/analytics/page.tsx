"use client";

import { useEffect, useState } from "react";
import { BarChart2, TrendingUp, Eye, RefreshCw } from "lucide-react";
import { useAdminLanguage } from "@/lib/LanguageContext";

type Stat = { pagina: string; _count: { pagina: number } };

export default function AnalyticsPage() {
  const { tr } = useAdminLanguage();
  const a = tr.admin;
  const [stats, setStats]   = useState<Stat[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/analytics");
    if (res.ok) {
      const data = await res.json();
      sessionStorage.setItem("coyo_analytics", JSON.stringify(data));
      setStats(data.stats ?? []);
      setTotal(data.total ?? 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    const cached = sessionStorage.getItem("coyo_analytics");
    if (cached) {
      const data = JSON.parse(cached);
      setStats(data.stats ?? []);
      setTotal(data.total ?? 0);
      setLoading(false);
    }
    load();
  }, []);

  const max = Math.max(...stats.map(s => s._count.pagina), 1);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(201,168,76,0.5)", marginBottom: "0.25rem" }}>{a.metricas}</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-playfair, serif)", color: "#fff", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <BarChart2 size={24} style={{ color: "#4ade80" }} /> {a.analytics}
          </h1>
        </div>
        <button onClick={load} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, padding: "0.6rem 0.9rem", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: 14 }}>
          <RefreshCw size={14} /> {a.actualizar}
        </button>
      </div>

      {/* Total */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "1.35rem 1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)" }}>{a.totalVisitas}</span>
            <Eye size={22} style={{ color: "#4ade80" }} />
          </div>
          <p style={{ fontSize: 28, fontWeight: 700, color: "#fff", fontFamily: "var(--font-playfair, serif)" }}>{total}</p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "1.35rem 1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)" }}>{a.paginasUnicas}</span>
            <TrendingUp size={22} style={{ color: "#60a5fa" }} />
          </div>
          <p style={{ fontSize: 28, fontWeight: 700, color: "#fff", fontFamily: "var(--font-playfair, serif)" }}>{stats.length}</p>
        </div>
      </div>

      {/* Bar chart */}
      {loading ? <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>{a.cargando}</p> : (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "1.5rem" }}>
          <p style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", marginBottom: "1.5rem" }}>{a.visitasPorPagina}</p>
          {stats.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 14 }}>{a.sinDatosAnalytics}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {stats.sort((sa, sb) => sb._count.pagina - sa._count.pagina).map(s => (
                <div key={s.pagina}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>{s.pagina}</span>
                    <span style={{ fontSize: 14, color: "#4ade80", fontWeight: 600 }}>{s._count.pagina}</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(s._count.pagina / max) * 100}%`, background: "linear-gradient(90deg, #c9a84c, #4ade80)", borderRadius: 3, transition: "width 500ms ease" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

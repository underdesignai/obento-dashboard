"use client";

import { useEffect, useState } from "react";
import { Star, Check, Trash2, RefreshCw } from "lucide-react";
import { useSession } from "@/lib/session";
import { useAdminLanguage } from "@/lib/LanguageContext";

type Review = {
  id: number;
  nombre: string;
  texto: string;
  rating: number;
  origen?: string;
  aprobado: boolean;
  createdAt: string;
};

export default function ReviewsPage() {
  const { tr } = useAdminLanguage();
  const a = tr.admin;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<"pendiente" | "aprobado">("pendiente");
  const { role, loaded } = useSession();
  const canEdit = loaded && role === "admin";

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/reviews");
    if (res.ok) {
      const data = await res.json();
      sessionStorage.setItem("obento_reviews", JSON.stringify(data));
      setReviews(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    const cached = sessionStorage.getItem("obento_reviews");
    if (cached) { setReviews(JSON.parse(cached)); setLoading(false); }
    load();
  }, []);

  const approve = async (id: number) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, aprobado: true } : r));
    await fetch(`/api/admin/reviews/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aprobado: true }) });
  };

  const del = async (id: number) => {
    if (!confirm(a.confirmarEliminarReview)) return;
    setReviews(prev => prev.filter(r => r.id !== id));
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
  };

  const filtered = reviews.filter(r => tab === "aprobado" ? r.aprobado : !r.aprobado);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(201,168,76,0.5)", marginBottom: "0.25rem" }}>{a.gestion}</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-playfair, serif)", color: "#fff", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Star size={24} style={{ color: "#f59e0b" }} /> {a.reviews}
          </h1>
        </div>
        <button onClick={load} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, padding: "0.6rem 0.9rem", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: 14 }}>
          <RefreshCw size={14} /> {a.actualizar}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {(["pendiente", "aprobado"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "0.5rem 1.25rem", borderRadius: 4, border: "1px solid", fontSize: 13, cursor: "pointer", transition: "all 150ms",
            background: tab === t ? "rgba(201,168,76,0.1)" : "transparent",
            borderColor: tab === t ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.08)",
            color: tab === t ? "#c9a84c" : "rgba(255,255,255,0.35)" }}>
            {t === "pendiente" ? a.pendientesTab : a.aprobadasTab}
            <span style={{ marginLeft: "0.5rem", fontSize: 11, opacity: 0.6 }}>({reviews.filter(r => t === "aprobado" ? r.aprobado : !r.aprobado).length})</span>
          </button>
        ))}
      </div>

      {loading ? <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>{a.cargando}</p> : (
        filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.2)", fontSize: 14 }}>{a.noHayReviews}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filtered.map(r => (
              <div key={r.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "1.25rem 1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}>{r.nombre}</p>
                    <div style={{ display: "flex", gap: 2, marginTop: "0.2rem" }}>
                      {[...Array(5)].map((_, i) => <span key={i} style={{ color: i < r.rating ? "#f59e0b" : "rgba(255,255,255,0.1)", fontSize: 12 }}>★</span>)}
                    </div>
                  </div>
                  {canEdit && (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {!r.aprobado && (
                        <button onClick={() => approve(r.id)} style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 4, padding: "0.35rem 0.75rem", color: "#4ade80", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <Check size={12} /> {a.aprobar}
                        </button>
                      )}
                      <button onClick={() => del(r.id)} style={{ background: "rgba(252,165,165,0.06)", border: "1px solid rgba(252,165,165,0.15)", borderRadius: 4, padding: "0.35rem", color: "rgba(252,165,165,0.6)", cursor: "pointer" }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>"{r.texto}"</p>
                {r.origen && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: "0.5rem" }}>vía {r.origen}</p>}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

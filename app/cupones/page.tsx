"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag, Copy, Check } from "lucide-react";
import { useSession } from "@/lib/session";
import { useAdminLanguage } from "@/lib/LanguageContext";

type Cupon = {
  id: number;
  codigo: string;
  descuento: number;
  tipo: string;
  activo: boolean;
  usos: number;
  maxUsos: number | null;
  createdAt: string;
};

const INPUT: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6, padding: "0.625rem 0.875rem", color: "#fff", fontSize: 13,
  outline: "none", width: "100%", boxSizing: "border-box",
};

export default function CuponesPage() {
  useSession();
  const { tr } = useAdminLanguage();
  const a = tr.admin;

  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const [codigo, setCodigo]       = useState("");
  const [descuento, setDescuento] = useState("");
  const [tipo, setTipo]           = useState<"porcentaje" | "fijo">("porcentaje");
  const [maxUsos, setMaxUsos]     = useState("");
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/cupones");
    if (res.ok) setCupones(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!codigo.trim() || !descuento) { setFormError(`${a.cuponesCodigo} y ${a.cuponesDescuento.toLowerCase()} son obligatorios.`); return; }
    setSaving(true); setFormError("");
    const res = await fetch("/api/admin/cupones", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo, descuento: Number(descuento), tipo, maxUsos: maxUsos || null }),
    });
    if (res.ok) {
      setCodigo(""); setDescuento(""); setMaxUsos(""); setTipo("porcentaje");
      await load();
    } else {
      const d = await res.json();
      setFormError(d.error ?? "Error al crear el cupón.");
    }
    setSaving(false);
  };

  const toggleActivo = async (c: Cupon) => {
    await fetch(`/api/admin/cupones/${c.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !c.activo }),
    });
    setCupones(prev => prev.map(x => x.id === c.id ? { ...x, activo: !x.activo } : x));
  };

  const handleDelete = async (id: number) => {
    if (!confirm(a.cuponesEliminarConfirm)) return;
    await fetch(`/api/admin/cupones/${id}`, { method: "DELETE" });
    setCupones(prev => prev.filter(x => x.id !== id));
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Tag size={16} style={{ color: "#c9a84c" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>{a.cupones}</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>{cupones.length} {a.cuponesCreados}</p>
        </div>
      </div>

      {/* Formulario */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "1.5rem", marginBottom: "2rem" }}>
        <p style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(201,168,76,0.6)", marginBottom: "1.25rem", fontWeight: 700 }}>
          {a.cuponesNuevo}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.35rem" }}>{a.cuponesCodigo}</label>
            <input value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())} placeholder="VERANO20" style={{ ...INPUT, textTransform: "uppercase", letterSpacing: "0.08em" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.35rem" }}>{a.cuponesDescuento}</label>
            <input type="number" value={descuento} onChange={e => setDescuento(e.target.value)} placeholder={tipo === "porcentaje" ? "20" : "50"} min="0" style={INPUT} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.35rem" }}>{a.cuponesTipo}</label>
            <select value={tipo} onChange={e => setTipo(e.target.value as "porcentaje" | "fijo")} style={{ ...INPUT, cursor: "pointer", appearance: "none" }}>
              <option value="porcentaje" style={{ background: "#111" }}>{a.cuponesTipoPct}</option>
              <option value="fijo" style={{ background: "#111" }}>{a.cuponesTipoFijo}</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.35rem" }}>{a.cuponesMaxUsos}</label>
            <input type="number" value={maxUsos} onChange={e => setMaxUsos(e.target.value)} placeholder={a.cuponesMaxUsosPh} min="1" style={INPUT} />
          </div>
        </div>
        {formError && <p style={{ fontSize: 12, color: "rgba(239,68,68,0.8)", marginBottom: "0.75rem" }}>{formError}</p>}
        <button onClick={handleCreate} disabled={saving} style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          padding: "0.625rem 1.25rem", borderRadius: 6, border: "none",
          background: "linear-gradient(135deg,#c9a84c,#8b6914)", color: "#0a0a0f",
          fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
          cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
        }}>
          <Plus size={14} /> {saving ? a.cuponesCreando : a.cuponesCrear}
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>...</p>
      ) : cupones.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.2)" }}>
          <Tag size={32} style={{ margin: "0 auto 1rem", display: "block", opacity: 0.4 }} />
          <p style={{ fontSize: 14 }}>{a.cuponesVacio}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 0.8fr 0.8fr 0.7fr 0.7fr auto", gap: "0.5rem", padding: "0.5rem 1rem", marginBottom: "0.25rem" }}>
            {[a.cuponesCodigo, a.cuponesDescuento, a.cuponesTipo, a.cuponesUsos, "", ""].map((h, i) => (
              <span key={i} style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.25)", fontWeight: 700 }}>{h}</span>
            ))}
          </div>
          {cupones.map(c => (
            <div key={c.id} style={{
              display: "grid", gridTemplateColumns: "1.5fr 0.8fr 0.8fr 0.7fr 0.7fr auto",
              gap: "0.5rem", alignItems: "center",
              padding: "0.875rem 1rem", borderRadius: 8,
              background: c.activo ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.01)",
              border: `1px solid ${c.activo ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)"}`,
              opacity: c.activo ? 1 : 0.5,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "#c9a84c", letterSpacing: "0.08em" }}>{c.codigo}</span>
                <button onClick={() => copyCode(c.codigo)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.25)", padding: 0, display: "flex" }}>
                  {copied === c.codigo ? <Check size={12} style={{ color: "rgba(74,222,128,0.7)" }} /> : <Copy size={12} />}
                </button>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
                {c.tipo === "porcentaje" ? `${c.descuento}%` : `${c.descuento.toLocaleString("es-ES")},-`}
              </span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {c.tipo === "porcentaje" ? "%" : a.cuponesTipoFijo.split(" ")[0]}
              </span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                {c.usos}{c.maxUsos !== null ? ` / ${c.maxUsos}` : ""}
              </span>
              <button onClick={() => toggleActivo(c)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem", padding: 0 }}>
                {c.activo
                  ? <><ToggleRight size={20} style={{ color: "#c9a84c" }} /><span style={{ fontSize: 11, color: "rgba(201,168,76,0.7)" }}>{a.cuponesActivo}</span></>
                  : <><ToggleLeft size={20} style={{ color: "rgba(255,255,255,0.2)" }} /><span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>{a.cuponesInactivo}</span></>
                }
              </button>
              <button onClick={() => handleDelete(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(239,68,68,0.4)", display: "flex", padding: 4, borderRadius: 4, transition: "color 150ms" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(239,68,68,0.9)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(239,68,68,0.4)")}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

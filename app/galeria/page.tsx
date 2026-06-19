"use client";

import { useEffect, useRef, useState } from "react";
import { Images, Plus, Trash2, X, Upload, Eye, EyeOff, Pencil } from "lucide-react";
import { useSession } from "@/lib/session";
import { useAdminLanguage } from "@/lib/LanguageContext";

type Foto = { id: number; url: string; alt?: string; label?: string; orden: number; activo: boolean };

const EMPTY = (): Omit<Foto, "id" | "orden" | "activo"> => ({ url: "", alt: "", label: "" });

const INPUT: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 4, padding: "0.625rem 0.875rem", color: "#fff", fontSize: 14,
  outline: "none", boxSizing: "border-box",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em",
  color: "rgba(255,255,255,0.35)", marginBottom: "0.4rem",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={LABEL_STYLE}>{label}</label>
      {children}
    </div>
  );
}

export default function GaleriaPage() {
  const { tr } = useAdminLanguage();
  const a = tr.admin;
  const [fotos, setFotos]       = useState<Foto[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<"add" | "edit" | null>(null);
  const [editing, setEditing]   = useState<Foto | null>(null);
  const [form, setForm]         = useState(EMPTY());
  const [uploading, setUploading] = useState(false);
  const fileRef                 = useRef<HTMLInputElement>(null);
  const { role, loaded }        = useSession();
  const canEdit                 = loaded && role === "admin";

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/galeria");
    if (res.ok) setFotos(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const f = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function handleFileUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json();
      setForm(p => ({ ...p, url }));
    }
    setUploading(false);
  }

  function openAdd() {
    setForm(EMPTY());
    setEditing(null);
    setModal("add");
  }

  function openEdit(foto: Foto) {
    setForm({ url: foto.url, alt: foto.alt ?? "", label: foto.label ?? "" });
    setEditing(foto);
    setModal("edit");
  }

  function closeModal() { setModal(null); setEditing(null); setForm(EMPTY()); }

  async function save() {
    if (!form.url) return;
    if (modal === "add") {
      await fetch("/api/admin/galeria", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, orden: fotos.length, activo: true }),
      });
    } else if (editing) {
      await fetch(`/api/admin/galeria/${editing.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    closeModal();
    load();
  }

  async function toggleActivo(foto: Foto) {
    await fetch(`/api/admin/galeria/${foto.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !foto.activo }),
    });
    setFotos(prev => prev.map(f => f.id === foto.id ? { ...f, activo: !f.activo } : f));
  }

  async function del(id: number) {
    if (!confirm(a.confirmarEliminarFoto)) return;
    await fetch(`/api/admin/galeria/${id}`, { method: "DELETE" });
    setFotos(prev => prev.filter(f => f.id !== id));
  }

  const activas   = fotos.filter(f => f.activo).length;
  const inactivas = fotos.filter(f => !f.activo).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(201,168,76,0.5)", marginBottom: "0.25rem" }}>{a.gestion}</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-playfair, serif)", color: "#fff", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Images size={24} style={{ color: "#c9a84c" }} /> {a.galeria}
          </h1>
        </div>
        {canEdit && (
          <button onClick={openAdd} style={{ background: "linear-gradient(135deg, #c9a84c, #8b6914)", color: "#0a0a0f", border: "none", borderRadius: 6, padding: "0.65rem 1.35rem", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Plus size={16} /> {a.añadirFoto}
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { label: a.totalFotos,  value: fotos.length,  color: "#c9a84c" },
          { label: a.visibles,    value: activas,        color: "#4ade80" },
          { label: a.ocultas,     value: inactivas,      color: "rgba(255,255,255,0.3)" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "1.35rem 1.75rem", display: "flex", alignItems: "center", gap: "1.25rem", flex: "1 1 140px" }}>
            <div>
              <p style={{ fontSize: 28, fontWeight: 700, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", margin: "6px 0 0" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>{a.cargando}</p>
      ) : fotos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "rgba(255,255,255,0.2)", fontSize: 14 }}>{a.noHayFotos}</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
          {fotos.map(foto => (
            <div key={foto.id} style={{ position: "relative", borderRadius: 8, overflow: "hidden", aspectRatio: "4/3", background: "rgba(255,255,255,0.03)", border: `1px solid ${foto.activo ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.04)"}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={foto.url} alt={foto.alt ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: foto.activo ? 1 : 0.25, transition: "opacity 0.2s" }} />

              {/* Overlay con acciones */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)", opacity: 0, transition: "opacity 0.2s", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0.75rem" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
              >
                {(foto.label || foto.alt) && (
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: "0 0 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {foto.label || foto.alt}
                  </p>
                )}
                {canEdit && (
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button onClick={() => openEdit(foto)} title="Editar"
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "0.4rem", background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 4, color: "#c9a84c", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                      <Pencil size={12} /> {a.editar}
                    </button>
                    <button onClick={() => toggleActivo(foto)} title={foto.activo ? "Ocultar" : "Mostrar"}
                      style={{ padding: "0.4rem 0.6rem", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 4, color: foto.activo ? "#4ade80" : "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                      {foto.activo ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    <button onClick={() => del(foto.id)} title="Eliminar"
                      style={{ padding: "0.4rem 0.6rem", background: "rgba(252,165,165,0.08)", border: "1px solid rgba(252,165,165,0.2)", borderRadius: 4, color: "rgba(252,165,165,0.7)", cursor: "pointer" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Badge activo/oculto */}
              {!foto.activo && (
                <span style={{ position: "absolute", top: 8, right: 8, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(0,0,0,0.7)", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{a.statusOculta}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal añadir / editar */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={closeModal}>
          <div style={{ background: "#0e0d0b", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 8, padding: "2rem", width: "100%", maxWidth: 460 }}
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: 18, fontFamily: "var(--font-playfair, serif)", color: "#fff", margin: 0 }}>
                {modal === "add" ? a.añadirFoto : a.editarFoto}
              </h2>
              <button onClick={closeModal} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}><X size={18} /></button>
            </div>

            {/* Preview */}
            {form.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.url} alt="preview" style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 6, marginBottom: "1rem", border: "1px solid rgba(255,255,255,0.08)" }} />
            )}

            {/* Upload */}
            <Field label="Imagen">
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input value={form.url} onChange={e => f("url", e.target.value)} style={{ ...INPUT, flex: 1 }} placeholder="URL" />
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 0.875rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: uploading ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)", cursor: uploading ? "not-allowed" : "pointer", fontSize: 13, whiteSpace: "nowrap" }}>
                  <Upload size={13} /> {uploading ? a.subiendo : a.subirImagen}
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
              </div>
            </Field>

            <Field label="Etiqueta (visible en web)">
              <input value={form.label ?? ""} onChange={e => f("label", e.target.value)} style={INPUT} placeholder="Ej: Sushi Bar, Terraza…" />
            </Field>

            <Field label="Descripción alt">
              <input value={form.alt ?? ""} onChange={e => f("alt", e.target.value)} style={INPUT} placeholder="Descripción de la imagen" />
            </Field>

            <button onClick={save} disabled={!form.url || uploading}
              style={{ width: "100%", padding: "0.75rem", background: form.url ? "linear-gradient(135deg, #c9a84c, #8b6914)" : "rgba(255,255,255,0.05)", color: form.url ? "#0a0a0f" : "rgba(255,255,255,0.2)", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: form.url ? "pointer" : "not-allowed", transition: "all 0.15s" }}>
              {modal === "add" ? a.añadirFoto : a.guardarCambiosFoto}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

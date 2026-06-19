"use client";

import { useEffect, useState } from "react";
import { PackageOpen, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { useSession } from "@/lib/session";

type Producto = {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria: string;
  concepto: string;
  imagen?: string;
  activo: boolean;
};

const CONCEPTOS = ["mexican", "sushi"];

const CAT_LABELS: Record<string, string> = {
  snacks: "Snacks", ceviches: "Ceviches", tacos: "Tacos", flautas: "Flautas",
  sushi: "Sushi Bar", principales: "Principales", postres: "Postres",
  "klassisk-nigiri": "Nigiri Clásico", "spesial-nigiri": "Nigiri Especial",
  "klassisk-maki": "Maki Clásico", "spesial-maki": "Maki Especial", "futo-maki": "Futo Maki",
  "klassisk-sashimi": "Sashimi Clásico", "spesial-sashimi": "Sashimi Especial",
  tartar: "Tartar", combos: "Combos",
};

const EMPTY: Omit<Producto, "id"> = {
  nombre: "", descripcion: "", precio: 0, categoria: "snacks",
  concepto: "mexican", imagen: "", activo: true,
};

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "#0e0d0b", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ padding: "1.5rem" }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.35)", marginBottom: "0.4rem" }}>{label}</label>
      {children}
    </div>
  );
}

const INPUT = { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "8px 12px", color: "#fff", fontSize: 14, boxSizing: "border-box" as const };
const SELECT = { ...INPUT };

export default function TakeAwayAdminPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [concepto, setConcepto] = useState<"mexican" | "sushi">("mexican");
  const [catFiltro, setCatFiltro] = useState("all");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<Omit<Producto, "id">>(EMPTY);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const { role, loaded } = useSession();
  const canEdit = loaded && (role === "admin" || role === "editor");
  const canDelete = loaded && role === "admin";

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/carta");
    if (res.ok) setProductos(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const conceptItems = productos.filter(p => (p.concepto ?? "mexican") === concepto);
  const categorias = Array.from(new Set(conceptItems.map(p => p.categoria)));
  const filtered = conceptItems.filter(p => catFiltro === "all" || p.categoria === catFiltro);

  const openAdd = () => {
    setForm({ ...EMPTY, concepto, categoria: categorias[0] ?? "" });
    setModal("add");
  };

  const openEdit = (p: Producto) => {
    setEditId(p.id);
    setForm({ nombre: p.nombre, descripcion: p.descripcion ?? "", precio: p.precio, categoria: p.categoria, concepto: p.concepto ?? "mexican", imagen: p.imagen ?? "", activo: p.activo });
    setModal("edit");
  };

  const handleSave = async () => {
    setSaving(true);
    if (modal === "add") {
      await fetch("/api/admin/carta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch(`/api/admin/carta/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    await load();
    setModal(null);
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/admin/carta/${id}`, { method: "DELETE" });
    setProductos(prev => prev.filter(p => p.id !== id));
    setDeleteId(null);
  };

  const f = (k: keyof typeof form, v: string | number | boolean) => setForm(prev => ({ ...prev, [k]: v }));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json();
      f("imagen", url);
    }
    setUploading(false);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(201,168,76,0.5)", marginBottom: "0.25rem" }}>Gestión</p>
          <h1 style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-playfair, serif)", color: "#fff", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <PackageOpen size={22} style={{ color: "#c9a84c" }} /> Take Away
          </h1>
        </div>
        {canEdit && (
          <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.25rem", background: "#c9a84c", border: "none", borderRadius: 4, color: "#0a0a0f", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <Plus size={15} /> Añadir producto
          </button>
        )}
      </div>

      {/* Selector concepto */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
        {CONCEPTOS.map(c => (
          <button key={c} onClick={() => { setConcepto(c as "mexican" | "sushi"); setCatFiltro("all"); }} style={{
            padding: "6px 20px", borderRadius: 6, border: "1.5px solid #c9a84c", cursor: "pointer",
            fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em",
            background: concepto === c ? "#c9a84c" : "transparent",
            color: concepto === c ? "#0a0a0f" : "#c9a84c",
          }}>{c}</button>
        ))}
      </div>

      {/* Filtro categorías */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "1.5rem" }}>
        <button onClick={() => setCatFiltro("all")} style={{ padding: "4px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", background: catFiltro === "all" ? "#c9a84c" : "transparent", color: catFiltro === "all" ? "#0a0a0f" : "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.1em" }}>Todos</button>
        {categorias.map(c => (
          <button key={c} onClick={() => setCatFiltro(c)} style={{ padding: "4px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", background: catFiltro === c ? "#c9a84c" : "transparent", color: catFiltro === c ? "#0a0a0f" : "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {CAT_LABELS[c] ?? c}
          </button>
        ))}
      </div>

      {/* Grid de productos */}
      {loading ? (
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Cargando...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.2)", fontSize: 14 }}>No hay productos. Añade el primero.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
          {filtered.map(p => (
            <div key={p.id} style={{
              background: "#0e0d0b", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 10, overflow: "hidden", position: "relative",
              opacity: p.activo ? 1 : 0.45, transition: "transform 150ms",
            }}>
              {/* Imagen */}
              <div style={{ position: "relative", height: 140, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                {p.imagen ? (
                  <img src={p.imagen} alt={p.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🍽️</div>
                )}
                {/* Badge estado */}
                <span style={{
                  position: "absolute", top: 8, right: 8, fontSize: 10, padding: "3px 8px", borderRadius: 999,
                  background: p.activo ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.06)",
                  color: p.activo ? "#4ade80" : "rgba(255,255,255,0.3)",
                  border: `1px solid ${p.activo ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.1)"}`,
                  fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em",
                }}>{p.activo ? "Activo" : "Oculto"}</span>
                {/* Badge categoría */}
                <span style={{
                  position: "absolute", bottom: 8, left: 8, fontSize: 10, padding: "3px 8px", borderRadius: 999,
                  background: "rgba(201,168,76,0.15)", color: "#c9a84c",
                  border: "1px solid rgba(201,168,76,0.25)", fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "0.08em",
                }}>{p.categoria}</span>
              </div>

              {/* Info */}
              <div style={{ padding: "0.875rem" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: "0 0 4px", lineHeight: 1.3 }}>{p.nombre}</p>
                {p.descripcion && (
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 0.75rem", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {p.descripcion}
                  </p>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#c9a84c" }}>
                    {p.precio.toLocaleString("es-ES")},-
                  </span>
                  <div style={{ display: "flex", gap: "0.375rem" }}>
                    {canEdit && <button onClick={() => openEdit(p)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}><Pencil size={12} /></button>}
                    {canDelete && <button onClick={() => setDeleteId(p.id)} style={{ background: "rgba(252,165,165,0.06)", border: "1px solid rgba(252,165,165,0.15)", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "rgba(252,165,165,0.7)" }}><Trash2 size={12} /></button>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal añadir/editar */}
      {modal && (
        <Modal title={modal === "add" ? "Añadir producto" : "Editar producto"} onClose={() => setModal(null)}>
          <Field label="Concepto">
            <select value={form.concepto} onChange={e => { f("concepto", e.target.value); }} style={SELECT}>
              {CONCEPTOS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Categoría">
            <input value={form.categoria} onChange={e => f("categoria", e.target.value)} style={INPUT} placeholder="ej: snacks, makis, sashimi..." list="cat-list" />
            <datalist id="cat-list">
              {Array.from(new Set(productos.filter(p => p.concepto === form.concepto).map(p => p.categoria))).map(c => (
                <option key={c} value={c}>{CAT_LABELS[c] ?? c}</option>
              ))}
            </datalist>
          </Field>
          <Field label="Nombre">
            <input value={form.nombre} onChange={e => f("nombre", e.target.value)} style={INPUT} placeholder="Nombre del plato" />
          </Field>
          <Field label="Descripción">
            <textarea value={form.descripcion} onChange={e => f("descripcion", e.target.value)} style={{ ...INPUT, minHeight: 80, resize: "vertical" }} placeholder="Descripción breve" />
          </Field>
          <Field label="Precio (NOK)">
            <input type="number" value={form.precio} onChange={e => f("precio", Number(e.target.value))} style={INPUT} />
          </Field>
          <Field label="Imagen">
            {/* Preview como tarjeta de producto */}
            {form.imagen && (
              <div style={{ marginBottom: 12, background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ position: "relative", height: 160 }}>
                  <img src={form.imagen} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <span style={{ position: "absolute", bottom: 8, left: 8, fontSize: 10, padding: "3px 8px", borderRadius: 999, background: "rgba(201,168,76,0.15)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.25)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {form.categoria}
                  </span>
                </div>
                <div style={{ padding: "0.75rem" }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: "0 0 3px" }}>{form.nombre || "Nombre del plato"}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 0.625rem", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {form.descripcion || "Descripción del plato..."}
                  </p>
                  <span style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#c9a84c" }}>
                    {form.precio ? `${Number(form.precio).toLocaleString("es-ES")},-` : "0,-"}
                  </span>
                </div>
              </div>
            )}
            {/* Upload */}
            <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(201,168,76,0.08)", border: "1px dashed rgba(201,168,76,0.3)", borderRadius: 4, cursor: "pointer", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#c9a84c" }}>{uploading ? "Subiendo..." : "📁 Subir imagen"}</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} disabled={uploading} />
            </label>
            {/* URL manual */}
            <input value={form.imagen} onChange={e => f("imagen", e.target.value)} style={INPUT} placeholder="O pega una URL..." />
          </Field>
          <Field label="Estado">
            <select value={form.activo ? "activo" : "oculto"} onChange={e => f("activo", e.target.value === "activo")} style={SELECT}>
              <option value="activo">Activo — visible en la carta</option>
              <option value="oculto">Oculto — no visible</option>
            </select>
          </Field>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button onClick={() => setModal(null)} style={{ flex: 1, padding: "10px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13 }}>Cancelar</button>
            <button onClick={handleSave} disabled={saving || !form.nombre || !form.precio} style={{ flex: 2, padding: "10px", border: "none", borderRadius: 4, background: "#c9a84c", color: "#0a0a0f", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: saving ? 0.6 : 1 }}>
              <Check size={14} />{saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </Modal>
      )}

      {/* Confirm delete */}
      {deleteId && (
        <Modal title="Eliminar producto" onClose={() => setDeleteId(null)}>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: "1.5rem" }}>¿Seguro que quieres eliminar este producto? Esta acción no se puede deshacer.</p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: "10px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13 }}>Cancelar</button>
            <button onClick={() => handleDelete(deleteId)} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 4, background: "rgba(252,165,165,0.15)", color: "#fca5a5", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Eliminar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

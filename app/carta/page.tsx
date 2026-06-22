"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  UtensilsCrossed, Waves, Wine, Save, Plus, Trash2,
  ChevronDown, ChevronRight, Check, PackageOpen, Pencil, X, Eye, EyeOff, GripVertical, Star,
} from "lucide-react";
import { useSession } from "@/lib/session";
import { useAdminLanguage } from "@/lib/LanguageContext";

// ─── TIPOS ───────────────────────────────────────────────────────────────────

type Item    = { name: string; desc?: string; price: string; allergens?: string; badge?: string; image?: string; halal?: boolean; activo?: boolean };
type Section = { title: string; image?: string; items: Item[] };
type Menus   = { mexicana: Section[]; sushi: Section[]; bebidas: Section[] };

type Producto = {
  id: number; nombre: string; nombreEn?: string; descripcion?: string; precio: number;
  categoria: string; concepto: string; imagen?: string; activo: boolean; destacado?: boolean;
};

// ─── CONSTANTES ──────────────────────────────────────────────────────────────

const MENU_TAB_META = [
  { key: "mexicana", icon: UtensilsCrossed, color: "#c9a84c" },
  { key: "sushi",    icon: Waves,           color: "#60a5fa" },
  { key: "bebidas",  icon: Wine,            color: "#a78bfa" },
] as const;

type MenuTabKey = typeof MENU_TAB_META[number]["key"];

const CAT_LABELS: Record<string, string> = {
  snacks: "Snacks", ceviches: "Ceviches", tacos: "Tacos", flautas: "Flautas",
  sushi: "Sushi Bar", principales: "Principales", postres: "Postres",
  "klassisk-nigiri": "Nigiri Clásico", "spesial-nigiri": "Nigiri Especial",
  "klassisk-maki": "Maki Clásico", "spesial-maki": "Maki Especial", "futo-maki": "Futo Maki",
  "klassisk-sashimi": "Sashimi Clásico", "spesial-sashimi": "Sashimi Especial",
  tartar: "Tartar", combos: "Combos",
};

const CAT_LABELS_EN: Record<string, string> = {
  snacks: "Snacks", ceviches: "Ceviches", tacos: "Tacos", flautas: "Flautas",
  sushi: "Sushi Bar", principales: "Main Courses", postres: "Desserts",
  "klassisk-nigiri": "Classic Nigiri", "spesial-nigiri": "Special Nigiri",
  "klassisk-maki": "Classic Maki", "spesial-maki": "Special Maki", "futo-maki": "Futo Maki",
  "klassisk-sashimi": "Classic Sashimi", "spesial-sashimi": "Special Sashimi",
  tartar: "Tartar", combos: "Combos",
};

const EMPTY_PRODUCTO: Omit<Producto, "id"> = {
  nombre: "", nombreEn: "", descripcion: "", precio: 0, categoria: "snacks",
  concepto: "mexican", imagen: "", activo: true,
};

const EMPTY_ITEM: Item = { name: "", price: "", desc: "", allergens: "", badge: "", image: "", halal: false };

// ─── ESTILOS BASE ─────────────────────────────────────────────────────────────

const INPUT: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 4, padding: "0.6rem 0.9rem", color: "#fff", fontSize: 14, outline: "none",
  boxSizing: "border-box",
};

const CARD_GRID: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem",
};

// ─── DROPDOWN ────────────────────────────────────────────────────────────────

function Dropdown({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <button onClick={() => setOpen(o => !o)} style={{ ...INPUT, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: "0.5rem" }}>
        <span style={{ color: selected ? "#fff" : "rgba(255,255,255,0.3)" }}>{selected?.label ?? "Seleccionar"}</span>
        <ChevronDown size={12} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0, transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 1000, background: "#141210", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
          {options.map(o => (
            <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "0.55rem 1rem", fontSize: 14, cursor: "pointer", background: o.value === value ? "rgba(201,168,76,0.1)" : "transparent", color: o.value === value ? "#c9a84c" : "rgba(255,255,255,0.7)", border: "none", outline: "none" }}
              onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.background = "transparent"; }}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MODAL ───────────────────────────────────────────────────────────────────

function Modal({ title, onClose, headerAction, children }: { title: string; onClose: () => void; headerAction?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#0e0d0b", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>{title}</h2>
            {headerAction}
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 6, display: "flex" }}><X size={16} /></button>
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

// ─── TARJETA DE ITEM (carta JSON) ────────────────────────────────────────────

function ItemCard({ item, onEdit, onDelete, onToggle, canEdit, onDragStart, onDragEnd, isDragging }: {
  item: Item; onEdit: () => void; onDelete: () => void; onToggle: () => void; canEdit: boolean;
  onDragStart?: () => void; onDragEnd?: () => void; isDragging?: boolean;
}) {
  const visible = item.activo !== false;
  return (
    <div
      draggable={canEdit && !!onDragStart}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{ background: "#0e0d0b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, overflow: "hidden", transition: "transform 150ms, opacity 150ms", opacity: isDragging ? 0.4 : visible ? 1 : 0.45, cursor: canEdit && onDragStart ? "grab" : "default" }}
      onMouseEnter={e => { if (!isDragging) e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => e.currentTarget.style.transform = "none"}>
      <div style={{ position: "relative", height: 140, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
        {item.image ? (
          <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UtensilsCrossed size={28} style={{ color: "rgba(255,255,255,0.08)" }} />
          </div>
        )}
        {canEdit && onDragStart && (
          <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.55)", borderRadius: 5, padding: "3px 4px", display: "flex", alignItems: "center", pointerEvents: "none" }}>
            <GripVertical size={14} style={{ color: "rgba(255,255,255,0.7)" }} />
          </div>
        )}
        {item.badge && (
          <span style={{ position: "absolute", top: 8, left: canEdit && onDragStart ? 36 : 8, fontSize: 12, padding: "4px 13px", borderRadius: 999, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", background: "rgba(201,168,76,0.15)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.25)" }}>
            {item.badge}
          </span>
        )}
        {item.halal && (
          <span style={{ position: "absolute", top: 8, right: 8, fontSize: 12, padding: "4px 13px", borderRadius: 999, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)" }}>
            Halal
          </span>
        )}
        {canEdit && (
          <button onClick={e => { e.stopPropagation(); onToggle(); }} title={visible ? "Ocultar plato" : "Mostrar plato"}
            style={{ position: "absolute", bottom: 8, right: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, cursor: "pointer", transition: "all 0.15s", background: visible ? "rgba(255,255,255,0.12)" : "rgba(252,165,165,0.12)", border: `1px solid ${visible ? "rgba(255,255,255,0.2)" : "rgba(252,165,165,0.3)"}`, color: visible ? "rgba(255,255,255,0.7)" : "#fca5a5" }}>
            {visible ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
        )}
      </div>
      <div style={{ padding: "0.875rem" }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: "0 0 4px", lineHeight: 1.3 }}>{item.name || "Sin nombre"}</p>
        {item.desc && (
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 0.75rem", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {item.desc}
          </p>
        )}
        {item.allergens && (
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", margin: "0 0 0.75rem", letterSpacing: "0.05em" }}>
            {item.allergens}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#c9a84c" }}>{item.price}</span>
          <div style={{ display: "flex", gap: "0.375rem" }}>
            {canEdit && <button onClick={onEdit} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}><Pencil size={12} /></button>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SECCIÓN CON TARJETAS ────────────────────────────────────────────────────

function SectionCards({ section, onChange, onDelete, canEdit, onSave, sectionIdx, dragInfo, onItemDragStart, onItemDragEnd, onDropHere }: {
  section: Section; onChange: (s: Section) => void; onDelete: () => void;
  canEdit: boolean; onSave: () => void;
  sectionIdx: number;
  dragInfo: { sectionIdx: number; itemIdx: number } | null;
  onItemDragStart: (sectionIdx: number, itemIdx: number) => void;
  onItemDragEnd: () => void;
  onDropHere: (targetSectionIdx: number) => void;
}) {
  const { tr } = useAdminLanguage();
  const a = tr.admin;
  const [open, setOpen]         = useState(true);
  const [editIdx, setEditIdx]   = useState<number | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [form, setForm]         = useState<Item>(EMPTY_ITEM);
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);

  const openEdit = (i: number) => { setForm({ ...section.items[i] }); setEditIdx(i); };
  const openAdd  = () => { setForm(EMPTY_ITEM); setAddModal(true); };

  const saveEdit = () => {
    const items = [...section.items]; items[editIdx!] = form;
    onChange({ ...section, items }); onSave(); setEditIdx(null);
  };

  const saveAdd = () => {
    onChange({ ...section, items: [...section.items, form] }); onSave(); setAddModal(false);
  };

  const confirmDelete = () => {
    onChange({ ...section, items: section.items.filter((_, i) => i !== deleteIdx!) });
    onSave(); setDeleteIdx(null);
  };

  const f = (k: keyof Item, v: string | boolean) => setForm(prev => ({ ...prev, [k]: v }));

  const [uploading, setUploading] = useState(false);
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (res.ok) { const { url } = await res.json(); f("image", url); }
    setUploading(false);
  };

  const ItemForm = () => (
    <>
      <Field label={a.campoNombre}><input value={form.name} onChange={e => f("name", e.target.value)} style={INPUT} placeholder={a.placeholderNombrePlato} /></Field>
      <Field label={a.campoDescripcion}><textarea value={form.desc ?? ""} onChange={e => f("desc", e.target.value)} style={{ ...INPUT, minHeight: 80, resize: "vertical" }} /></Field>
      <Field label={a.campoPrecioSimple}><input value={form.price} onChange={e => f("price", e.target.value)} style={INPUT} placeholder={a.placeholderPrecio} /></Field>
      <Field label={a.campoAlergenos}><input value={form.allergens ?? ""} onChange={e => f("allergens", e.target.value)} style={INPUT} placeholder={a.placeholderAlergenos} /></Field>
      <Field label={a.campoBadge}><input value={form.badge ?? ""} onChange={e => f("badge", e.target.value)} style={INPUT} placeholder={a.placeholderBadge} /></Field>
      <Field label={a.campoImagen}>
        {form.image && <div style={{ marginBottom: 12, borderRadius: 8, overflow: "hidden", height: 140 }}><img src={form.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
        <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(201,168,76,0.08)", border: "1px dashed rgba(201,168,76,0.3)", borderRadius: 6, cursor: "pointer", marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: "#c9a84c" }}>{uploading ? a.subiendo : a.subirImagen}</span>
          <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} disabled={uploading} />
        </label>
        <input value={form.image ?? ""} onChange={e => f("image", e.target.value)} style={INPUT} placeholder={a.placeholderUrl} />
      </Field>
      <Field label={a.campoHalal}>
        <button onClick={() => f("halal", !form.halal)}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: form.halal ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${form.halal ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.1)"}`, borderRadius: 4, padding: "0.5rem 0.75rem", color: form.halal ? "#4ade80" : "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 13 }}>
          {form.halal && <Check size={12} />} {form.halal ? "Sí" : "No"}
        </button>
      </Field>
    </>
  );

  return (
    <>
      <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden", marginBottom: "1.5rem" }}>
        {/* Header sección — drop zone */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1rem", background: dragInfo ? "rgba(201,168,76,0.07)" : "rgba(255,255,255,0.03)", cursor: "pointer", transition: "background 150ms" }}
          onClick={() => setOpen(o => !o)}
          onDragOver={e => { if (dragInfo) { e.preventDefault(); e.currentTarget.style.background = "rgba(201,168,76,0.18)"; } }}
          onDragLeave={e => { e.currentTarget.style.background = dragInfo ? "rgba(201,168,76,0.07)" : "rgba(255,255,255,0.03)"; }}
          onDrop={e => { e.preventDefault(); e.currentTarget.style.background = "rgba(255,255,255,0.03)"; onDropHere(sectionIdx); }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {open ? <ChevronDown size={14} style={{ color: "rgba(201,168,76,0.6)" }} /> : <ChevronRight size={14} style={{ color: "rgba(201,168,76,0.6)" }} />}
            <div>
              <input value={section.title} onChange={e => onChange({ ...section, title: e.target.value })} onClick={e => e.stopPropagation()}
                style={{ background: "none", border: "none", color: "#fff", fontSize: 14, fontWeight: 600, outline: "none", cursor: "text" }} />
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>{section.items.length} {a.productos}</p>
            </div>
          </div>
          {canEdit && (
            <button onClick={e => { e.stopPropagation(); onDelete(); }}
              style={{ background: "none", border: "1px solid rgba(252,165,165,0.15)", borderRadius: 4, padding: "0.3rem 0.6rem", color: "rgba(252,165,165,0.4)", cursor: "pointer", fontSize: 11 }}>
              {a.eliminarSeccion}
            </button>
          )}
        </div>

        {open && (
          <div style={{ padding: "1rem" }}>
            {section.items.length === 0 ? (
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginBottom: "1rem", textAlign: "center" }}>{a.noHayProductos}</p>
            ) : (
              <div style={{ ...CARD_GRID, marginBottom: "1rem" }}>
                {section.items.map((item, i) => (
                  <ItemCard key={i} item={item} canEdit={canEdit}
                    onEdit={() => openEdit(i)}
                    onDelete={() => setDeleteIdx(i)}
                    onDragStart={() => onItemDragStart(sectionIdx, i)}
                    onDragEnd={onItemDragEnd}
                    isDragging={dragInfo?.sectionIdx === sectionIdx && dragInfo?.itemIdx === i}
                    onToggle={() => {
                      const updated = section.items.map((it, idx) => idx === i ? { ...it, activo: it.activo === false ? true : false } : it);
                      const next = { ...section, items: updated };
                      onChange(next);
                      onSave();
                    }} />
                ))}
              </div>
            )}
            {canEdit && (
              <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%", justifyContent: "center", padding: "0.625rem", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 6, color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 13 }}>
                <Plus size={13} /> {a.añadirProducto}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal editar item */}
      {editIdx !== null && (
        <Modal title={a.editarPlato} onClose={() => setEditIdx(null)}
          headerAction={
            <button onClick={() => { setEditIdx(null); setDeleteIdx(editIdx); }} style={{ background: "rgba(252,165,165,0.08)", border: "1px solid rgba(252,165,165,0.2)", borderRadius: 6, color: "#fca5a5", cursor: "pointer", padding: 6, display: "flex" }}>
              <Trash2 size={16} />
            </button>
          }>
          <ItemForm />
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button onClick={saveEdit} style={{ flex: 2, padding: "10px", border: "none", borderRadius: 6, background: "#c9a84c", color: "#0a0a0f", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Check size={14} /> {a.guardar}
            </button>
            <button onClick={() => setEditIdx(null)} style={{ flex: 1, padding: "10px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13 }}>{a.cancelar}</button>
          </div>
        </Modal>
      )}

      {/* Modal añadir item */}
      {addModal && (
        <Modal title={a.añadirPlato} onClose={() => setAddModal(false)}>
          <ItemForm />
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button onClick={saveAdd} disabled={!form.name} style={{ flex: 2, padding: "10px", border: "none", borderRadius: 6, background: "#c9a84c", color: "#0a0a0f", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Check size={14} /> {a.añadir}
            </button>
            <button onClick={() => setAddModal(false)} style={{ flex: 1, padding: "10px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13 }}>{a.cancelar}</button>
          </div>
        </Modal>
      )}

      {/* Modal confirmar borrado */}
      {deleteIdx !== null && (
        <Modal title={a.eliminarPlato} onClose={() => setDeleteIdx(null)}>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: "1.5rem" }}>{a.confirmarEliminarPlato} <strong style={{ color: "#fff" }}>{section.items[deleteIdx]?.name}</strong>?</p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={confirmDelete} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 6, background: "rgba(252,165,165,0.12)", color: "#fca5a5", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{a.eliminar}</button>
            <button onClick={() => setDeleteIdx(null)} style={{ flex: 1, padding: "10px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13 }}>{a.cancelar}</button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ─── PANEL TAKE AWAY ─────────────────────────────────────────────────────────

function TakeAwayPanel({ canEdit, canDelete }: { canEdit: boolean; canDelete: boolean }) {
  const { tr, lang } = useAdminLanguage();
  const a = tr.admin;
  const labels = lang === "en" ? CAT_LABELS_EN : CAT_LABELS;
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading]     = useState(true);
  const [concepto, setConcepto]   = useState<"mexican" | "sushi">("mexican");
  const [catFiltro, setCatFiltro] = useState("all");
  const [modal, setModal]         = useState<"add" | "edit" | null>(null);
  const [form, setForm]           = useState<Omit<Producto, "id">>(EMPTY_PRODUCTO);
  const [editId, setEditId]       = useState<number | null>(null);
  const [saving, setSaving]       = useState(false);
  const [deleteId, setDeleteId]   = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragId, setDragId]       = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const handleDrop = async (categoria: string) => {
    if (dragId === null || categoria === "all") return;
    setProductos(prev => prev.map(p => p.id === dragId ? { ...p, categoria } : p));
    await fetch(`/api/admin/carta/${dragId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoria }),
    });
    setDragId(null); setDropTarget(null);
  };

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/carta");
    if (res.ok) setProductos(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const conceptItems = productos.filter(p => (p.concepto ?? "mexican") === concepto);
  const categorias   = Array.from(new Set(conceptItems.map(p => p.categoria)));
  const filtered     = conceptItems.filter(p => catFiltro === "all" || p.categoria === catFiltro);

  const openAdd = () => {
    setForm({ ...EMPTY_PRODUCTO, concepto, categoria: categorias[0] ?? "snacks" });
    setModal("add");
  };

  const openEdit = (p: Producto) => {
    setEditId(p.id);
    setForm({ nombre: p.nombre, nombreEn: p.nombreEn ?? "", descripcion: p.descripcion ?? "", precio: p.precio, categoria: p.categoria, concepto: p.concepto ?? "mexican", imagen: p.imagen ?? "", activo: p.activo });
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

  const toggleActivo = async (p: Producto) => {
    const next = !p.activo;
    setProductos(prev => prev.map(x => x.id === p.id ? { ...x, activo: next } : x));
    await fetch(`/api/admin/carta/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activo: next }) });
  };

  const toggleDestacado = async (p: Producto) => {
    const next = !p.destacado;
    setProductos(prev => prev.map(x => x.id === p.id ? { ...x, destacado: next } : x));
    await fetch(`/api/admin/carta/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destacado: next }) });
  };

  const f = (k: keyof typeof form, v: string | number | boolean) => setForm(prev => ({ ...prev, [k]: v }));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (res.ok) { const { url } = await res.json(); f("imagen", url); }
    setUploading(false);
  };

  const conceptoOptions = [{ value: "mexican", label: "Mexican" }, { value: "sushi", label: "Sushi" }];
  const estadoOptions   = [{ value: "activo", label: a.activoVisibleCarta }, { value: "oculto", label: a.ocultoNoVisible }];
  const catOptions      = Array.from(new Set(productos.filter(p => p.concepto === form.concepto).map(p => p.categoria)))
    .map(c => ({ value: c, label: labels[c] ?? c }));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {(["mexican", "sushi"] as const).map(c => (
            <button key={c} onClick={() => { setConcepto(c); setCatFiltro("all"); }} style={{
              padding: "6px 20px", borderRadius: 6, border: "1.5px solid rgba(201,168,76,0.4)", cursor: "pointer",
              fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", transition: "all 0.15s",
              background: concepto === c ? "#c9a84c" : "transparent",
              color: concepto === c ? "#0a0a0f" : "#c9a84c",
            }}>{c}</button>
          ))}
        </div>
        {canEdit && (
          <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.25rem", background: "#c9a84c", border: "none", borderRadius: 6, color: "#0a0a0f", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <Plus size={14} /> {a.añadirProducto}
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "1.25rem", alignItems: "center" }}>
        {dragId !== null && <span style={{ fontSize: 11, color: "rgba(201,168,76,0.6)", marginRight: "0.25rem" }}>{a.sueltaEnCategoria}</span>}
        {[{ value: "all", label: a.todos }, ...categorias.map(c => ({ value: c, label: labels[c] ?? c }))].map(({ value, label }) => (
          <button key={value}
            onClick={() => setCatFiltro(value)}
            onDragOver={e => { if (value !== "all") { e.preventDefault(); setDropTarget(value); }}}
            onDragLeave={() => setDropTarget(null)}
            onDrop={e => { e.preventDefault(); handleDrop(value); }}
            style={{
              padding: "4px 14px", borderRadius: 999, border: dropTarget === value ? "1.5px solid #c9a84c" : "1px solid rgba(255,255,255,0.1)",
              background: dropTarget === value ? "rgba(201,168,76,0.2)" : catFiltro === value ? "#c9a84c" : "transparent",
              color: dropTarget === value ? "#c9a84c" : catFiltro === value ? "#0a0a0f" : "rgba(255,255,255,0.4)",
              fontSize: 11, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.1em",
              transform: dropTarget === value ? "scale(1.08)" : "none",
              transition: "all 0.15s",
            }}>{label}</button>
        ))}
      </div>

      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginBottom: "1rem" }}>
        {filtered.length} {filtered.length !== 1 ? a.productos : a.producto}
        {catFiltro !== "all" && ` · ${labels[catFiltro] ?? catFiltro}`}
      </p>

      {loading ? (
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>{a.cargandoMenus}</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.2)", fontSize: 14 }}>{a.sinProductos}</div>
      ) : (
        <div style={CARD_GRID}>
          {filtered.map(p => (
            <div key={p.id}
              draggable={canEdit}
              onDragStart={() => setDragId(p.id)}
              onDragEnd={() => { setDragId(null); setDropTarget(null); }}
              style={{ background: "#0e0d0b", border: `1px solid ${dragId === p.id ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.07)"}`, borderRadius: 10, overflow: "hidden", opacity: dragId === p.id ? 0.5 : p.activo ? 1 : 0.45, transition: "transform 150ms", cursor: canEdit ? "grab" : "default" }}
              onMouseEnter={e => { if (dragId === null) e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => e.currentTarget.style.transform = "none"}>
              <div style={{ position: "relative", height: 140, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                {p.imagen ? (
                  <img src={p.imagen} alt={p.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <PackageOpen size={32} style={{ color: "rgba(255,255,255,0.1)" }} />
                  </div>
                )}
                {canEdit && (
                  <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.5)", borderRadius: 4, padding: "2px 4px", display: "flex", alignItems: "center", color: "rgba(255,255,255,0.4)" }}>
                    <GripVertical size={12} />
                  </div>
                )}
                <span style={{ position: "absolute", top: 8, right: 8, fontSize: 12, padding: "4px 13px", borderRadius: 999, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", background: p.activo ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.06)", color: p.activo ? "#4ade80" : "rgba(255,255,255,0.3)", border: `1px solid ${p.activo ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.1)"}` }}>{p.activo ? a.statusActivo : a.statusOculto}</span>
                {canEdit && (
                  <button onClick={e => { e.stopPropagation(); toggleActivo(p); }} title={p.activo ? a.ocultarPlato : a.mostrarPlato}
                    style={{ position: "absolute", bottom: 8, right: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, cursor: "pointer", transition: "all 0.15s", background: p.activo ? "rgba(255,255,255,0.12)" : "rgba(252,165,165,0.12)", border: `1px solid ${p.activo ? "rgba(255,255,255,0.2)" : "rgba(252,165,165,0.3)"}`, color: p.activo ? "rgba(255,255,255,0.7)" : "#fca5a5" }}>
                    {p.activo ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                )}
                {canEdit && (
                  <button onClick={e => { e.stopPropagation(); toggleDestacado(p); }} title={p.destacado ? a.quitarDestacado : a.destacarHome}
                    style={{ position: "absolute", bottom: 8, right: 44, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, cursor: "pointer", transition: "all 0.15s", background: p.destacado ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.12)", border: `1px solid ${p.destacado ? "rgba(201,168,76,0.5)" : "rgba(255,255,255,0.2)"}`, color: p.destacado ? "#c9a84c" : "rgba(255,255,255,0.7)" }}>
                    <Star size={13} fill={p.destacado ? "#c9a84c" : "none"} />
                  </button>
                )}
                <span style={{ position: "absolute", bottom: 8, left: 8, fontSize: 12, padding: "4px 13px", borderRadius: 999, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", background: "rgba(201,168,76,0.15)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.25)" }}>{labels[p.categoria] ?? p.categoria}</span>
              </div>
              <div style={{ padding: "0.875rem" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: "0 0 4px", lineHeight: 1.3 }}>{p.nombre}</p>
                {p.descripcion && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 0.75rem", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.descripcion}</p>}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#c9a84c" }}>{p.precio.toLocaleString("es-ES")},-</span>
                  <div style={{ display: "flex", gap: "0.375rem" }}>
                    {canEdit && <button onClick={() => openEdit(p)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}><Pencil size={12} /></button>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === "add" ? a.añadirProductoModal : a.editarProducto} onClose={() => setModal(null)}>
          <Field label={a.campoConcepto}><Dropdown value={form.concepto} onChange={v => f("concepto", v)} options={conceptoOptions} /></Field>
          <Field label={a.campoCategoria}>
            <input value={form.categoria} onChange={e => f("categoria", e.target.value)} style={INPUT} placeholder={a.placeholderCategoria} list="cat-list" />
            <datalist id="cat-list">{catOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</datalist>
          </Field>
          <Field label={a.campoNombreEs}><input value={form.nombre} onChange={e => f("nombre", e.target.value)} style={INPUT} placeholder={a.placeholderNombrePlato} /></Field>
          <Field label={a.campoNombreEn}><input value={(form.nombreEn ?? "") as string} onChange={e => f("nombreEn", e.target.value)} style={INPUT} placeholder={a.placeholderNombrePlatoEn} /></Field>
          <Field label={a.campoDescripcion}><textarea value={form.descripcion} onChange={e => f("descripcion", e.target.value)} style={{ ...INPUT, minHeight: 80, resize: "vertical" }} /></Field>
          <Field label={a.campoPrecio}><input type="number" value={form.precio} onChange={e => f("precio", Number(e.target.value))} style={INPUT} /></Field>
          <Field label={a.campoImagen}>
            {form.imagen && <div style={{ marginBottom: 12, borderRadius: 8, overflow: "hidden", height: 140 }}><img src={form.imagen as string} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
            <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(201,168,76,0.08)", border: "1px dashed rgba(201,168,76,0.3)", borderRadius: 6, cursor: "pointer", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#c9a84c" }}>{uploading ? a.subiendo : a.subirImagen}</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} disabled={uploading} />
            </label>
            <input value={form.imagen as string} onChange={e => f("imagen", e.target.value)} style={INPUT} placeholder={a.placeholderUrl} />
          </Field>
          <Field label={a.campoEstado}><Dropdown value={form.activo ? "activo" : "oculto"} onChange={v => f("activo", v === "activo")} options={estadoOptions} /></Field>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button onClick={handleSave} disabled={saving || !form.nombre} style={{ flex: 2, padding: "10px", border: "none", borderRadius: 6, background: "#c9a84c", color: "#0a0a0f", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: saving ? 0.6 : 1 }}>
              <Check size={14} />{saving ? a.guardando : a.guardar}
            </button>
            <button onClick={() => setModal(null)} style={{ flex: 1, padding: "10px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13 }}>{a.cancelar}</button>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title={a.eliminarProducto} onClose={() => setDeleteId(null)}>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: "1.5rem" }}>{a.confirmarEliminarProducto}</p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={() => handleDelete(deleteId)} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 6, background: "rgba(252,165,165,0.12)", color: "#fca5a5", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{a.eliminar}</button>
            <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: "10px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13 }}>{a.cancelar}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────

type TabKey = MenuTabKey | "takeaway";

export default function CartaAdminPage() {
  const { tr } = useAdminLanguage();
  const a = tr.admin;
  const [menus, setMenus]       = useState<Menus | null>(null);
  const [tab, setTab]           = useState<TabKey>("mexicana");
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [loading, setLoading]   = useState(true);
  const [dragInfo, setDragInfo] = useState<{ sectionIdx: number; itemIdx: number } | null>(null);
  const autoSaveTimer           = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad             = useRef(true);
  const { role, loaded } = useSession();
  const canEdit   = loaded && role === "admin";
  const canDelete = loaded && role === "admin";

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/menus");
    if (res.ok) setMenus(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (data: Menus) => {
    setSaving(true);
    await fetch("/api/admin/menus", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  // Auto-save: cada vez que menus cambia, guarda tras 1s de inactividad
  useEffect(() => {
    if (!menus) return;
    if (isFirstLoad.current) { isFirstLoad.current = false; return; }
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => save(menus), 1000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [menus, save]);

  const updateSections = (sections: Section[]) => {
    if (!menus || tab === "takeaway") return;
    setMenus({ ...menus, [tab]: sections });
  };

  const handleItemDragStart = (sIdx: number, iIdx: number) => setDragInfo({ sectionIdx: sIdx, itemIdx: iIdx });
  const handleItemDragEnd   = () => setDragInfo(null);
  const handleDropOnSection = (targetSectionIdx: number) => {
    if (!dragInfo || !menus || tab === "takeaway") { setDragInfo(null); return; }
    if (dragInfo.sectionIdx === targetSectionIdx) { setDragInfo(null); return; }
    const secs = menus[tab as MenuTabKey].map(s => ({ ...s, items: [...s.items] }));
    const [moved] = secs[dragInfo.sectionIdx].items.splice(dragInfo.itemIdx, 1);
    secs[targetSectionIdx].items.push(moved);
    setMenus({ ...menus, [tab]: secs });
    setDragInfo(null);
  };

  const addSection = () => {
    if (!menus || tab === "takeaway") return;
    setMenus({ ...menus, [tab]: [...menus[tab as MenuTabKey], { title: "Nueva sección", items: [] }] });
  };

  const isMenuTab = tab !== "takeaway";
  const sections: Section[] = (isMenuTab && menus) ? menus[tab as MenuTabKey] : [];

  const MENU_TAB_LABELS: Record<MenuTabKey, string> = {
    mexicana: a.cartaMexicana, sushi: a.cartaSushi, bebidas: a.bebidas,
  };

  const ALL_TABS = [
    ...MENU_TAB_META.map(t => ({ ...t, label: MENU_TAB_LABELS[t.key] })),
    { key: "takeaway" as const, label: a.takeAway, icon: PackageOpen, color: "#4ade80" },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(201,168,76,0.5)", marginBottom: "0.25rem" }}>{a.gestion}</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-playfair, serif)", color: "#fff", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <UtensilsCrossed size={24} style={{ color: "#c9a84c" }} /> {a.carta}
          </h1>
        </div>
        {isMenuTab && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1.25rem", borderRadius: 6, border: "1px solid", fontSize: 12, fontWeight: 600, transition: "all 300ms",
            background: saved ? "rgba(74,222,128,0.1)" : saving ? "rgba(201,168,76,0.1)" : "rgba(201,168,76,0.06)",
            borderColor: saved ? "rgba(74,222,128,0.3)" : saving ? "rgba(201,168,76,0.35)" : "rgba(201,168,76,0.2)",
            color: saved ? "#4ade80" : saving ? "#c9a84c" : "rgba(201,168,76,0.55)" }}>
            {saved
              ? <><Check size={14} /> {a.guardado}</>
              : saving
              ? <><Save size={14} style={{ animation: "spin 1s linear infinite" }} /> {a.guardando}</>
              : <><Save size={14} /> {a.autoguardado ?? "Auto-guardado"}</>}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "1rem", flexWrap: "wrap" }}>
        {ALL_TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          const count = t.key === "takeaway" ? null : menus?.[t.key as MenuTabKey].reduce((acc, s) => acc + s.items.length, 0) ?? 0;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", borderRadius: 6, border: "1px solid", fontSize: 13, cursor: "pointer", transition: "all 150ms",
                background: active ? `${t.color}18` : "transparent",
                borderColor: active ? `${t.color}44` : "rgba(255,255,255,0.08)",
                color: active ? t.color : "rgba(255,255,255,0.35)" }}>
              <Icon size={14} /> {t.label}
              {count !== null && <span style={{ fontSize: 11, opacity: 0.6 }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Contenido */}
      {tab === "takeaway" ? (
        <TakeAwayPanel canEdit={canEdit} canDelete={canDelete} />
      ) : loading ? (
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>{a.cargandoMenus}</p>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
              {sections.length} {a.secciones} · {sections.reduce((acc, s) => acc + s.items.length, 0)} {a.productos}
            </p>
            {canEdit && (
              <button onClick={addSection} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 12 }}>
                <Plus size={12} /> {a.nuevaSeccion}
              </button>
            )}
          </div>
          {sections.map((sec, si) => (
            <SectionCards key={si} section={sec}
              onChange={updated => { const next = [...sections]; next[si] = updated; updateSections(next); }}
              onDelete={() => { updateSections(sections.filter((_, i) => i !== si)); }}
              canEdit={canEdit}
              onSave={() => save(menus!)}
              sectionIdx={si}
              dragInfo={dragInfo}
              onItemDragStart={handleItemDragStart}
              onItemDragEnd={handleItemDragEnd}
              onDropHere={handleDropOnSection} />
          ))}
        </>
      )}
    </div>
  );
}

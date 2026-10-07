"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import {
  UtensilsCrossed, Plus, Trash2, ChevronDown, Check,
  PackageOpen, Pencil, X, Eye, EyeOff, GripVertical, Star,
  RefreshCw, Search, Sparkles, AlertCircle
} from "lucide-react";
import { useSession } from "@/lib/session";
import { useAdminLanguage } from "@/lib/LanguageContext";

// ─── TIPOS ───────────────────────────────────────────────────────────────────

export type Producto = {
  id: number;
  nombre: string;
  nombreEn?: string | null;
  descripcion?: string | null;
  precio: number;
  categoria: string;
  sub?: string | null;
  alergenos?: string | null;
  imagen?: string | null;
  activo: boolean;
  destacado?: boolean;
  concepto?: string;
};

// ─── CONSTANTES ──────────────────────────────────────────────────────────────

const CATEGORIAS_CONFIG = [
  { slug: "all", label: "Todos", labelEn: "All" },
  { slug: "entrantes", label: "Entrantes", labelEn: "Starters" },
  { slug: "sushi", label: "Sushi", labelEn: "Sushi" },
  { slug: "calientes", label: "Calientes", labelEn: "Hot Dishes" },
  { slug: "postres", label: "Postres", labelEn: "Desserts" },
  { slug: "bebidas", label: "Bebidas", labelEn: "Drinks" },
];

const SUSHI_SUBCATS = [
  { slug: "todos", label: "Todos Sushi", labelEn: "All Sushi" },
  { slug: "nigiri", label: "Nigiri", labelEn: "Nigiri" },
  { slug: "uramaki", label: "Uramaki", labelEn: "Uramaki" },
  { slug: "futomaki", label: "Futomaki", labelEn: "Futomaki" },
  { slug: "maki", label: "Maki", labelEn: "Maki" },
];

const LISTA_ALERGENOS = [
  { slug: "gluten", label: "Gluten", short: "Gl" },
  { slug: "soja", label: "Soja", short: "So" },
  { slug: "pescado", label: "Pescado", short: "Pe" },
  { slug: "crustaceos", label: "Crustáceos", short: "Cr" },
  { slug: "huevo", label: "Huevo", short: "Hu" },
  { slug: "frutos_secos", label: "Frutos secos", short: "Fs" },
  { slug: "lacteos", label: "Lácteos", short: "La" },
  { slug: "sesamo", label: "Sésamo", short: "Se" },
  { slug: "moluscos", label: "Moluscos", short: "Mo" },
];

const EMPTY_PRODUCTO: Omit<Producto, "id"> = {
  nombre: "",
  nombreEn: "",
  descripcion: "",
  precio: 0,
  categoria: "entrantes",
  sub: "",
  alergenos: "",
  imagen: "",
  activo: true,
  destacado: false,
  concepto: "obento",
};

// ─── ESTILOS BASE ─────────────────────────────────────────────────────────────

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6,
  padding: "0.65rem 0.9rem",
  color: "#fff",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const CARD_GRID: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: "1.25rem",
};

// ─── DROPDOWN COMPONENT ──────────────────────────────────────────────────────

function Dropdown({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          ...INPUT_STYLE,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          gap: "0.5rem",
        }}
      >
        <span style={{ color: selected ? "#fff" : "rgba(255,255,255,0.3)" }}>
          {selected?.label ?? "Seleccionar"}
        </span>
        <ChevronDown
          size={14}
          style={{
            color: "rgba(255,255,255,0.4)",
            flexShrink: 0,
            transition: "transform 0.15s",
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 1000,
            background: "#141210",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,0.7)",
          }}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "0.6rem 1rem",
                fontSize: 13,
                cursor: "pointer",
                background: o.value === value ? "rgba(200,30,34,0.18)" : "transparent",
                color: o.value === value ? "#ff6b6e" : "rgba(255,255,255,0.8)",
                border: "none",
                outline: "none",
              }}
              onMouseEnter={(e) => {
                if (o.value !== value) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                if (o.value !== value) e.currentTarget.style.background = "transparent";
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MODAL COMPONENT ─────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#0f0e0d",
          border: "1px solid rgba(200,30,34,0.3)",
          borderRadius: 12,
          width: "100%",
          maxWidth: 580,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              padding: 6,
              display: "flex",
            }}
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: "1.5rem" }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label
        style={{
          display: "block",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "rgba(255,255,255,0.4)",
          marginBottom: "0.4rem",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── PÁGINA PRINCIPAL CARTA ──────────────────────────────────────────────────

export default function CartaAdminPage() {
  const { lang } = useAdminLanguage();
  const { role, loaded } = useSession();
  const canEdit = loaded && role === "admin";

  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  // Filtros
  const [catFiltro, setCatFiltro] = useState<string>("all");
  const [sushiSubFiltro, setSushiSubFiltro] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState<string>("");

  // Modales
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<Omit<Producto, "id">>(EMPTY_PRODUCTO);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  // Drag & drop de categoría
  const [dragId, setDragId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  // Cargar platos desde API
  const cargarPlatos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/carta");
      if (res.ok) {
        const data = await res.json();
        setProductos(data);
      }
    } catch (e) {
      console.error("Error cargando carta:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPlatos();
  }, []);

  // Sincronizar carta con menuData.js oficial
  const handleSyncWeb = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/admin/carta/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncMsg(`Carta sincronizada correctamente (${data.count} platos).`);
        await cargarPlatos();
      } else {
        setSyncMsg(`Error al sincronizar: ${data.error || "Desconocido"}`);
      }
    } catch (err: any) {
      setSyncMsg(`Error de conexión al sincronizar.`);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 4000);
    }
  };

  // Filtrado reactivo de platos
  const platosFiltrados = useMemo(() => {
    let list = productos;

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(q)) ||
          p.categoria.toLowerCase().includes(q) ||
          (p.sub && p.sub.toLowerCase().includes(q)) ||
          (p.alergenos && p.alergenos.toLowerCase().includes(q))
      );
    }

    if (catFiltro !== "all") {
      list = list.filter((p) => p.categoria === catFiltro);
    }

    if (catFiltro === "sushi" && sushiSubFiltro !== "todos") {
      list = list.filter((p) => p.sub === sushiSubFiltro);
    }

    return list;
  }, [productos, catFiltro, sushiSubFiltro, busqueda]);

  // Contadores por categoría
  const countCat = (catSlug: string) => {
    if (catSlug === "all") return productos.length;
    return productos.filter((p) => p.categoria === catSlug).length;
  };

  const countSushiSub = (subSlug: string) => {
    if (subSlug === "todos") return productos.filter((p) => p.categoria === "sushi").length;
    return productos.filter((p) => p.categoria === "sushi" && p.sub === subSlug).length;
  };

  // Drag and drop entre categorías
  const handleDrop = async (categoria: string) => {
    if (dragId === null || categoria === "all") return;
    setProductos((prev) => prev.map((p) => (p.id === dragId ? { ...p, categoria } : p)));
    await fetch(`/api/admin/carta/${dragId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoria }),
    });
    setDragId(null);
    setDropTarget(null);
  };

  // Apertura modales
  const openAdd = () => {
    setForm({
      ...EMPTY_PRODUCTO,
      categoria: catFiltro === "all" ? "entrantes" : catFiltro,
      sub: catFiltro === "sushi" && sushiSubFiltro !== "todos" ? sushiSubFiltro : "",
    });
    setModal("add");
  };

  const openEdit = (p: Producto) => {
    setEditId(p.id);
    setForm({
      nombre: p.nombre,
      nombreEn: p.nombreEn ?? "",
      descripcion: p.descripcion ?? "",
      precio: p.precio,
      categoria: p.categoria,
      sub: p.sub ?? "",
      alergenos: p.alergenos ?? "",
      imagen: p.imagen ?? "",
      activo: p.activo,
      destacado: p.destacado ?? false,
      concepto: p.concepto ?? "obento",
    });
    setModal("edit");
  };

  // Guardar creación / edición
  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === "add") {
        await fetch("/api/admin/carta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else if (editId !== null) {
        await fetch(`/api/admin/carta/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      await cargarPlatos();
      setModal(null);
    } catch (e) {
      console.error("Error guardando producto:", e);
    } finally {
      setSaving(false);
    }
  };

  // Eliminar
  const handleDelete = async (id: number) => {
    await fetch(`/api/admin/carta/${id}`, { method: "DELETE" });
    setProductos((prev) => prev.filter((p) => p.id !== id));
    setDeleteId(null);
  };

  // Toggle activo
  const toggleActivo = async (p: Producto) => {
    const next = !p.activo;
    setProductos((prev) => prev.map((x) => (x.id === p.id ? { ...x, activo: next } : x)));
    await fetch(`/api/admin/carta/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: next }),
    });
  };

  // Toggle destacado
  const toggleDestacado = async (p: Producto) => {
    const next = !p.destacado;
    setProductos((prev) => prev.map((x) => (x.id === p.id ? { ...x, destacado: next } : x)));
    await fetch(`/api/admin/carta/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destacado: next }),
    });
  };

  // Subir imagen
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        setForm((prev) => ({ ...prev, imagen: url }));
      }
    } catch (err) {
      console.error("Error al subir archivo:", err);
    } finally {
      setUploading(false);
    }
  };

  const f = (k: keyof typeof form, v: any) => setForm((prev) => ({ ...prev, [k]: v }));

  // Opciones de dropdowns
  const catOptions = [
    { value: "entrantes", label: "Entrantes" },
    { value: "sushi", label: "Sushi" },
    { value: "calientes", label: "Calientes" },
    { value: "postres", label: "Postres" },
    { value: "bebidas", label: "Bebidas" },
  ];

  const sushiSubOptions = [
    { value: "", label: "Ninguna (General)" },
    { value: "nigiri", label: "Nigiri" },
    { value: "uramaki", label: "Uramaki" },
    { value: "futomaki", label: "Futomaki" },
    { value: "maki", label: "Maki" },
  ];

  // Helper alérgenos seleccionados
  const currentAllergens = (form.alergenos || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const toggleAllergen = (slug: string) => {
    let next: string[];
    if (currentAllergens.includes(slug)) {
      next = currentAllergens.filter((a) => a !== slug);
    } else {
      next = [...currentAllergens, slug];
    }
    f("alergenos", next.join(","));
  };

  // Métricas
  const totalActivos = productos.filter((p) => p.activo).length;
  const totalOcultos = productos.filter((p) => !p.activo).length;
  const totalDestacados = productos.filter((p) => p.destacado).length;

  return (
    <div style={{ paddingBottom: "3rem" }}>
      {/* ─── HEADER ─── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "#c81e22",
                fontWeight: 700,
              }}
            >
              OBENTO JAPANESE FOOD
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>·</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Catálogo de Carta</span>
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              fontFamily: "var(--font-playfair, serif)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              margin: 0,
            }}
          >
            <UtensilsCrossed size={24} style={{ color: "#c81e22" }} /> Carta Oficial
          </h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
            Sincronizada con Takeaway KDS y la web pública (localhost:3000/pedidos)
          </p>
        </div>

        {/* Acciones de cabecera */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleSyncWeb}
            disabled={syncing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.6rem 1.1rem",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6,
              color: "#f3ede0",
              fontSize: 13,
              fontWeight: 600,
              cursor: syncing ? "not-allowed" : "pointer",
              transition: "all 0.15s",
              opacity: syncing ? 0.6 : 1,
            }}
          >
            <RefreshCw size={14} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
            {syncing ? "Sincronizando..." : "Sincronizar con Web"}
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={openAdd}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.6rem 1.25rem",
                background: "#c81e22",
                border: "none",
                borderRadius: 6,
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(200,30,34,0.35)",
              }}
            >
              <Plus size={15} /> Añadir Plato
            </button>
          )}
        </div>
      </div>

      {/* Notificación de sincronización */}
      {syncMsg && (
        <div
          style={{
            background: "rgba(74,222,128,0.12)",
            border: "1px solid rgba(74,222,128,0.3)",
            borderRadius: 8,
            padding: "0.75rem 1rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#4ade80",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <Sparkles size={16} />
          <span>{syncMsg}</span>
        </div>
      )}

      {/* ─── RESUMEN KPIS ─── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ background: "#0e0d0b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "0.85rem 1rem" }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Total Platos</span>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: "4px 0 0" }}>{productos.length}</p>
        </div>
        <div style={{ background: "#0e0d0b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "0.85rem 1rem" }}>
          <span style={{ fontSize: 11, color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.08em" }}>Activos en Web</span>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#4ade80", margin: "4px 0 0" }}>{totalActivos}</p>
        </div>
        <div style={{ background: "#0e0d0b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "0.85rem 1rem" }}>
          <span style={{ fontSize: 11, color: "#fca5a5", textTransform: "uppercase", letterSpacing: "0.08em" }}>Ocultos</span>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#fca5a5", margin: "4px 0 0" }}>{totalOcultos}</p>
        </div>
        <div style={{ background: "#0e0d0b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "0.85rem 1rem" }}>
          <span style={{ fontSize: 11, color: "#c9a84c", textTransform: "uppercase", letterSpacing: "0.08em" }}>Destacados</span>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#c9a84c", margin: "4px 0 0" }}>{totalDestacados}</p>
        </div>
        <div style={{ background: "#0e0d0b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "0.85rem 1rem" }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Categorías</span>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: "4px 0 0" }}>5</p>
        </div>
      </div>

      {/* ─── BUSCADOR Y FILTROS DE CATEGORÍA ─── */}
      <div style={{ marginBottom: "1.25rem" }}>
        {/* Input de búsqueda */}
        <div style={{ position: "relative", marginBottom: "1rem" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar plato por nombre, ingrediente o alérgeno..."
            style={{
              ...INPUT_STYLE,
              paddingLeft: 36,
              background: "rgba(255,255,255,0.03)",
              borderColor: "rgba(255,255,255,0.08)",
            }}
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                padding: 4,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Pestañas de categorías principales */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", alignItems: "center" }}>
          {CATEGORIAS_CONFIG.map(({ slug, label, labelEn }) => {
            const count = countCat(slug);
            const isActive = catFiltro === slug;
            const isDrop = dropTarget === slug;
            const displayName = lang === "en" ? labelEn : label;

            return (
              <button
                key={slug}
                type="button"
                onClick={() => {
                  setCatFiltro(slug);
                  if (slug !== "sushi") setSushiSubFiltro("todos");
                }}
                onDragOver={(e) => {
                  if (slug !== "all") {
                    e.preventDefault();
                    setDropTarget(slug);
                  }
                }}
                onDragLeave={() => setDropTarget(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(slug);
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: isDrop
                    ? "1.5px solid #c81e22"
                    : isActive
                    ? "1px solid #c81e22"
                    : "1px solid rgba(255,255,255,0.1)",
                  background: isDrop
                    ? "rgba(200,30,34,0.25)"
                    : isActive
                    ? "#c81e22"
                    : "rgba(255,255,255,0.02)",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  transition: "all 0.15s",
                  transform: isDrop ? "scale(1.05)" : "none",
                }}
              >
                <span>{displayName}</span>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 999,
                    background: isActive ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.08)",
                    color: isActive ? "#fff" : "rgba(255,255,255,0.45)",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Subcategorías de Sushi si aplica */}
        {catFiltro === "sushi" && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.3rem",
              marginTop: "0.75rem",
              paddingLeft: "0.5rem",
              borderLeft: "2px solid #c81e22",
            }}
          >
            {SUSHI_SUBCATS.map(({ slug, label, labelEn }) => {
              const count = countSushiSub(slug);
              const isActive = sushiSubFiltro === slug;
              const displayName = lang === "en" ? labelEn : label;

              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => setSushiSubFiltro(slug)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: "1px solid",
                    borderColor: isActive ? "rgba(200,30,34,0.4)" : "rgba(255,255,255,0.06)",
                    background: isActive ? "rgba(200,30,34,0.15)" : "transparent",
                    color: isActive ? "#ff7c80" : "rgba(255,255,255,0.4)",
                    fontSize: 11,
                    fontWeight: isActive ? 600 : 400,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {displayName} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Contador de resultados */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>
          Mostrando {platosFiltrados.length} {platosFiltrados.length === 1 ? "plato" : "platos"}
          {catFiltro !== "all" && ` en ${catFiltro}`}
          {catFiltro === "sushi" && sushiSubFiltro !== "todos" && ` · ${sushiSubFiltro}`}
          {busqueda && ` · filtro: "${busqueda}"`}
        </p>
      </div>

      {/* ─── GRID DE PLATOS ─── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "rgba(255,255,255,0.3)" }}>
          <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
          <p>Cargando carta de Obento...</p>
        </div>
      ) : platosFiltrados.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 2rem",
            background: "#0e0d0b",
            border: "1px dashed rgba(255,255,255,0.1)",
            borderRadius: 12,
            color: "rgba(255,255,255,0.4)",
          }}
        >
          <PackageOpen size={40} style={{ color: "rgba(255,255,255,0.15)", marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 4 }}>No se encontraron platos</p>
          <p style={{ fontSize: 13, marginBottom: 16 }}>Prueba a cambiar el filtro de categoría o limpiar la búsqueda.</p>
          <button
            type="button"
            onClick={() => {
              setCatFiltro("all");
              setSushiSubFiltro("todos");
              setBusqueda("");
            }}
            style={{
              padding: "6px 14px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6,
              color: "#fff",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Ver todos los platos
          </button>
        </div>
      ) : (
        <div style={CARD_GRID}>
          {platosFiltrados.map((p) => {
            const isDragging = dragId === p.id;
            const alist = (p.alergenos || "").split(",").map((s) => s.trim()).filter(Boolean);

            return (
              <div
                key={p.id}
                draggable={canEdit}
                onDragStart={() => setDragId(p.id)}
                onDragEnd={() => {
                  setDragId(null);
                  setDropTarget(null);
                }}
                style={{
                  background: "#0e0d0b",
                  border: `1px solid ${
                    isDragging
                      ? "rgba(200,30,34,0.6)"
                      : p.destacado
                      ? "rgba(201,168,76,0.25)"
                      : "rgba(255,255,255,0.07)"
                  }`,
                  borderRadius: 10,
                  overflow: "hidden",
                  opacity: isDragging ? 0.4 : p.activo ? 1 : 0.45,
                  transition: "transform 150ms, border-color 150ms",
                  cursor: canEdit ? "grab" : "default",
                  display: "flex",
                  flexDirection: "column",
                }}
                onMouseEnter={(e) => {
                  if (!isDragging) e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                }}
              >
                {/* Imagen y badges */}
                <div style={{ position: "relative", height: 150, background: "rgba(255,255,255,0.03)", overflow: "hidden" }}>
                  {p.imagen ? (
                    <img
                      src={p.imagen}
                      alt={p.nombre}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <PackageOpen size={32} style={{ color: "rgba(255,255,255,0.12)" }} />
                    </div>
                  )}

                  {/* Drag handle */}
                  {canEdit && (
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        background: "rgba(0,0,0,0.6)",
                        borderRadius: 4,
                        padding: "3px 4px",
                        display: "flex",
                        alignItems: "center",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      <GripVertical size={13} />
                    </div>
                  )}

                  {/* Categoría / Subcategoría pill */}
                  <span
                    style={{
                      position: "absolute",
                      bottom: 8,
                      left: 8,
                      fontSize: 10,
                      padding: "3px 8px",
                      borderRadius: 999,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      background: "rgba(0,0,0,0.75)",
                      color: "#f3ede0",
                      border: "1px solid rgba(255,255,255,0.15)",
                    }}
                  >
                    {p.categoria}
                    {p.sub ? ` · ${p.sub}` : ""}
                  </span>

                  {/* Estado Activo / Oculto */}
                  <span
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      fontSize: 10,
                      padding: "3px 8px",
                      borderRadius: 999,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      background: p.activo ? "rgba(74,222,128,0.18)" : "rgba(252,165,165,0.18)",
                      color: p.activo ? "#4ade80" : "#fca5a5",
                      border: `1px solid ${p.activo ? "rgba(74,222,128,0.35)" : "rgba(252,165,165,0.35)"}`,
                    }}
                  >
                    {p.activo ? "Activo" : "Oculto"}
                  </span>

                  {/* Botones de acción rápida sobre la imagen */}
                  {canEdit && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {/* Destacado */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDestacado(p);
                        }}
                        title={p.destacado ? "Quitar de destacados" : "Destacar plato"}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 6,
                          background: p.destacado ? "rgba(201,168,76,0.3)" : "rgba(0,0,0,0.6)",
                          border: `1px solid ${p.destacado ? "#c9a84c" : "rgba(255,255,255,0.15)"}`,
                          color: p.destacado ? "#c9a84c" : "rgba(255,255,255,0.5)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <Star size={12} fill={p.destacado ? "#c9a84c" : "none"} />
                      </button>

                      {/* Visibilidad */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleActivo(p);
                        }}
                        title={p.activo ? "Ocultar plato de la web" : "Mostrar plato en la web"}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 6,
                          background: p.activo ? "rgba(0,0,0,0.6)" : "rgba(252,165,165,0.25)",
                          border: `1px solid ${p.activo ? "rgba(255,255,255,0.15)" : "#fca5a5"}`,
                          color: p.activo ? "rgba(255,255,255,0.8)" : "#fca5a5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        {p.activo ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Contenido de la tarjeta */}
                <div style={{ padding: "1rem", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                  <div>
                    <h3
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#fff",
                        margin: "0 0 4px",
                        lineHeight: 1.3,
                      }}
                    >
                      {p.nombre}
                    </h3>

                    {p.descripcion && (
                      <p
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.45)",
                          margin: "0 0 0.5rem",
                          lineHeight: 1.45,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {p.descripcion}
                      </p>
                    )}

                    {/* Alérgenos */}
                    {alist.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: "0.75rem" }}>
                        {alist.map((alg) => (
                          <span
                            key={alg}
                            style={{
                              fontSize: 9,
                              padding: "1px 5px",
                              borderRadius: 3,
                              background: "rgba(255,255,255,0.05)",
                              color: "rgba(255,255,255,0.4)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              textTransform: "capitalize",
                            }}
                          >
                            {alg}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pie de tarjeta: Precio y Acciones */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "0.5rem",
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-dm-sans, system-ui, sans-serif)",
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#c9a84c",
                      }}
                    >
                      {Number(p.precio).toFixed(2).replace(".", ",")} €
                    </span>

                    {canEdit && (
                      <div style={{ display: "flex", gap: "0.35rem" }}>
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          title="Editar plato"
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 6,
                            padding: "6px 8px",
                            cursor: "pointer",
                            color: "rgba(255,255,255,0.7)",
                          }}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(p.id)}
                          title="Eliminar plato"
                          style={{
                            background: "rgba(252,165,165,0.06)",
                            border: "1px solid rgba(252,165,165,0.15)",
                            borderRadius: 6,
                            padding: "6px 8px",
                            cursor: "pointer",
                            color: "rgba(252,165,165,0.6)",
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL CREAR / EDITAR ─── */}
      {modal && (
        <Modal
          title={modal === "add" ? "Añadir Nuevo Plato" : "Editar Plato"}
          onClose={() => setModal(null)}
        >
          <Field label="Nombre del plato *">
            <input
              value={form.nombre}
              onChange={(e) => f("nombre", e.target.value)}
              style={INPUT_STYLE}
              placeholder="Ej: Nigiri de atún con foie"
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field label="Categoría *">
              <Dropdown
                value={form.categoria}
                onChange={(v) => f("categoria", v)}
                options={catOptions}
              />
            </Field>

            <Field label="Subcategoría (Sushi)">
              <Dropdown
                value={form.sub ?? ""}
                onChange={(v) => f("sub", v)}
                options={sushiSubOptions}
              />
            </Field>
          </div>

          <Field label="Precio (€) *">
            <input
              type="number"
              step="0.10"
              value={form.precio}
              onChange={(e) => f("precio", Number(e.target.value))}
              style={INPUT_STYLE}
              placeholder="0.00"
            />
          </Field>

          <Field label="Descripción">
            <textarea
              value={form.descripcion ?? ""}
              onChange={(e) => f("descripcion", e.target.value)}
              style={{ ...INPUT_STYLE, minHeight: 70, resize: "vertical" }}
              placeholder="Ingredientes, técnica de preparación, etc."
            />
          </Field>

          {/* Alérgenos */}
          <Field label="Alérgenos">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
              {LISTA_ALERGENOS.map((alg) => {
                const isSelected = currentAllergens.includes(alg.slug);
                return (
                  <button
                    key={alg.slug}
                    type="button"
                    onClick={() => toggleAllergen(alg.slug)}
                    style={{
                      padding: "4px 9px",
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: "pointer",
                      border: "1px solid",
                      borderColor: isSelected ? "rgba(200,30,34,0.5)" : "rgba(255,255,255,0.08)",
                      background: isSelected ? "rgba(200,30,34,0.2)" : "rgba(255,255,255,0.02)",
                      color: isSelected ? "#ff6b6e" : "rgba(255,255,255,0.5)",
                    }}
                  >
                    {alg.label} ({alg.short})
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Imagen */}
          <Field label="Imagen">
            {form.imagen && (
              <div style={{ marginBottom: 10, borderRadius: 8, overflow: "hidden", height: 130 }}>
                <img
                  src={form.imagen}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            )}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: 6 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: "rgba(200,30,34,0.12)",
                  border: "1px dashed rgba(200,30,34,0.35)",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  color: "#ff6b6e",
                }}
              >
                <span>{uploading ? "Subiendo..." : "Subir archivo"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                  disabled={uploading}
                />
              </label>
              <input
                value={form.imagen ?? ""}
                onChange={(e) => f("imagen", e.target.value)}
                style={{ ...INPUT_STYLE, flex: 1 }}
                placeholder="/images/plato.jpg"
              />
            </div>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field label="Visibilidad en Web">
              <Dropdown
                value={form.activo ? "activo" : "oculto"}
                onChange={(v) => f("activo", v === "activo")}
                options={[
                  { value: "activo", label: "Activo (Visible en pedidos)" },
                  { value: "oculto", label: "Oculto (No visible)" },
                ]}
              />
            </Field>

            <Field label="Destacado">
              <Dropdown
                value={form.destacado ? "si" : "no"}
                onChange={(v) => f("destacado", v === "si")}
                options={[
                  { value: "si", label: "Sí (Destacado en Home)" },
                  { value: "no", label: "No" },
                ]}
              />
            </Field>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !form.nombre}
              style={{
                flex: 2,
                padding: "10px",
                border: "none",
                borderRadius: 6,
                background: "#c81e22",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                opacity: saving ? 0.6 : 1,
              }}
            >
              <Check size={14} />
              {saving ? "Guardando..." : "Guardar Plato"}
            </button>
            <button
              type="button"
              onClick={() => setModal(null)}
              style={{
                flex: 1,
                padding: "10px",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6,
                background: "transparent",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {/* ─── MODAL CONFIRMAR BORRADO ─── */}
      {deleteId && (
        <Modal title="Eliminar Plato" onClose={() => setDeleteId(null)}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <AlertCircle size={24} style={{ color: "#fca5a5" }} />
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, margin: 0 }}>
              ¿Estás seguro de que deseas eliminar este plato de la carta? Esta acción no se puede deshacer.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button
              type="button"
              onClick={() => handleDelete(deleteId)}
              style={{
                flex: 1,
                padding: "10px",
                border: "none",
                borderRadius: 6,
                background: "rgba(252,165,165,0.15)",
                color: "#fca5a5",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Eliminar Definitivamente
            </button>
            <button
              type="button"
              onClick={() => setDeleteId(null)}
              style={{
                flex: 1,
                padding: "10px",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6,
                background: "transparent",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

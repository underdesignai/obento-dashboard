"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Plus, Trash2, ToggleLeft, ToggleRight, Tag, Copy, Check,
  Sparkles, Ticket, Percent, Calendar, Flame, AlertCircle,
  HelpCircle, ChevronRight, Mail, Send, Users, Search,
  CheckSquare, Square, X, ExternalLink, RefreshCw, Eye, Gift, CheckCircle2,
  Utensils
} from "lucide-react";
import { useSession } from "@/lib/session";
import { useAdminLanguage } from "@/lib/LanguageContext";

// ─── TIPOS ───────────────────────────────────────────────────────────────────

export type LeadClient = {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  totalPedidos: number;
  totalGasto: number;
  ultimaActividad?: string;
  origen: string;
};

type Cupon = {
  id: number;
  codigo: string;
  descripcion?: string | null;
  descuento: number;
  tipo: string;
  minimo?: number | null;
  activo: boolean;
  usos: number;
  maxUsos: number | null;
  platosIds?: string | null;
  createdAt: string;
};

type PlatoItem = {
  id: number;
  nombre: string;
  categoria: string;
  sub?: string | null;
  precio: number;
  imagen?: string | null;
  activo?: boolean;
};

type Oferta = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  descuento?: number | null;
  tipo: string;
  badge?: string | null;
  validoHasta?: string | null;
  activo: boolean;
  createdAt: string;
};

// ─── ESTILOS BASE (PALETA OBENTO: ROJO #c81e22 & BURDEOS #851316) ─────────────

const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.04)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: 6,
  padding: "0.625rem 0.85rem",
  color: "#f3ede0",
  fontSize: 13,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  color: "rgba(255, 255, 255, 0.45)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  display: "block",
  marginBottom: "0.35rem",
  fontWeight: 600,
};

// ─── PÁGINA CUPONES Y OFERTAS ────────────────────────────────────────────────

export default function CuponesPage() {
  useSession();
  const { tr } = useAdminLanguage();
  const a = tr.admin;

  // Estados de datos
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  // Formulario Cupón
  const [codigo, setCodigo] = useState("");
  const [descuentoCupon, setDescuentoCupon] = useState("");
  const [tipoCupon, setTipoCupon] = useState<"porcentaje" | "fijo">("porcentaje");
  const [minimoCupon, setMinimoCupon] = useState("");
  const [maxUsosCupon, setMaxUsosCupon] = useState("");
  const [descCupon, setDescCupon] = useState("");
  const [savingCupon, setSavingCupon] = useState(false);
  const [errorCupon, setErrorCupon] = useState("");

  // Platos seleccionados para descuento en el cupón (Bebidas excluidas)
  const [platosCarta, setPlatosCarta] = useState<PlatoItem[]>([]);
  const [selectedPlatosIds, setSelectedPlatosIds] = useState<number[]>([]);
  const [modalPlatosOpen, setModalPlatosOpen] = useState(false);
  const [searchPlato, setSearchPlato] = useState("");
  const [categoriaPlatoFiltro, setCategoriaPlatoFiltro] = useState("todas");
  const [viewingCuponPlatos, setViewingCuponPlatos] = useState<Cupon | null>(null);

  // Formulario Oferta
  const [tituloOferta, setTituloOferta] = useState("");
  const [badgeOferta, setBadgeOferta] = useState("PROMO");
  const [tipoOferta, setTipoOferta] = useState<"porcentaje" | "fijo" | "especial">("porcentaje");
  const [descuentoOferta, setDescuentoOferta] = useState("");
  const [validoHasta, setValidoHasta] = useState("");
  const [descOferta, setDescOferta] = useState("");
  const [savingOferta, setSavingOferta] = useState(false);
  const [errorOferta, setErrorOferta] = useState("");

  // ─── ESTADOS MODAL "ENVIAR OFERTA" POR CORREO ─────────────────────────────
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedOfertaToSend, setSelectedOfertaToSend] = useState<Oferta | null>(null);
  const [modalAsunto, setModalAsunto] = useState("");
  const [modalMensaje, setModalMensaje] = useState("");
  const [leads, setLeads] = useState<LeadClient[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [searchLead, setSearchLead] = useState("");
  const [filterLeadSegment, setFilterLeadSegment] = useState<"todos" | "pedidos" | "frecuentes">("todos");
  const [previewLeadEmail, setPreviewLeadEmail] = useState<string>("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Abrir modal de envío con configuración inicial
  const handleOpenSendModal = async (o: Oferta) => {
    setSelectedOfertaToSend(o);
    setModalAsunto(`🎁 ¡Regalo exclusivo para ti! ${o.titulo} en Obento`);

    // Plantilla de gancho inicial adaptada al tipo de oferta
    let initialHook = `Has sido seleccionado para el regalo de un maki por tu compra superior a 20 euros en nuestro takeaway online.`;
    const tit = o.titulo.toLowerCase();
    if (tit.includes("2x1")) {
      initialHook = `¡Aprovecha hoy nuestra oferta especial 2x1! Pide cualquier rollo Uramaki y llévate el segundo gratis para recoger en tienda.`;
    } else if (tit.includes("gyoza") || (o.descuento && o.descuento >= 20)) {
      initialHook = `Por compras superiores a 50 euros en nuestro takeaway, ¡te regalamos una ración de crujientes Gyozas artesanas para acompañar tu cena!`;
    } else if (o.descuento) {
      initialHook = `Queremos premiar tu fidelidad con una oferta exclusiva de ${o.tipo === "porcentaje" ? `${o.descuento}% de descuento` : `${o.descuento}€ de regalo`} en tu próximo pedido online.`;
    }

    setModalMensaje(initialHook);
    setSendResult(null);
    setSearchLead("");
    setSendModalOpen(true);

    // Cargar leads desde la base de datos
    setLoadingLeads(true);
    try {
      const res = await fetch("/api/admin/ofertas/leads");
      if (res.ok) {
        const data: LeadClient[] = await res.json();
        setLeads(data);
        // Pre-seleccionar todos los clientes registrados
        setSelectedEmails(new Set(data.map((l) => l.email)));
        if (data.length > 0) {
          setPreviewLeadEmail(data[0].email);
        }
      }
    } catch (e) {
      console.error("Error al cargar leads:", e);
    } finally {
      setLoadingLeads(false);
    }
  };

  // Filtrado de leads para el selector
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchSearch =
        l.nombre.toLowerCase().includes(searchLead.toLowerCase()) ||
        l.email.toLowerCase().includes(searchLead.toLowerCase()) ||
        (l.telefono && l.telefono.includes(searchLead));
      if (!matchSearch) return false;
      if (filterLeadSegment === "pedidos") return l.totalPedidos > 0;
      if (filterLeadSegment === "frecuentes") return l.totalPedidos >= 2;
      return true;
    });
  }, [leads, searchLead, filterLeadSegment]);

  // Cliente actual para el preview del email
  const currentPreviewLead = useMemo(() => {
    if (previewLeadEmail) {
      const found = leads.find((l) => l.email === previewLeadEmail);
      if (found) return found;
    }
    if (leads.length > 0) return leads[0];
    return {
      id: "preview_default",
      nombre: "Carlos Gómez Navarro",
      email: "carlos.gomez@gmail.com",
      telefono: "+34 622 112 233",
      totalPedidos: 3,
      totalGasto: 68.5,
      origen: "Pedido Takeaway",
    };
  }, [leads, previewLeadEmail]);

  // Selección individual de lead
  const toggleSelectEmail = (email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
    setPreviewLeadEmail(email);
  };

  // Seleccionar / Deseleccionar todos
  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedEmails(new Set(filteredLeads.map((l) => l.email)));
    } else {
      setSelectedEmails(new Set());
    }
  };

  // Enviar campaña de email
  const handleSendOfferEmail = async () => {
    if (!selectedOfertaToSend) return;
    if (selectedEmails.size === 0) {
      setSendResult({ ok: false, msg: "Debes seleccionar al menos un cliente en la lista para enviar." });
      return;
    }
    if (!modalAsunto.trim()) {
      setSendResult({ ok: false, msg: "El asunto del correo no puede estar vacío." });
      return;
    }
    if (!modalMensaje.trim()) {
      setSendResult({ ok: false, msg: "El mensaje del correo no puede estar vacío." });
      return;
    }

    setSendingEmail(true);
    setSendResult(null);

    const destinatarios = leads
      .filter((l) => selectedEmails.has(l.email))
      .map((l) => ({ nombre: l.nombre, email: l.email }));

    try {
      const res = await fetch("/api/admin/ofertas/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ofertaId: selectedOfertaToSend.id,
          asunto: modalAsunto,
          mensaje: modalMensaje,
          destinatarios,
          ofertaTitulo: selectedOfertaToSend.titulo,
          ofertaDescripcion: selectedOfertaToSend.descripcion,
          ofertaBadge: selectedOfertaToSend.badge,
          ofertaValidoHasta: selectedOfertaToSend.validoHasta,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSendResult({
          ok: true,
          msg: data.message || `¡Oferta enviada exitosamente a ${destinatarios.length} cliente(s)!`,
        });
      } else {
        setSendResult({
          ok: false,
          msg: data.error || "Ocurrió un error al enviar los correos.",
        });
      }
    } catch (e: any) {
      setSendResult({
        ok: false,
        msg: e.message || "Error de red al conectar con el servidor de envíos.",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  // Cargar cupones, ofertas y carta de platos
  const loadData = async () => {
    setLoading(true);
    try {
      const [resC, resO, resCarta] = await Promise.all([
        fetch("/api/admin/cupones"),
        fetch("/api/admin/ofertas"),
        fetch("/api/admin/carta"),
      ]);
      if (resC.ok) setCupones(await resC.json());
      if (resO.ok) setOfertas(await resO.json());
      if (resCarta.ok) setPlatosCarta(await resCarta.json());
    } catch (e) {
      console.error("Error al cargar datos:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Excluir bebidas: Solo platos de comida (regla de negocio: las bebidas nunca tienen descuento)
  const platosSinBebidas = useMemo(() => {
    return platosCarta.filter((p) => (p.categoria || "").toLowerCase() !== "bebidas");
  }, [platosCarta]);

  const categoriasPlatos = useMemo(() => {
    const set = new Set<string>();
    platosSinBebidas.forEach((p) => {
      if (p.categoria) set.add(p.categoria.toLowerCase());
    });
    return Array.from(set);
  }, [platosSinBebidas]);

  const platosFiltradosModal = useMemo(() => {
    return platosSinBebidas.filter((p) => {
      const matchCat = categoriaPlatoFiltro === "todas" || (p.categoria || "").toLowerCase() === categoriaPlatoFiltro;
      const q = searchPlato.trim().toLowerCase();
      const matchSearch = !q || p.nombre.toLowerCase().includes(q) || (p.sub && p.sub.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [platosSinBebidas, categoriaPlatoFiltro, searchPlato]);

  const togglePlatoSelection = (id: number) => {
    setSelectedPlatosIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const selectAllPlatos = () => {
    setSelectedPlatosIds(platosSinBebidas.map((p) => p.id));
  };

  const deselectAllPlatos = () => {
    setSelectedPlatosIds([]);
  };

  // Crear Cupón
  const handleCreateCupon = async () => {
    if (!codigo.trim() || !descuentoCupon) {
      setErrorCupon("El código y el descuento son obligatorios.");
      return;
    }
    setSavingCupon(true);
    setErrorCupon("");
    try {
      const res = await fetch("/api/admin/cupones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: codigo.toUpperCase().trim(),
          descuento: Number(descuentoCupon),
          tipo: tipoCupon,
          minimo: minimoCupon ? Number(minimoCupon) : null,
          maxUsos: maxUsosCupon ? Number(maxUsosCupon) : null,
          descripcion: descCupon.trim() || null,
          platosIds: selectedPlatosIds.length > 0 ? selectedPlatosIds : null,
        }),
      });
      if (res.ok) {
        setCodigo("");
        setDescuentoCupon("");
        setMinimoCupon("");
        setMaxUsosCupon("");
        setDescCupon("");
        setTipoCupon("porcentaje");
        setSelectedPlatosIds([]);
        await loadData();
      } else {
        const d = await res.json();
        setErrorCupon(d.error ?? "Error al crear el cupón.");
      }
    } catch (err) {
      setErrorCupon("Error de conexión al crear cupón.");
    } finally {
      setSavingCupon(false);
    }
  };

  // Crear Oferta
  const handleCreateOferta = async () => {
    if (!tituloOferta.trim()) {
      setErrorOferta("El título de la oferta es obligatorio.");
      return;
    }
    setSavingOferta(true);
    setErrorOferta("");
    try {
      const res = await fetch("/api/admin/ofertas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: tituloOferta.trim(),
          badge: badgeOferta.trim() || "PROMO",
          tipo: tipoOferta,
          descuento: descuentoOferta ? Number(descuentoOferta) : null,
          validoHasta: validoHasta.trim() || null,
          descripcion: descOferta.trim() || null,
          activo: true,
        }),
      });
      if (res.ok) {
        setTituloOferta("");
        setBadgeOferta("PROMO");
        setDescuentoOferta("");
        setValidoHasta("");
        setDescOferta("");
        setTipoOferta("porcentaje");
        await loadData();
      } else {
        const d = await res.json();
        setErrorOferta(d.error ?? "Error al crear la oferta.");
      }
    } catch (err) {
      setErrorOferta("Error de conexión al crear oferta.");
    } finally {
      setSavingOferta(false);
    }
  };

  // Toggle Activo Cupón
  const toggleActivoCupon = async (c: Cupon) => {
    const next = !c.activo;
    setCupones((prev) => prev.map((x) => (x.id === c.id ? { ...x, activo: next } : x)));
    await fetch(`/api/admin/cupones/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: next }),
    });
  };

  // Toggle Activo Oferta
  const toggleActivoOferta = async (o: Oferta) => {
    const next = !o.activo;
    setOfertas((prev) => prev.map((x) => (x.id === o.id ? { ...x, activo: next } : x)));
    await fetch(`/api/admin/ofertas/${o.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: next }),
    });
  };

  // Eliminar Cupón
  const handleDeleteCupon = async (id: number) => {
    if (!confirm(a.cuponesEliminarConfirm || "¿Eliminar este cupón?")) return;
    await fetch(`/api/admin/cupones/${id}`, { method: "DELETE" });
    setCupones((prev) => prev.filter((x) => x.id !== id));
  };

  // Eliminar Oferta
  const handleDeleteOferta = async (id: number) => {
    if (!confirm(a.ofertasEliminarConfirm || "¿Eliminar esta oferta?")) return;
    await fetch(`/api/admin/ofertas/${id}`, { method: "DELETE" });
    setOfertas((prev) => prev.filter((x) => x.id !== id));
  };

  // Copiar código
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", paddingBottom: "4rem" }}>
      {/* ─── HEADER GENERAL ─── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "linear-gradient(135deg, rgba(200,30,34,0.2) 0%, rgba(133,19,22,0.3) 100%)",
              border: "1px solid rgba(200,30,34,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(200,30,34,0.25)",
            }}
          >
            <Tag size={20} style={{ color: "#c81e22" }} />
          </div>
          <div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#fff",
                margin: 0,
                fontFamily: "var(--font-playfair, serif)",
                letterSpacing: "0.02em",
              }}
            >
              {a.cupones || "Cupones y Ofertas"}
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "3px 0 0" }}>
              Panel de promociones y descuentos de Obento Japanese Food
            </p>
          </div>
        </div>

        {/* Resumen Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "5px 12px",
              borderRadius: 999,
              background: "rgba(200,30,34,0.12)",
              border: "1px solid rgba(200,30,34,0.3)",
              color: "#ff7c80",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Ticket size={13} />
            <span>{cupones.length} {cupones.length === 1 ? "Cupón" : "Cupones"}</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "5px 12px",
              borderRadius: 999,
              background: "rgba(133,19,22,0.25)",
              border: "1px solid rgba(133,19,22,0.5)",
              color: "#f3ede0",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Sparkles size={13} style={{ color: "#c81e22" }} />
            <span>{ofertas.length} {ofertas.length === 1 ? "Oferta" : "Ofertas"}</span>
          </div>
        </div>
      </div>

      {/* ─── DOS COLUMNAS PRINCIPALES (GRID) ─── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "2rem",
          alignItems: "start",
        }}
      >
        {/* =========================================================
            COLUMNA 1: CUPONES DE DESCUENTO
           ========================================================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Cabecera Columna Cupones */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: "0.75rem",
              borderBottom: "2px solid rgba(200,30,34,0.4)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Ticket size={18} style={{ color: "#c81e22" }} />
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>
                  {a.cuponesColumna || "Cupones de Descuento"}
                </h2>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>
                  Códigos promocionales canjeables en pedidos
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                padding: "3px 8px",
                borderRadius: 999,
                background: "rgba(200,30,34,0.15)",
                color: "#ff7c80",
                fontWeight: 600,
              }}
            >
              {cupones.length}
            </span>
          </div>

          {/* Formulario Crear Cupón */}
          <div
            style={{
              background: "#100e0d",
              border: "1px solid rgba(200,30,34,0.25)",
              borderRadius: 12,
              padding: "1.35rem",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Acento rojo superior */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: "linear-gradient(90deg, #c81e22 0%, #851316 100%)",
              }}
            />

            <p
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "#ff7c80",
                marginBottom: "1rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <Plus size={12} /> {a.cuponesNuevo || "NUEVO CUPÓN DE DESCUENTO"}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
              {/* Código */}
              <div>
                <label style={LABEL_STYLE}>{a.cuponesCodigo || "CÓDIGO *"}</label>
                <input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  placeholder="OBENTO10"
                  style={{
                    ...INPUT_STYLE,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontFamily: "monospace",
                    fontWeight: 700,
                  }}
                />
              </div>

              {/* Descuento */}
              <div>
                <label style={LABEL_STYLE}>{a.cuponesDescuento || "DESCUENTO *"}</label>
                <input
                  type="number"
                  value={descuentoCupon}
                  onChange={(e) => setDescuentoCupon(e.target.value)}
                  placeholder={tipoCupon === "porcentaje" ? "10 (%)" : "5.00 (€)"}
                  min="0"
                  step="0.5"
                  style={INPUT_STYLE}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
              {/* Tipo */}
              <div>
                <label style={LABEL_STYLE}>{a.cuponesTipo || "TIPO"}</label>
                <select
                  value={tipoCupon}
                  onChange={(e) => setTipoCupon(e.target.value as "porcentaje" | "fijo")}
                  style={{ ...INPUT_STYLE, cursor: "pointer", appearance: "none" }}
                >
                  <option value="porcentaje" style={{ background: "#151312" }}>
                    {a.cuponesTipoPct || "Porcentaje (%)"}
                  </option>
                  <option value="fijo" style={{ background: "#151312" }}>
                    {a.cuponesTipoFijo || "Importe fijo (€)"}
                  </option>
                </select>
              </div>

              {/* Pedido Mínimo */}
              <div>
                <label style={LABEL_STYLE}>{a.cuponesMinimo || "PEDIDO MÍN. (€)"}</label>
                <input
                  type="number"
                  value={minimoCupon}
                  onChange={(e) => setMinimoCupon(e.target.value)}
                  placeholder="Sin mínimo"
                  min="0"
                  step="1"
                  style={INPUT_STYLE}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
              {/* Límite de Usos */}
              <div>
                <label style={LABEL_STYLE}>{a.cuponesMaxUsos || "USOS MÁXIMOS"}</label>
                <input
                  type="number"
                  value={maxUsosCupon}
                  onChange={(e) => setMaxUsosCupon(e.target.value)}
                  placeholder="Ilimitado"
                  min="1"
                  style={INPUT_STYLE}
                />
              </div>

              {/* Descripción breve */}
              <div>
                <label style={LABEL_STYLE}>{a.cuponesDescripcion || "DESCRIPCIÓN"}</label>
                <input
                  value={descCupon}
                  onChange={(e) => setDescCupon(e.target.value)}
                  placeholder="Ej: Promo bienvenida"
                  style={INPUT_STYLE}
                />
              </div>
            </div>

            {/* Botón Seleccionar Platos en el Descuento */}
            <div style={{ marginTop: "0.85rem", marginBottom: "1rem" }}>
              <button
                type="button"
                onClick={() => setModalPlatosOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "0.75rem 0.95rem",
                  borderRadius: 8,
                  background: selectedPlatosIds.length > 0
                    ? "linear-gradient(135deg, rgba(200,30,34,0.2) 0%, rgba(133,19,22,0.3) 100%)"
                    : "rgba(255, 255, 255, 0.04)",
                  border: selectedPlatosIds.length > 0
                    ? "1px solid rgba(200,30,34,0.5)"
                    : "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#f3ede0",
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: selectedPlatosIds.length > 0 ? "0 4px 12px rgba(200,30,34,0.25)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <Utensils size={16} style={{ color: selectedPlatosIds.length > 0 ? "#ff7c80" : "rgba(255,255,255,0.6)" }} />
                  <span style={{ fontWeight: 600 }}>Incluir estos platos en el descuento</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: 10,
                      background: selectedPlatosIds.length > 0 ? "rgba(200,30,34,0.4)" : "rgba(255,255,255,0.08)",
                      color: selectedPlatosIds.length > 0 ? "#ffc1c3" : "rgba(255,255,255,0.5)",
                    }}
                  >
                    {selectedPlatosIds.length > 0
                      ? `${selectedPlatosIds.length} plato${selectedPlatosIds.length > 1 ? "s" : ""}`
                      : "Todos los platos"}
                  </span>
                  <ChevronRight size={14} style={{ opacity: 0.5 }} />
                </div>
              </button>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.4rem", padding: "0 0.2rem" }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0 }}>
                  {selectedPlatosIds.length > 0 ? (
                    <span style={{ color: "#86efac" }}>
                      ✓ Descuento exclusivo para {selectedPlatosIds.length} plato(s) seleccionado(s). Bebidas excluidas.
                    </span>
                  ) : (
                    <span>
                      ℹ️ Aplica a toda la carta (las bebidas nunca tienen descuento).
                    </span>
                  )}
                </p>
                {selectedPlatosIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedPlatosIds([])}
                    style={{
                      background: "none",
                      border: "none",
                      color: "rgba(255,255,255,0.4)",
                      fontSize: 11,
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: 0,
                    }}
                  >
                    Restablecer a todos
                  </button>
                )}
              </div>
            </div>

            {errorCupon && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: 12,
                  color: "#fca5a5",
                  marginBottom: "0.75rem",
                  background: "rgba(239,68,68,0.1)",
                  padding: "0.4rem 0.6rem",
                  borderRadius: 6,
                }}
              >
                <AlertCircle size={14} />
                <span>{errorCupon}</span>
              </div>
            )}

            {/* Botón Crear Cupón (Color rojo Obento & burdeos) */}
            <button
              type="button"
              onClick={handleCreateCupon}
              disabled={savingCupon}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                width: "100%",
                padding: "0.7rem 1.25rem",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(135deg, #c81e22 0%, #851316 100%)",
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: savingCupon ? "not-allowed" : "pointer",
                opacity: savingCupon ? 0.7 : 1,
                boxShadow: "0 4px 14px rgba(200,30,34,0.35)",
                transition: "all 0.15s",
              }}
            >
              <Plus size={15} /> {savingCupon ? "Creando cupón..." : "Crear Cupón de Descuento"}
            </button>
          </div>

          {/* Lista de Cupones Creados (Abajo de la columna) */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                Cupones Creados ({cupones.length})
              </h3>
            </div>

            {loading ? (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Cargando cupones...</p>
            ) : cupones.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "2.5rem 1.5rem",
                  background: "#100e0d",
                  border: "1px dashed rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                <Ticket size={28} style={{ margin: "0 auto 0.5rem", display: "block", opacity: 0.3 }} />
                <p style={{ fontSize: 13, margin: 0 }}>No hay cupones creados aún. Crea el primero arriba.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {cupones.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      background: c.activo ? "#100e0d" : "#0d0b0a",
                      border: `1px solid ${c.activo ? "rgba(200,30,34,0.25)" : "rgba(255,255,255,0.05)"}`,
                      borderRadius: 10,
                      padding: "0.9rem 1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      opacity: c.activo ? 1 : 0.5,
                      transition: "border-color 0.15s, opacity 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#fff",
                            background: "rgba(200,30,34,0.15)",
                            border: "1px solid rgba(200,30,34,0.35)",
                            padding: "2px 8px",
                            borderRadius: 5,
                            letterSpacing: "0.08em",
                          }}
                        >
                          {c.codigo}
                        </span>

                        <button
                          type="button"
                          onClick={() => copyCode(c.codigo)}
                          title="Copiar código"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "rgba(255,255,255,0.4)",
                            padding: 2,
                            display: "flex",
                          }}
                        >
                          {copied === c.codigo ? (
                            <Check size={13} style={{ color: "#4ade80" }} />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>

                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 4,
                            background: "rgba(200,30,34,0.25)",
                            color: "#ff7c80",
                          }}
                        >
                          {c.tipo === "porcentaje" ? `-${c.descuento}%` : `-${Number(c.descuento).toFixed(2)} €`}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                        <span>Usos: {c.usos}{c.maxUsos !== null ? ` / ${c.maxUsos}` : " (sin límite)"}</span>
                        {c.minimo && <span>· Mín: {Number(c.minimo).toFixed(2)} €</span>}
                        {c.descripcion && <span>· {c.descripcion}</span>}

                        {/* Indicador de platos incluidos */}
                        {(() => {
                          let ids: number[] = [];
                          if (c.platosIds) {
                            try {
                              ids = typeof c.platosIds === "string" ? JSON.parse(c.platosIds) : c.platosIds;
                            } catch (_) {
                              ids = [];
                            }
                          }
                          if (Array.isArray(ids) && ids.length > 0) {
                            return (
                              <button
                                type="button"
                                onClick={() => setViewingCuponPlatos(c)}
                                style={{
                                  background: "rgba(200,30,34,0.15)",
                                  border: "1px solid rgba(200,30,34,0.35)",
                                  borderRadius: 4,
                                  color: "#ff9fa2",
                                  fontSize: 10.5,
                                  fontWeight: 600,
                                  padding: "1px 6px",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                              >
                                🎯 {ids.length} plato(s) exclusivo(s) (ver)
                              </button>
                            );
                          }
                          return (
                            <span
                              style={{
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: 4,
                                color: "rgba(255,255,255,0.5)",
                                fontSize: 10.5,
                                padding: "1px 6px",
                              }}
                            >
                              🥢 Toda la comida (sin bebidas)
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <button
                        type="button"
                        onClick={() => toggleActivoCupon(c)}
                        title={c.activo ? "Desactivar cupón" : "Activar cupón"}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          padding: 4,
                        }}
                      >
                        {c.activo ? (
                          <ToggleRight size={22} style={{ color: "#c81e22" }} />
                        ) : (
                          <ToggleLeft size={22} style={{ color: "rgba(255,255,255,0.2)" }} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCupon(c.id)}
                        title="Eliminar cupón"
                        style={{
                          background: "rgba(239,68,68,0.06)",
                          border: "1px solid rgba(239,68,68,0.2)",
                          borderRadius: 6,
                          cursor: "pointer",
                          color: "rgba(239,68,68,0.6)",
                          display: "flex",
                          padding: 6,
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* =========================================================
            COLUMNA 2: OFERTAS Y PROMOCIONES
           ========================================================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Cabecera Columna Ofertas */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: "0.75rem",
              borderBottom: "2px solid rgba(133,19,22,0.6)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Sparkles size={18} style={{ color: "#c81e22" }} />
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>
                  {a.ofertasColumna || "Ofertas y Promociones"}
                </h2>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>
                  Promociones destacadas en carta y take away
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                padding: "3px 8px",
                borderRadius: 999,
                background: "rgba(133,19,22,0.35)",
                color: "#f3ede0",
                fontWeight: 600,
              }}
            >
              {ofertas.length}
            </span>
          </div>

          {/* Formulario Crear Oferta */}
          <div
            style={{
              background: "#100e0d",
              border: "1px solid rgba(133,19,22,0.4)",
              borderRadius: 12,
              padding: "1.35rem",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Acento burdeos superior */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: "linear-gradient(90deg, #851316 0%, #c81e22 100%)",
              }}
            />

            <p
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "#ff7c80",
                marginBottom: "1rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <Sparkles size={12} /> {a.ofertasNueva || "NUEVA OFERTA O PROMOCIÓN"}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
              {/* Título */}
              <div>
                <label style={LABEL_STYLE}>{a.ofertasCampoTitulo || "TÍTULO DE LA OFERTA *"}</label>
                <input
                  value={tituloOferta}
                  onChange={(e) => setTituloOferta(e.target.value)}
                  placeholder="Ej: 2x1 en Uramakis los Jueves"
                  style={INPUT_STYLE}
                />
              </div>

              {/* Badge */}
              <div>
                <label style={LABEL_STYLE}>{a.ofertasCampoBadge || "BADGE / ETIQUETA"}</label>
                <input
                  value={badgeOferta}
                  onChange={(e) => setBadgeOferta(e.target.value.toUpperCase())}
                  placeholder="PROMO, 2X1..."
                  style={{ ...INPUT_STYLE, textTransform: "uppercase", fontWeight: 700 }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
              {/* Tipo */}
              <div>
                <label style={LABEL_STYLE}>{a.ofertasCampoTipo || "TIPO DE OFERTA"}</label>
                <select
                  value={tipoOferta}
                  onChange={(e) => setTipoOferta(e.target.value as any)}
                  style={{ ...INPUT_STYLE, cursor: "pointer", appearance: "none" }}
                >
                  <option value="porcentaje" style={{ background: "#151312" }}>
                    Descuento Porcentaje (%)
                  </option>
                  <option value="fijo" style={{ background: "#151312" }}>
                    Descuento Importe Fijo (€)
                  </option>
                  <option value="especial" style={{ background: "#151312" }}>
                    Promoción Especial / 2x1
                  </option>
                </select>
              </div>

              {/* Valor Descuento (opcional si especial) */}
              <div>
                <label style={LABEL_STYLE}>
                  {tipoOferta === "porcentaje" ? "DESCUENTO (%)" : tipoOferta === "fijo" ? "DESCUENTO (€)" : "BENEFICIO / VALOR"}
                </label>
                <input
                  type="number"
                  value={descuentoOferta}
                  onChange={(e) => setDescuentoOferta(e.target.value)}
                  placeholder={tipoOferta === "porcentaje" ? "15" : tipoOferta === "fijo" ? "3.50" : "Opcional"}
                  min="0"
                  step="0.5"
                  style={INPUT_STYLE}
                />
              </div>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              {/* Válido hasta */}
              <label style={LABEL_STYLE}>{a.ofertasCampoValido || "VÁLIDO HASTA / CONDICIONES DE TIEMPO"}</label>
              <input
                value={validoHasta}
                onChange={(e) => setValidoHasta(e.target.value)}
                placeholder="Ej: Jueves y Domingos noche / Hasta 30 Nov"
                style={INPUT_STYLE}
              />
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              {/* Descripción / Condiciones */}
              <label style={LABEL_STYLE}>{a.ofertasCampoDesc || "DESCRIPCIÓN / CONDICIONES"}</label>
              <textarea
                value={descOferta}
                onChange={(e) => setDescOferta(e.target.value)}
                placeholder="Describe la oferta: aplica en rollos seleccionados, bebidas gratis, etc."
                style={{ ...INPUT_STYLE, minHeight: 55, resize: "vertical" }}
              />
            </div>

            {errorOferta && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: 12,
                  color: "#fca5a5",
                  marginBottom: "0.75rem",
                  background: "rgba(239,68,68,0.1)",
                  padding: "0.4rem 0.6rem",
                  borderRadius: 6,
                }}
              >
                <AlertCircle size={14} />
                <span>{errorOferta}</span>
              </div>
            )}

            {/* Botón Crear Oferta (Burdeos & Rojo Obento) */}
            <button
              type="button"
              onClick={handleCreateOferta}
              disabled={savingOferta}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                width: "100%",
                padding: "0.7rem 1.25rem",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(135deg, #851316 0%, #c81e22 100%)",
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: savingOferta ? "not-allowed" : "pointer",
                opacity: savingOferta ? 0.7 : 1,
                boxShadow: "0 4px 14px rgba(133,19,22,0.4)",
                transition: "all 0.15s",
              }}
            >
              <Sparkles size={15} /> {savingOferta ? "Creando oferta..." : "Crear Oferta o Promoción"}
            </button>
          </div>

          {/* Lista de Ofertas Creadas (Abajo de la columna) */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                Ofertas Creadas ({ofertas.length})
              </h3>
            </div>

            {loading ? (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Cargando ofertas...</p>
            ) : ofertas.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "2.5rem 1.5rem",
                  background: "#100e0d",
                  border: "1px dashed rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                <Sparkles size={28} style={{ margin: "0 auto 0.5rem", display: "block", opacity: 0.3 }} />
                <p style={{ fontSize: 13, margin: 0 }}>No hay ofertas creadas aún. Crea la primera arriba.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {ofertas.map((o) => (
                  <div
                    key={o.id}
                    style={{
                      background: o.activo ? "#100e0d" : "#0d0b0a",
                      border: `1px solid ${o.activo ? "rgba(133,19,22,0.4)" : "rgba(255,255,255,0.05)"}`,
                      borderRadius: 10,
                      padding: "0.9rem 1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      opacity: o.activo ? 1 : 0.5,
                      transition: "border-color 0.15s, opacity 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        {o.badge && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: "2px 7px",
                              borderRadius: 4,
                              background: "rgba(200,30,34,0.2)",
                              border: "1px solid rgba(200,30,34,0.4)",
                              color: "#ff7c80",
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                            }}
                          >
                            {o.badge}
                          </span>
                        )}

                        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                          {o.titulo}
                        </span>

                        {o.descuento !== null && o.descuento !== undefined && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "1px 6px",
                              borderRadius: 4,
                              background: "rgba(133,19,22,0.3)",
                              color: "#f3ede0",
                            }}
                          >
                            {o.tipo === "porcentaje" ? `-${o.descuento}%` : `-${Number(o.descuento).toFixed(2)} €`}
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                        {o.descripcion && <span>{o.descripcion}</span>}
                        {o.validoHasta && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#ff999b" }}>
                            <Calendar size={11} /> {o.validoHasta}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {/* Botón Enviar oferta por Correo */}
                      <button
                        type="button"
                        onClick={() => handleOpenSendModal(o)}
                        title="Enviar esta oferta por correo a clientes y leads"
                        style={{
                          background: "linear-gradient(135deg, rgba(200,30,34,0.2) 0%, rgba(133,19,22,0.3) 100%)",
                          border: "1px solid rgba(200,30,34,0.5)",
                          borderRadius: 7,
                          padding: "0.38rem 0.75rem",
                          color: "#ff8e91",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "linear-gradient(135deg, #c81e22 0%, #851316 100%)";
                          e.currentTarget.style.color = "#ffffff";
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "linear-gradient(135deg, rgba(200,30,34,0.2) 0%, rgba(133,19,22,0.3) 100%)";
                          e.currentTarget.style.color = "#ff8e91";
                          e.currentTarget.style.borderColor = "rgba(200,30,34,0.5)";
                        }}
                      >
                        <Mail size={13} />
                        <span>Enviar oferta</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleActivoOferta(o)}
                        title={o.activo ? "Desactivar oferta" : "Activar oferta"}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          padding: 4,
                        }}
                      >
                        {o.activo ? (
                          <ToggleRight size={22} style={{ color: "#c81e22" }} />
                        ) : (
                          <ToggleLeft size={22} style={{ color: "rgba(255,255,255,0.2)" }} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteOferta(o.id)}
                        title="Eliminar oferta"
                        style={{
                          background: "rgba(239,68,68,0.06)",
                          border: "1px solid rgba(239,68,68,0.2)",
                          borderRadius: 6,
                          cursor: "pointer",
                          color: "rgba(239,68,68,0.6)",
                          display: "flex",
                          padding: 6,
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── MODAL "ENVIAR OFERTA POR CORREO ELECTRÓNICO" ──────────────────────── */}
      {sendModalOpen && selectedOfertaToSend && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSendModalOpen(false);
          }}
        >
          <div
            style={{
              background: "#120e0e",
              border: "1px solid rgba(200, 30, 34, 0.4)",
              borderRadius: 16,
              boxShadow: "0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(200,30,34,0.15)",
              width: "100%",
              maxWidth: 1100,
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              color: "#f3ede0",
            }}
          >
            {/* Cabecera del Modal */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1.1rem 1.5rem",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                background: "linear-gradient(90deg, rgba(31,16,17,0.9) 0%, rgba(18,14,14,0.9) 100%)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #c81e22 0%, #851316 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 14px rgba(200,30,34,0.4)",
                  }}
                >
                  <Mail size={18} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#fff" }}>
                    Enviar Oferta por Correo Electrónico
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                    Campaña promocional directa a clientes y leads guardados en el administrador
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSendModalOpen(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "none",
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(255, 255, 255, 0.6)",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Contenido dividido: Izquierda Preview, Derecha Configuración y Leads */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.05fr 1fr",
                gap: "1.5rem",
                padding: "1.25rem 1.5rem",
                overflowY: "auto",
                flex: 1,
              }}
            >
              {/* ── COLUMNA IZQUIERDA: PREVIEW DEL EMAIL EN TIEMPO REAL ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={LABEL_STYLE}>
                    Preview del Email (Vista Real del Cliente)
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#10b981",
                      background: "rgba(16,185,129,0.12)",
                      border: "1px solid rgba(16,185,129,0.3)",
                      padding: "2px 7px",
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                    En tiempo real
                  </span>
                </div>

                {/* Contenedor Mockup Cliente de Correo */}
                <div
                  style={{
                    background: "#181413",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 12,
                    overflow: "hidden",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Barra superior estilo cliente de correo */}
                  <div
                    style={{
                      background: "#0e0c0b",
                      padding: "8px 12px",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#ff5f56" }} />
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#ffbd2e" }} />
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#27c93f" }} />
                    </div>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                      Bandeja de Entrada · Promoción Obento
                    </span>
                    <div style={{ width: 30 }} />
                  </div>

                  {/* Metadatos del correo (De, Para, Asunto) */}
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "rgba(255, 255, 255, 0.02)",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                      fontSize: 11,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <div>
                      <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>De: </span>
                      <span style={{ color: "#fff", fontWeight: 600 }}>Obento Japanese Food</span>{" "}
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>&lt;pedidos@obentojapanesefood.es&gt;</span>
                    </div>
                    <div>
                      <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>Para: </span>
                      <span style={{ color: "#ff999b", fontWeight: 700 }}>{currentPreviewLead.nombre}</span>{" "}
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>&lt;{currentPreviewLead.email}&gt;</span>
                    </div>
                    <div>
                      <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>Asunto: </span>
                      <span style={{ color: "#f3ede0", fontWeight: 700 }}>{modalAsunto || "Oferta Especial"}</span>
                    </div>
                  </div>

                  {/* Cuerpo visual del Email (Estilo Newsletter Obento) */}
                  <div
                    style={{
                      padding: "18px 20px",
                      background: "#13100f",
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                      maxHeight: "52vh",
                      overflowY: "auto",
                    }}
                  >
                    {/* Header del Restaurante con Logotipo */}
                    <div
                      style={{
                        textAlign: "center",
                        padding: "16px 12px 14px",
                        background: "linear-gradient(180deg, rgba(200,30,34,0.15) 0%, rgba(20,16,16,0.6) 100%)",
                        borderRadius: 10,
                        border: "1px solid rgba(200,30,34,0.3)",
                      }}
                    >
                      <div
                        style={{
                          display: "inline-block",
                          background: "#c81e22",
                          color: "#fff",
                          fontWeight: 900,
                          fontSize: 9,
                          letterSpacing: "0.2em",
                          padding: "2px 8px",
                          borderRadius: 3,
                          textTransform: "uppercase",
                          marginBottom: 6,
                        }}
                      >
                        OBENTO JAPANESE FOOD
                      </div>
                      <h4
                        style={{
                          margin: "4px 0 0",
                          fontSize: 19,
                          fontWeight: 800,
                          color: "#fff",
                          letterSpacing: "0.03em",
                          fontFamily: "Georgia, serif",
                        }}
                      >
                        お弁当 · OBENTO
                      </h4>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: 10,
                          color: "#c9a84c",
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          fontWeight: 700,
                        }}
                      >
                        Auténtico Sushi Takeaway & Bar · Murcia
                      </p>
                    </div>

                    {/* Saludo personalizado */}
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
                      ¡Hola, {currentPreviewLead.nombre.split(" ")[0]}! 👋
                    </div>

                    {/* Gancho promocional interactivo */}
                    <div
                      style={{
                        background: "rgba(200, 30, 34, 0.08)",
                        borderLeft: "4px solid #c81e22",
                        borderRadius: "0 8px 8px 0",
                        padding: "12px 14px",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          lineHeight: 1.55,
                          color: "#f3ede0",
                          fontWeight: 500,
                          whiteSpace: "pre-line",
                        }}
                      >
                        {modalMensaje || "Disfruta de esta oferta exclusiva en nuestro takeaway."}
                      </p>
                    </div>

                    {/* Tarjeta de la Oferta */}
                    <div
                      style={{
                        background: "linear-gradient(135deg, rgba(38,18,19,0.95) 0%, rgba(20,15,15,0.98) 100%)",
                        border: "1px solid rgba(200, 30, 34, 0.4)",
                        borderRadius: 10,
                        padding: "14px",
                      }}
                    >
                      {selectedOfertaToSend.badge && (
                        <span
                          style={{
                            background: "#c81e22",
                            color: "#fff",
                            fontSize: 9,
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: 3,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            display: "inline-block",
                            marginBottom: 6,
                          }}
                        >
                          {selectedOfertaToSend.badge}
                        </span>
                      )}
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
                        {selectedOfertaToSend.titulo}
                      </div>
                      {selectedOfertaToSend.descripcion && (
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.4, marginBottom: 6 }}>
                          {selectedOfertaToSend.descripcion}
                        </div>
                      )}
                      {selectedOfertaToSend.validoHasta && (
                        <div style={{ fontSize: 11, color: "#ff999b", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                          <Calendar size={11} /> {selectedOfertaToSend.validoHasta}
                        </div>
                      )}
                    </div>

                    {/* Botón CTA del Correo */}
                    <div style={{ textAlign: "center", margin: "4px 0" }}>
                      <a
                        href="https://obentojapanesefood.es/carta"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-block",
                          background: "linear-gradient(135deg, #c81e22 0%, #851316 100%)",
                          color: "#ffffff",
                          textDecoration: "none",
                          padding: "10px 22px",
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 800,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          boxShadow: "0 4px 15px rgba(200, 30, 34, 0.4)",
                          border: "1px solid rgba(255,255,255,0.15)",
                        }}
                      >
                        🍣 PEDIR ONLINE Y RECLAMAR OFERTA
                      </a>
                    </div>

                    {/* Footer del Email */}
                    <div
                      style={{
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        paddingTop: 12,
                        textAlign: "center",
                        fontSize: 10,
                        color: "rgba(255,255,255,0.35)",
                        lineHeight: 1.45,
                      }}
                    >
                      <p style={{ margin: "0 0 2px", fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
                        Obento Japanese Food · Murcia
                      </p>
                      <p style={{ margin: 0 }}>
                        Recibes este correo porque realizaste pedidos o reservas en nuestra plataforma.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── COLUMNA DERECHA: CONFIGURACIÓN Y CLIENTES / LEADS ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* 1. Asunto del Correo */}
                <div>
                  <label style={LABEL_STYLE}>1. Asunto del Correo Electrónico</label>
                  <input
                    type="text"
                    value={modalAsunto}
                    onChange={(e) => setModalAsunto(e.target.value)}
                    placeholder="Ej: 🎁 ¡Regalo exclusivo para ti! 2x1 en Obento"
                    style={INPUT_STYLE}
                  />
                </div>

                {/* 2. Mensaje / Gancho Promocional */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                    <label style={{ ...LABEL_STYLE, marginBottom: 0 }}>
                      2. Mensaje / Gancho Promocional
                    </label>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                      Incita al cliente a realizar pedidos
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={modalMensaje}
                    onChange={(e) => setModalMensaje(e.target.value)}
                    placeholder="Escribe el gancho de la oferta..."
                    style={{ ...INPUT_STYLE, resize: "vertical" }}
                  />

                  {/* Plantillas Rápidas de Ganchos */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>
                      Plantillas:
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalMensaje("Has sido seleccionado para el regalo de un maki por tu compra superior a 20 euros en nuestro takeaway online.")}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 4,
                        padding: "2px 7px",
                        fontSize: 10,
                        color: "#f3ede0",
                        cursor: "pointer",
                      }}
                    >
                      🎁 Regalo Maki (+20€)
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalMensaje("Por compras superiores a 50 euros en nuestro takeaway, ¡te regalamos una ración de crujientes Gyozas artesanas para acompañar tu cena!")}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 4,
                        padding: "2px 7px",
                        fontSize: 10,
                        color: "#f3ede0",
                        cursor: "pointer",
                      }}
                    >
                      🥟 Regalo Gyozas (+50€)
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalMensaje("¡Hoy es noche de 2x1 en Uramakis! Pide tu rollo favorito y te llevas el segundo totalmente gratis para recoger en tienda.")}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 4,
                        padding: "2px 7px",
                        fontSize: 10,
                        color: "#f3ede0",
                        cursor: "pointer",
                      }}
                    >
                      🍣 2x1 Uramakis
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalMensaje("Queremos premiar tu fidelidad con esta oferta exclusiva por tiempo limitado en nuestra carta online.")}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 4,
                        padding: "2px 7px",
                        fontSize: 10,
                        color: "#f3ede0",
                        cursor: "pointer",
                      }}
                    >
                      🏷️ Fidelidad
                    </button>
                  </div>
                </div>

                {/* 3. Selección de Clientes y Leads de la Base de Datos */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <label style={{ ...LABEL_STYLE, marginBottom: 0 }}>
                      3. Seleccionar Clientes / Leads ({selectedEmails.size} de {leads.length})
                    </label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => handleSelectAll(true)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ff8e91",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Todos
                      </button>
                      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>|</span>
                      <button
                        type="button"
                        onClick={() => handleSelectAll(false)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "rgba(255,255,255,0.4)",
                          fontSize: 11,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Ninguno
                      </button>
                    </div>
                  </div>

                  {/* Filtro y Búsqueda */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    <div style={{ position: "relative", flex: 1 }}>
                      <Search
                        size={12}
                        style={{
                          position: "absolute",
                          left: 8,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "rgba(255,255,255,0.3)",
                        }}
                      />
                      <input
                        type="text"
                        value={searchLead}
                        onChange={(e) => setSearchLead(e.target.value)}
                        placeholder="Buscar por nombre, email o teléfono..."
                        style={{
                          ...INPUT_STYLE,
                          paddingLeft: 26,
                          paddingTop: "0.35rem",
                          paddingBottom: "0.35rem",
                          fontSize: 11,
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: 3 }}>
                      <button
                        type="button"
                        onClick={() => setFilterLeadSegment("todos")}
                        style={{
                          background: filterLeadSegment === "todos" ? "rgba(200,30,34,0.3)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${filterLeadSegment === "todos" ? "#c81e22" : "rgba(255,255,255,0.08)"}`,
                          borderRadius: 5,
                          padding: "0.3rem 0.6rem",
                          fontSize: 10,
                          fontWeight: 700,
                          color: filterLeadSegment === "todos" ? "#fff" : "rgba(255,255,255,0.5)",
                          cursor: "pointer",
                        }}
                      >
                        Todos
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterLeadSegment("pedidos")}
                        style={{
                          background: filterLeadSegment === "pedidos" ? "rgba(200,30,34,0.3)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${filterLeadSegment === "pedidos" ? "#c81e22" : "rgba(255,255,255,0.08)"}`,
                          borderRadius: 5,
                          padding: "0.3rem 0.6rem",
                          fontSize: 10,
                          fontWeight: 700,
                          color: filterLeadSegment === "pedidos" ? "#fff" : "rgba(255,255,255,0.5)",
                          cursor: "pointer",
                        }}
                      >
                        Con Pedidos
                      </button>
                    </div>
                  </div>

                  {/* Lista de Leads con Scroll */}
                  <div
                    style={{
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: 8,
                      background: "rgba(0, 0, 0, 0.3)",
                      maxHeight: 200,
                      overflowY: "auto",
                      padding: 4,
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                    }}
                  >
                    {loadingLeads ? (
                      <div style={{ textAlign: "center", padding: "1.5rem", color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                        Cargando clientes y leads desde la base de datos...
                      </div>
                    ) : filteredLeads.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "1.5rem", color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                        No se encontraron clientes con ese criterio.
                      </div>
                    ) : (
                      filteredLeads.map((l) => {
                        const isSelected = selectedEmails.has(l.email);
                        const isPreview = currentPreviewLead.email === l.email;
                        return (
                          <div
                            key={l.id || l.email}
                            onClick={() => toggleSelectEmail(l.email)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "6px 8px",
                              borderRadius: 6,
                              background: isPreview
                                ? "rgba(200,30,34,0.18)"
                                : isSelected
                                ? "rgba(255,255,255,0.04)"
                                : "transparent",
                              border: isPreview
                                ? "1px solid rgba(200,30,34,0.4)"
                                : "1px solid transparent",
                              cursor: "pointer",
                              transition: "background 0.1s",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                              <div style={{ color: isSelected ? "#c81e22" : "rgba(255,255,255,0.25)" }}>
                                {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {l.nombre}
                                </div>
                                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {l.email} {l.telefono ? `· ${l.telefono}` : ""}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                              {l.totalPedidos > 0 && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    background: "rgba(16,185,129,0.15)",
                                    border: "1px solid rgba(16,185,129,0.3)",
                                    color: "#6ee7b7",
                                    padding: "1px 5px",
                                    borderRadius: 4,
                                  }}
                                >
                                  {l.totalPedidos} {l.totalPedidos === 1 ? "pedido" : "pedidos"} ({l.totalGasto.toFixed(1)}€)
                                </span>
                              )}
                              <span
                                style={{
                                  fontSize: 9,
                                  color: "rgba(255,255,255,0.35)",
                                  background: "rgba(255,255,255,0.05)",
                                  padding: "1px 4px",
                                  borderRadius: 3,
                                }}
                              >
                                {l.origen}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 4. Feedback de Envío y Botón de Acción */}
                {sendResult && (
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: sendResult.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                      border: `1px solid ${sendResult.ok ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                      color: sendResult.ok ? "#6ee7b7" : "#fca5a5",
                    }}
                  >
                    {sendResult.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                    <span>{sendResult.msg}</span>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 8,
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSendModalOpen(false)}
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: 7,
                      padding: "0.5rem 1rem",
                      color: "rgba(255, 255, 255, 0.65)",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    disabled={sendingEmail || selectedEmails.size === 0}
                    onClick={handleSendOfferEmail}
                    style={{
                      background:
                        selectedEmails.size === 0
                          ? "rgba(255,255,255,0.1)"
                          : "linear-gradient(135deg, #c81e22 0%, #851316 100%)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: 7,
                      padding: "0.55rem 1.25rem",
                      color: "#ffffff",
                      fontSize: 13,
                      fontWeight: 800,
                      letterSpacing: "0.02em",
                      cursor: selectedEmails.size === 0 || sendingEmail ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      boxShadow: selectedEmails.size > 0 ? "0 4px 15px rgba(200, 30, 34, 0.4)" : "none",
                      opacity: sendingEmail ? 0.7 : 1,
                      transition: "all 0.15s",
                    }}
                  >
                    {sendingEmail ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Enviando campaña...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Enviar Oferta a {selectedEmails.size} Cliente(s)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL SELECCIONAR PLATOS PARA DESCUENTO ─────────────────────── */}
      {modalPlatosOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(6px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalPlatosOpen(false);
          }}
        >
          <div
            style={{
              background: "#120e0e",
              border: "1px solid rgba(200, 30, 34, 0.4)",
              borderRadius: 16,
              boxShadow: "0 25px 60px rgba(0,0,0,0.85), 0 0 40px rgba(200,30,34,0.18)",
              width: "920px",
              minWidth: "min(920px, 95vw)",
              maxWidth: "95vw",
              height: "85vh",
              minHeight: "85vh",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Cabecera del modal */}
            <div
              style={{
                flexShrink: 0,
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(180deg, rgba(200,30,34,0.1) 0%, transparent 100%)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "rgba(200, 30, 34, 0.2)",
                    border: "1px solid rgba(200, 30, 34, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ff7c80",
                  }}
                >
                  <Utensils size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: 0 }}>
                    Incluir estos platos en el descuento
                  </h2>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: "0.2rem 0 0 0" }}>
                    Selecciona los platos específicos que tendrán descuento. Las bebidas quedan excluidas por regla de negocio.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalPlatosOpen(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "none",
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(255, 255, 255, 0.6)",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Barra de herramientas / filtros */}
            <div
              style={{
                flexShrink: 0,
                padding: "1rem 1.5rem",
                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(0,0,0,0.2)",
              }}
            >
              {/* Buscador */}
              <div style={{ position: "relative", minWidth: 260, flex: "1 1 260px" }}>
                <Search
                  size={14}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "rgba(255,255,255,0.4)",
                  }}
                />
                <input
                  type="text"
                  placeholder="Buscar plato en la carta..."
                  value={searchPlato}
                  onChange={(e) => setSearchPlato(e.target.value)}
                  style={{
                    ...INPUT_STYLE,
                    paddingLeft: "2rem",
                    paddingTop: "0.5rem",
                    paddingBottom: "0.5rem",
                    fontSize: 12.5,
                  }}
                />
                {searchPlato && (
                  <button
                    type="button"
                    onClick={() => setSearchPlato("")}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "rgba(255,255,255,0.4)",
                      cursor: "pointer",
                      padding: 2,
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Botones de acción rápida: Todos / Ninguno */}
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={selectAllPlatos}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.45rem 0.8rem",
                    borderRadius: 6,
                    background: "rgba(200,30,34,0.18)",
                    border: "1px solid rgba(200,30,34,0.35)",
                    color: "#ff9fa2",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <CheckSquare size={13} /> Seleccionar todos ({platosSinBebidas.length})
                </button>

                <button
                  type="button"
                  onClick={deselectAllPlatos}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.45rem 0.8rem",
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Square size={13} /> Deseleccionar todos
                </button>
              </div>
            </div>

            {/* Selector de categorías */}
            <div
              style={{
                flexShrink: 0,
                padding: "0.6rem 1.5rem",
                borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                display: "flex",
                gap: "0.4rem",
                overflowX: "auto",
                whiteSpace: "nowrap",
                background: "rgba(0,0,0,0.15)",
              }}
            >
              <button
                type="button"
                onClick={() => setCategoriaPlatoFiltro("todas")}
                style={{
                  padding: "0.3rem 0.75rem",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background: categoriaPlatoFiltro === "todas" ? "#c81e22" : "rgba(255,255,255,0.06)",
                  color: categoriaPlatoFiltro === "todas" ? "#fff" : "rgba(255,255,255,0.55)",
                }}
              >
                Todas ({platosSinBebidas.length})
              </button>
              {categoriasPlatos.map((cat) => {
                const count = platosSinBebidas.filter((p) => (p.categoria || "").toLowerCase() === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoriaPlatoFiltro(cat)}
                    style={{
                      padding: "0.3rem 0.75rem",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      textTransform: "capitalize",
                      background: categoriaPlatoFiltro === cat ? "#c81e22" : "rgba(255,255,255,0.06)",
                      color: categoriaPlatoFiltro === cat ? "#fff" : "rgba(255,255,255,0.55)",
                    }}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            {/* Listado / Grid de platos */}
            <div
              style={{
                flex: "1 1 0px",
                minHeight: 0,
                overflowY: "auto",
                padding: "1.25rem 1.5rem",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "0.75rem",
                alignContent: "start",
              }}
            >
              {platosFiltradosModal.length === 0 ? (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem 1rem", color: "rgba(255,255,255,0.4)" }}>
                  <p style={{ margin: 0, fontSize: 13 }}>No se encontraron platos que coincidan con la búsqueda.</p>
                </div>
              ) : (
                platosFiltradosModal.map((plato) => {
                  const isSelected = selectedPlatosIds.includes(plato.id);
                  return (
                    <div
                      key={plato.id}
                      onClick={() => togglePlatoSelection(plato.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.65rem 0.85rem",
                        borderRadius: 10,
                        background: isSelected ? "rgba(200,30,34,0.15)" : "#161211",
                        border: `1px solid ${isSelected ? "rgba(200,30,34,0.55)" : "rgba(255,255,255,0.06)"}`,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        position: "relative",
                        userSelect: "none",
                      }}
                    >
                      {/* Checkbox */}
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 5,
                          background: isSelected ? "#c81e22" : "rgba(255,255,255,0.08)",
                          border: `1px solid ${isSelected ? "#c81e22" : "rgba(255,255,255,0.2)"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          flexShrink: 0,
                        }}
                      >
                        {isSelected && <Check size={13} strokeWidth={3} />}
                      </div>

                      {/* Imagen miniatura */}
                      {plato.imagen ? (
                        <img
                          src={plato.imagen}
                          alt={plato.nombre}
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 6,
                            objectFit: "cover",
                            border: "1px solid rgba(255,255,255,0.1)",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 6,
                            background: "rgba(255,255,255,0.05)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "rgba(255,255,255,0.3)",
                            fontSize: 14,
                            flexShrink: 0,
                          }}
                        >
                          🍱
                        </div>
                      )}

                      {/* Info plato */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: isSelected ? "#fff" : "rgba(255,255,255,0.85)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {plato.nombre}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: 2 }}>
                          <span
                            style={{
                              fontSize: 10,
                              color: "rgba(255,255,255,0.45)",
                              textTransform: "capitalize",
                            }}
                          >
                            {plato.categoria}
                          </span>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>•</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#ff9fa2" }}>
                            {Number(plato.precio).toFixed(2)} €
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer del modal */}
            <div
              style={{
                flexShrink: 0,
                padding: "1rem 1.5rem",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(0,0,0,0.3)",
              }}
            >
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)" }}>
                {selectedPlatosIds.length === 0 ? (
                  <span>
                    No has seleccionado ningún plato individual: <strong style={{ color: "#fff" }}>se aplicará a toda la carta</strong> (excepto bebidas).
                  </span>
                ) : (
                  <span>
                    Has seleccionado <strong style={{ color: "#4ade80" }}>{selectedPlatosIds.length}</strong> de{" "}
                    <strong>{platosSinBebidas.length}</strong> platos.
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.6rem" }}>
                <button
                  type="button"
                  onClick={() => setModalPlatosOpen(false)}
                  style={{
                    padding: "0.55rem 1rem",
                    borderRadius: 7,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => setModalPlatosOpen(false)}
                  style={{
                    padding: "0.55rem 1.3rem",
                    borderRadius: 7,
                    background: "linear-gradient(135deg, #c81e22 0%, #851316 100%)",
                    border: "none",
                    color: "#fff",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(200,30,34,0.4)",
                  }}
                >
                  Guardar Selección
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL VER PLATOS DEL CUPÓN EXISTENTE ──────────────────────── */}
      {viewingCuponPlatos && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingCuponPlatos(null);
          }}
        >
          <div
            style={{
              background: "#141010",
              border: "1px solid rgba(200, 30, 34, 0.4)",
              borderRadius: 14,
              padding: "1.25rem 1.5rem",
              width: "550px",
              maxWidth: "95vw",
              height: "520px",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#fff",
                    background: "rgba(200,30,34,0.2)",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  {viewingCuponPlatos.codigo}
                </span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                  Platos con descuento
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingCuponPlatos(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.4rem", margin: "0.5rem 0" }}>
              {(() => {
                try {
                  const ids: number[] = JSON.parse(viewingCuponPlatos.platosIds || "[]");
                  const matched = platosCarta.filter((p) => ids.includes(p.id));
                  if (matched.length === 0) {
                    return <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>No se encontraron platos asociados.</p>;
                  }
                  return matched.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.5rem 0.75rem",
                        borderRadius: 6,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <span style={{ fontSize: 12.5, color: "#fff", fontWeight: 500 }}>{p.nombre}</span>
                      <span style={{ fontSize: 12, color: "#ff7c80", fontWeight: 600 }}>{Number(p.precio).toFixed(2)} €</span>
                    </div>
                  ));
                } catch {
                  return <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Error al leer platos.</p>;
                }
              })()}
            </div>

            <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setViewingCuponPlatos(null)}
                style={{
                  padding: "0.4rem 1rem",
                  borderRadius: 6,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


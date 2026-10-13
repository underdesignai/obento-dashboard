"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Boxes, Plus, Trash2, Pencil, Search, AlertTriangle,
  Receipt, TrendingUp, TrendingDown, ArrowDownRight,
  ArrowUpRight, DollarSign, Package, FileText, CheckCircle2,
  Calendar, Layers, Filter, Eye, RefreshCw, X, Camera, Sparkles, Upload, Loader2, ExternalLink,
  Scale, Calculator
} from "lucide-react";
import {
  calcularCosteIngrediente,
  calcularConversionEnvase,
  convertirUnidad,
  normalizarUnidad,
  TIPOS_ENVASE_COMPRA
} from "@/lib/stock-unidades";

// Categorías estándar para cocina japonesa
const CATEGORIAS_STOCK = [
  "Todos",
  "Pescados y Mariscos",
  "Carnes y Aves",
  "Verduras y Frescos",
  "Arroz y Granos",
  "Algas y Nori",
  "Salsas y Condimentos",
  "Lácteos y Varios",
  "Packaging y Embalajes",
  "Bebidas",
  "Limpieza y Otros"
];

const MOTIVOS_MERMA = [
  { id: "caducado", label: "Caducado / Vencido" },
  { id: "podrido", label: "Podrido / Mal estado" },
  { id: "merma_limpieza", label: "Merma limpieza (espinas, piel, grasa)" },
  { id: "error_cocina", label: "Error de cocina / Preparación" },
  { id: "roto_transporte", label: "Roto / Dañado en entrega" },
  { id: "otro", label: "Otro motivo" }
];

const SCAN_STEPS = [
  { step: 1, title: "Subiendo documento y optimizando imagen...", detail: "Preparando resolución óptima para el motor de visión" },
  { step: 2, title: "Analizando factura con Inteligencia Artificial...", detail: "Detectando tablas, cabecera fiscal y tipos de letra" },
  { step: 3, title: "Extrayendo proveedor, CIF y fecha de emisión...", detail: "Leyendo número de factura y datos de contacto" },
  { step: 4, title: "Identificando líneas de compra y precios...", detail: "Desglosando cantidades, unidades, precios base e IVA" },
  { step: 5, title: "Cotejando productos con el inventario...", detail: "Buscando coincidencias con los ingredientes del almacén" },
  { step: 6, title: "Finalizando y preparando formulario...", detail: "Casi listo para tu revisión y confirmación" }
];

function isFiscalSummaryText(text: string): boolean {
  const d = (text || "").toLowerCase().trim();
  if (!d) return false;
  return (
    d.includes("identific. iva") ||
    d.includes("identific iva") ||
    d.includes("identif. iva") ||
    d.includes("identif iva") ||
    d.includes("base imponible") ||
    d.includes("base imp.") ||
    d.includes("cuota iva") ||
    d.includes("cuota de iva") ||
    d.includes("desglose iva") ||
    d.includes("desglose de iva") ||
    d.includes("tipo iva") ||
    d.includes("total factura") ||
    d.includes("total a pagar") ||
    d.includes("total importe") ||
    d.includes("recargo de equiv") ||
    d.includes("recargo equiv") ||
    d.includes("importe iva") ||
    d === "iva" ||
    /^iva\s*[:\-\s]?\s*\d+%?$/i.test(d) ||
    /^(base|total|cuota)\s*(imponible|iva|factura)?$/i.test(d)
  );
}

export default function StockPage() {
  const [activeTab, setActiveTab] = useState<"almacen" | "facturas" | "mermas" | "escandallo" | "rentabilidad">("almacen");
  const [loading, setLoading] = useState(true);

  // Datos
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [stockStats, setStockStats] = useState<any>({});
  const [facturas, setFacturas] = useState<any[]>([]);
  const [mermas, setMermas] = useState<any[]>([]);
  const [escandallos, setEscandallos] = useState<any[]>([]);
  const [rentabilidad, setRentabilidad] = useState<any>(null);

  // Modal para ver productos detallados de una factura guardada
  const [selectedFacturaDetail, setSelectedFacturaDetail] = useState<any | null>(null);

  // Filtros de Almacén
  const [searchStock, setSearchStock] = useState("");
  const [selectedCat, setSelectedCat] = useState("Todos");

  // Modales
  const [modalItemOpen, setModalItemOpen] = useState(false);
  const [itemForm, setItemForm] = useState<any>({
    id: null,
    nombre: "",
    categoria: "Pescados y Mariscos",
    unidad: "kg",
    cantidadActual: "",
    stockMinimo: 0,
    costeUnitario: "",
    proveedorHabitual: "",
    notas: ""
  });

  // Asistente para cálculo de envases (botes, sacos, cajas...)
  const [showEnvaseAssistant, setShowEnvaseAssistant] = useState(false);
  const [envaseForm, setEnvaseForm] = useState({
    tipoEnvase: "bote",
    numEnvases: 2,
    contenidoPorEnvase: 300,
    unidadContenido: "g",
    precioPorEnvase: 5.5,
  });

  const envaseConversionPreview = useMemo(() => {
    return calcularConversionEnvase({
      numEnvases: envaseForm.numEnvases,
      tipoEnvase: envaseForm.tipoEnvase,
      contenidoPorEnvase: envaseForm.contenidoPorEnvase,
      unidadContenido: envaseForm.unidadContenido,
      precioPorEnvase: envaseForm.precioPorEnvase,
    });
  }, [envaseForm]);

  const handleApplyEnvaseConversion = () => {
    const conv = envaseConversionPreview;
    setItemForm((prev: any) => ({
      ...prev,
      unidad: conv.unidadBase,
      cantidadActual: conv.cantidadTotal,
      costeUnitario: conv.costeUnitarioBase,
      notas: prev.notas ? `${prev.notas}\n${conv.descripcion}` : conv.descripcion,
    }));
  };

  const [modalFacturaOpen, setModalFacturaOpen] = useState(false);
  const [scanningFactura, setScanningFactura] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [scanMessage, setScanMessage] = useState("");
  const [facturaForm, setFacturaForm] = useState<any>({
    numeroFactura: "",
    proveedor: "",
    cifProveedor: "",
    fechaEmision: new Date().toISOString().split("T")[0],
    estadoPago: "pagado",
    metodoPago: "transferencia",
    notas: "",
    items: [
      { descripcion: "", stockItemId: "", cantidad: 1, unidad: "kg", precioUnitario: 0, ivaPct: 10 }
    ]
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>("application/pdf");
  const [previewFileName, setPreviewFileName] = useState<string>("");
  const [currentScanPage, setCurrentScanPage] = useState<number>(0);
  const [totalScanPages, setTotalScanPages] = useState<number>(0);

  // Separación nítida de Gastos sin IVA (Base Imponible), Importe IVA y Total Factura
  const { baseImponible, totalIva, totalFactura } = useMemo(() => {
    let base = 0;
    let iva = 0;
    for (const it of facturaForm.items || []) {
      const sub = Number(it.cantidad || 0) * Number(it.precioUnitario || 0);
      const cuota = sub * (Number(it.ivaPct || 10) / 100);
      base += sub;
      iva += cuota;
    }
    return {
      baseImponible: base,
      totalIva: iva,
      totalFactura: base + iva,
    };
  }, [facturaForm.items]);

  const closeModalFactura = () => {
    if (previewUrl) {
      try { URL.revokeObjectURL(previewUrl); } catch {}
    }
    setPreviewUrl(null);
    setModalFacturaOpen(false);
    setScanningFactura(false);
    setScanMessage("");
    setCurrentScanPage(0);
    setTotalScanPages(0);
  };

  // Escanear Factura Progresivo en Tiempo Real (Página por página con visor)
  const handleScanInvoiceFile = async (file: File) => {
    if (!file) return;

    // 1. Crear previsualización visual inmediata en el navegador (0ms)
    if (previewUrl) {
      try { URL.revokeObjectURL(previewUrl); } catch {}
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setPreviewType(file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg"));
    setPreviewFileName(file.name);

    setScanningFactura(true);
    setCurrentScanPage(1);
    setTotalScanPages(1);
    setScanMessage("Conectando con la IA y preparando documento...");

    // Limpiar artículos para que vayan apareciendo los nuevos en vivo
    setFacturaForm((prev: any) => ({
      ...prev,
      items: [],
    }));

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/admin/facturas/scan", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setScanMessage(errorData.error || `Error en el servidor (${res.status})`);
        setScanningFactura(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setScanMessage("No se pudo iniciar el flujo de lectura.");
        setScanningFactura(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const ev = JSON.parse(line);

            if (ev.type === "init") {
              setTotalScanPages(ev.totalPages || 1);
              setScanMessage(`Documento cargado: ${ev.totalPages} ${ev.totalPages === 1 ? "página" : "páginas"}.`);
              if (ev.archivoUrl) {
                setFacturaForm((prev: any) => ({
                  ...prev,
                  archivoUrl: ev.archivoUrl,
                  archivoNombre: ev.archivoNombre || file.name,
                }));
              }
            } else if (ev.type === "page_start") {
              setCurrentScanPage(ev.page);
              setTotalScanPages(ev.totalPages);
              setScanMessage(`Analizando página ${ev.page} de ${ev.totalPages}...`);
            } else if (ev.type === "page_data") {
              if (ev.header) {
                setFacturaForm((prev: any) => ({
                  ...prev,
                  numeroFactura: ev.header.numeroFactura || prev.numeroFactura,
                  proveedor: ev.header.proveedor || prev.proveedor,
                  cifProveedor: ev.header.cifProveedor || prev.cifProveedor,
                  fechaEmision: ev.header.fechaEmision || prev.fechaEmision,
                  estadoPago: ev.header.estadoPago || prev.estadoPago,
                }));
              }
              if (ev.items && ev.items.length > 0) {
                const cleanItems = ev.items.filter((it: any) => !isFiscalSummaryText(it.descripcion));
                setFacturaForm((prev: any) => ({
                  ...prev,
                  items: [...prev.items, ...cleanItems],
                }));
              }
            } else if (ev.type === "complete") {
              setScanMessage(ev.message || "¡Lectura de todas las páginas completada con éxito!");
            } else if (ev.type === "error") {
              setScanMessage("Aviso: " + ev.error);
            }
          } catch (e) {
            console.warn("Parse stream warning:", e);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setScanMessage("Error procesando documento: " + (err?.message || ""));
    } finally {
      setScanningFactura(false);
    }
  };

  const [modalMermaOpen, setModalMermaOpen] = useState(false);
  const [mermaForm, setMermaForm] = useState<any>({
    stockItemId: "",
    cantidad: 1,
    motivo: "caducado",
    notas: ""
  });

  const [modalEscandalloOpen, setModalEscandalloOpen] = useState(false);
  const [escandalloForm, setEscandalloForm] = useState<any>({
    platoNombre: "",
    menuItemId: null,
    stockItemId: "",
    cantidad: 20,
    unidad: "g",
    notas: ""
  });

  const selectedStockForEscandallo = useMemo(() => {
    if (!escandalloForm.stockItemId) return null;
    return stockItems.find(s => s.id === Number(escandalloForm.stockItemId)) || null;
  }, [stockItems, escandalloForm.stockItemId]);

  const costeEstimadoEscandallo = useMemo(() => {
    if (!selectedStockForEscandallo || !escandalloForm.cantidad) return 0;
    return calcularCosteIngrediente(
      Number(escandalloForm.cantidad),
      escandalloForm.unidad || "g",
      selectedStockForEscandallo.costeUnitario || 0,
      selectedStockForEscandallo.unidad || "kg"
    );
  }, [selectedStockForEscandallo, escandalloForm.cantidad, escandalloForm.unidad]);

  // Cargar datos
  const loadData = async () => {
    setLoading(true);
    try {
      const [resStock, resFacturas, resMermas, resEscandallos, resRentab] = await Promise.all([
        fetch("/api/admin/stock").then(r => r.json()),
        fetch("/api/admin/facturas").then(r => r.json()),
        fetch("/api/admin/mermas").then(r => r.json()),
        fetch("/api/admin/escandallos").then(r => r.json()),
        fetch("/api/admin/reportes/rentabilidad").then(r => r.json()),
      ]);

      if (resStock.items) {
        setStockItems(resStock.items);
        setStockStats(resStock.stats || {});
      }
      if (resFacturas.facturas) setFacturas(resFacturas.facturas);
      if (resMermas.mermas) setMermas(resMermas.mermas);
      if (resEscandallos.platos) setEscandallos(resEscandallos.platos);
      if (resRentab.metricas) setRentabilidad(resRentab);
    } catch (err) {
      console.error("Error cargando módulo de stock:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrado de stock
  const filteredStock = useMemo(() => {
    return stockItems.filter(item => {
      const matchSearch = item.nombre.toLowerCase().includes(searchStock.toLowerCase()) ||
                          (item.proveedorHabitual && item.proveedorHabitual.toLowerCase().includes(searchStock.toLowerCase()));
      const matchCat = selectedCat === "Todos" || item.categoria === selectedCat;
      return matchSearch && matchCat;
    });
  }, [stockItems, searchStock, selectedCat]);

  // Guardar artículo de stock
  const handleSaveStockItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!itemForm.id;
      const res = await fetch("/api/admin/stock", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemForm),
      });
      if (res.ok) {
        setModalItemOpen(false);
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [savingFactura, setSavingFactura] = useState(false);

  // Guardar factura
  const handleSaveFactura = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (savingFactura) return;
    setSavingFactura(true);
    try {
      const res = await fetch("/api/admin/facturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(facturaForm),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        closeModalFactura();
        setFacturaForm({
          numeroFactura: "",
          proveedor: "",
          cifProveedor: "",
          fechaEmision: new Date().toISOString().split("T")[0],
          estadoPago: "pagado",
          metodoPago: "transferencia",
          notas: "",
          items: [{ descripcion: "", stockItemId: "", cantidad: 1, unidad: "kg", precioUnitario: 0, ivaPct: 10 }]
        });
        await loadData();
      } else {
        alert(data.error || "Error al registrar la factura en la base de datos.");
      }
    } catch (e: any) {
      console.error(e);
      alert("Error de conexión al guardar factura: " + (e?.message || ""));
    } finally {
      setSavingFactura(false);
    }
  };

  const [attachingFile, setAttachingFile] = useState<number | null>(null);

  // Adjuntar archivo PDF o imagen a una factura existente
  const handleAttachFileToFactura = async (facturaId: number, file: File) => {
    if (!file) return;
    setAttachingFile(facturaId);
    try {
      const fd = new FormData();
      fd.append("id", String(facturaId));
      fd.append("file", file);
      const res = await fetch("/api/admin/facturas", {
        method: "PATCH",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await loadData();
        if (selectedFacturaDetail && selectedFacturaDetail.id === facturaId) {
          setSelectedFacturaDetail((prev: any) => ({
            ...prev,
            archivoUrl: data.factura?.archivoUrl || prev.archivoUrl,
            archivoNombre: file.name,
          }));
        }
      } else {
        alert(data.error || "Error al adjuntar archivo.");
      }
    } catch (e: any) {
      console.error(e);
      alert("Error de conexión al adjuntar archivo: " + (e?.message || ""));
    } finally {
      setAttachingFile(null);
    }
  };

  // Guardar merma
  const handleSaveMerma = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/mermas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mermaForm),
      });
      if (res.ok) {
        setModalMermaOpen(false);
        setMermaForm({ stockItemId: "", cantidad: 1, motivo: "caducado", notas: "" });
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Guardar ingrediente de escandallo
  const handleSaveEscandallo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/escandallos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(escandalloForm),
      });
      if (res.ok) {
        setModalEscandalloOpen(false);
        setEscandalloForm({ platoNombre: "", stockItemId: "", cantidad: 0.100, unidad: "kg", notas: "" });
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Cabecera Principal */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.75rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ display: "inline-flex", padding: 8, borderRadius: 10, background: "rgba(200,30,34,0.12)", color: "#ef4444" }}>
              <Boxes size={22} />
            </span>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: "0.04em", color: "#f3ede0" }}>
              Almacén, Stock y Costes
            </h1>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
            Control en tiempo real de ingredientes, facturas de proveedores, mermas tiradas y escandallo de sushi.
          </p>
        </div>

        {/* Botones de acción rápida */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
          <button
            onClick={() => setModalFacturaOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: "0.45rem",
              background: "#16a34a", color: "#fff", border: "none",
              borderRadius: 9, padding: "0.65rem 1.1rem", fontSize: 13,
              fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(22, 163, 74, 0.3)"
            }}
          >
            <Plus size={16} /> Subir Factura / Compra
          </button>

          <button
            onClick={() => setModalMermaOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: "0.45rem",
              background: "rgba(220,38,38,0.16)", color: "#f87171", border: "1px solid rgba(220,38,38,0.4)",
              borderRadius: 9, padding: "0.65rem 1.1rem", fontSize: 13,
              fontWeight: 700, cursor: "pointer"
            }}
          >
            <Trash2 size={16} /> Registrar Merma / Tirado
          </button>

          <button
            onClick={() => {
              setItemForm({
                id: null, nombre: "", categoria: "Pescados y Mariscos", unidad: "kg",
                cantidadActual: "", stockMinimo: 0, costeUnitario: "", proveedorHabitual: "", notas: ""
              });
              setModalItemOpen(true);
            }}
            style={{
              display: "flex", alignItems: "center", gap: "0.45rem",
              background: "#27272a", color: "#f4f4f5", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 9, padding: "0.65rem 1rem", fontSize: 13,
              fontWeight: 700, cursor: "pointer"
            }}
          >
            <Plus size={16} /> Nuevo Ingrediente
          </button>

          <button
            onClick={loadData}
            title="Recargar datos"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9,
              width: 38, height: 38, cursor: "pointer"
            }}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Tarjetas KPI Superiores */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
        {/* Valor Total Almacén */}
        <div style={{ background: "#111216", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1.1rem 1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,255,255,0.5)" }}>
              Valor en Almacén
            </span>
            <Package size={18} color="#c9a84c" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#f3ede0" }}>
            {stockStats.valorTotalAlmacen ? `${stockStats.valorTotalAlmacen.toLocaleString("es-ES")} €` : "0,00 €"}
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            {stockStats.totalArticulos || stockItems.length} ingredientes activos
          </div>
        </div>

        {/* Alerta Stock Bajo */}
        <div style={{ background: "#111216", border: `1px solid ${stockStats.alertaBajoStock > 0 ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.07)"}`, borderRadius: 14, padding: "1.1rem 1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,255,255,0.5)" }}>
              Bajo Stock Mínimo
            </span>
            <AlertTriangle size={18} color={stockStats.alertaBajoStock > 0 ? "#ef4444" : "#a1a1aa"} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: stockStats.alertaBajoStock > 0 ? "#ef4444" : "#4ade80" }}>
            {stockStats.alertaBajoStock || 0}
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            {stockStats.alertaBajoStock > 0 ? "Requieren pedido a proveedor" : "Nivel de stock óptimo"}
          </div>
        </div>

        {/* Gasto Compras Facturas */}
        <div style={{ background: "#111216", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1.1rem 1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,255,255,0.5)" }}>
              Compras / Facturas
            </span>
            <Receipt size={18} color="#3b82f6" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#f3ede0" }}>
            {rentabilidad?.metricas?.comprasTotales !== undefined ? `${rentabilidad.metricas.comprasTotales.toLocaleString("es-ES")} €` : "0,00 €"}
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            {facturas.length} facturas registradas
          </div>
        </div>

        {/* Dinero Perdido en Mermas */}
        <div style={{ background: "#111216", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1.1rem 1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,255,255,0.5)" }}>
              Mermas y Tirados
            </span>
            <Trash2 size={18} color="#f97316" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#f97316" }}>
            {rentabilidad?.metricas?.perdidasMermas !== undefined ? `${rentabilidad.metricas.perdidasMermas.toLocaleString("es-ES")} €` : "0,00 €"}
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            {mermas.length} registros de desperdicio
          </div>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div style={{ display: "flex", gap: "0.4rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.75rem", marginBottom: "1.5rem", overflowX: "auto" }}>
        {[
          { id: "almacen", label: "📦 Inventario de Almacén", count: stockItems.length },
          { id: "facturas", label: "🧾 Facturas y Compras", count: facturas.length },
          { id: "mermas", label: "🗑️ Mermas y Desperdicio", count: mermas.length },
          { id: "escandallo", label: "🍣 Escandallo (Coste por Sushi)", count: escandallos.length },
          { id: "rentabilidad", label: "📊 Extracto y Rentabilidad Real" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: "0.6rem 1.1rem",
              borderRadius: 9,
              border: "none",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              background: activeTab === tab.id ? "rgba(200,30,34,0.18)" : "transparent",
              color: activeTab === tab.id ? "#ef4444" : "rgba(255,255,255,0.6)",
              borderBottom: activeTab === tab.id ? "2px solid #ef4444" : "2px solid transparent",
              whiteSpace: "nowrap",
              transition: "all 120ms"
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span style={{ marginLeft: 6, fontSize: 11, padding: "2px 6px", borderRadius: 10, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          PESTAÑA 1: INVENTARIO DE ALMACÉN
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "almacen" && (
        <div>
          {/* Filtros */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#111216", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, padding: "0.4rem 0.75rem", minWidth: 260 }}>
              <Search size={16} color="rgba(255,255,255,0.4)" />
              <input
                type="text"
                placeholder="Buscar ingrediente o proveedor..."
                value={searchStock}
                onChange={e => setSearchStock(e.target.value)}
                style={{ background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 13, width: "100%" }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.4rem", overflowX: "auto" }}>
              {CATEGORIAS_STOCK.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  style={{
                    padding: "0.45rem 0.85rem",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "none",
                    background: selectedCat === cat ? "#ef4444" : "rgba(255,255,255,0.05)",
                    color: selectedCat === cat ? "#fff" : "rgba(255,255,255,0.6)",
                    whiteSpace: "nowrap"
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla de Stock */}
          <div style={{ background: "#111216", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.45)" }}>
                    <th style={{ padding: "0.85rem 1rem" }}>Ingrediente</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Categoría</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Existencias Actuales</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Stock Mínimo</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Coste Medio Unit.</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Valor Total</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Proveedor</th>
                    <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStock.map(item => {
                    const isAgotado = item.cantidadActual <= 0;
                    const isBajo = !isAgotado && item.stockMinimo > 0 && item.cantidadActual <= item.stockMinimo;
                    const valorTotal = item.cantidadActual * item.costeUnitario;
                    return (
                      <tr key={item.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <div style={{ fontWeight: 700, color: "#fff" }}>{item.nombre}</div>
                          {item.notas && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{item.notas}</div>}
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}>
                            {item.categoria}
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontWeight: 800, fontSize: 14, color: isAgotado ? "#ef4444" : isBajo ? "#facc15" : "#f3ede0" }}>
                              {item.cantidadActual} {item.unidad}
                            </span>
                            {isAgotado && (
                              <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(239,68,68,0.2)", color: "#ef4444", padding: "2px 5px", borderRadius: 4 }}>
                                AGOTADO
                              </span>
                            )}
                            {isBajo && (
                              <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(234,179,8,0.2)", color: "#facc15", padding: "2px 5px", borderRadius: 4 }}>
                                BAJO
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "0.85rem 1rem", color: "rgba(255,255,255,0.5)" }}>
                          {item.stockMinimo} {item.unidad}
                        </td>
                        <td style={{ padding: "0.85rem 1rem", fontWeight: 600, color: "#c9a84c" }}>
                          {(item.costeUnitario < 0.1 && item.costeUnitario > 0 ? item.costeUnitario.toFixed(4) : item.costeUnitario.toFixed(2))} € / {item.unidad}
                        </td>
                        <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#fff" }}>
                          {valorTotal.toFixed(2)} €
                        </td>
                        <td style={{ padding: "0.85rem 1rem", color: "rgba(255,255,255,0.6)" }}>
                          {item.proveedorHabitual || "—"}
                        </td>
                        <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                            <button
                              onClick={() => {
                                setItemForm(item);
                                setShowEnvaseAssistant(false);
                                setEnvaseForm({
                                  tipoEnvase: item.unidad === "saco" ? "saco" : item.unidad === "caja" ? "caja" : item.unidad === "paquete" ? "paquete" : "bote",
                                  numEnvases: 1,
                                  contenidoPorEnvase: item.cantidadActual || 1,
                                  unidadContenido: item.unidad === "bote" || item.unidad === "saco" ? "g" : item.unidad || "g",
                                  precioPorEnvase: item.costeUnitario || 0,
                                });
                                setModalItemOpen(true);
                              }}
                              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 4 }}
                              title="Editar ingrediente"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => {
                                setMermaForm({ stockItemId: item.id, cantidad: 1, motivo: "caducado", notas: "" });
                                setModalMermaOpen(true);
                              }}
                              style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", padding: 4 }}
                              title="Registrar merma directa"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStock.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: "2.5rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                        No se encontraron ingredientes con los filtros actuales.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          PESTAÑA 2: FACTURAS Y ENTRADAS DE COMPRA
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "facturas" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#f3ede0", margin: 0 }}>
              Historial de Facturas y Compras a Proveedores
            </h2>
            <button
              onClick={() => setModalFacturaOpen(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "#16a34a", color: "#fff", border: "none",
                borderRadius: 8, padding: "0.55rem 0.95rem", fontSize: 12, fontWeight: 700, cursor: "pointer"
              }}
            >
              <Plus size={15} /> Añadir Factura
            </button>
          </div>

          <div style={{ background: "#111216", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.45)" }}>
                    <th style={{ padding: "0.85rem 1rem" }}>Nº Factura</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Proveedor</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Fecha Emisión</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Gasto sin IVA (Base)</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Importe IVA</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Total Factura</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Estado</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Productos en Almacén</th>
                    <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map(f => (
                    <tr key={f.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#fff" }}>
                        {f.numeroFactura}
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ fontWeight: 600, color: "#f3ede0" }}>{f.proveedor}</div>
                        {f.cifProveedor && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>CIF: {f.cifProveedor}</div>}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", color: "rgba(255,255,255,0.6)" }}>
                        {new Date(f.fechaEmision).toLocaleDateString("es-ES")}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", fontWeight: 600, color: "#f3ede0" }}>
                        {f.totalBase.toFixed(2)} €
                      </td>
                      <td style={{ padding: "0.85rem 1rem", color: "#a1a1aa" }}>
                        {f.totalIva.toFixed(2)} €
                      </td>
                      <td style={{ padding: "0.85rem 1rem", fontWeight: 800, fontSize: 14, color: "#4ade80" }}>
                        {f.totalFactura.toFixed(2)} €
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                          background: f.estadoPago === "pagado" ? "rgba(34,197,94,0.15)" : "rgba(234,179,8,0.15)",
                          color: f.estadoPago === "pagado" ? "#4ade80" : "#facc15"
                        }}>
                          {f.estadoPago.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "0.85rem 1rem", color: "rgba(255,255,255,0.7)" }}>
                        <span style={{ background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: 5, fontSize: 12 }}>
                          {f.items?.length || 0} productos ingresados
                        </span>
                      </td>
                      <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6 }}>
                          {f.archivoUrl ? (
                            <a
                              href={f.archivoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Ver factura original completa (PDF o imagen)"
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 5,
                                background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.4)",
                                borderRadius: 6, padding: "0.35rem 0.65rem", color: "#c9a84c", fontSize: 11.5,
                                textDecoration: "none", fontWeight: 700
                              }}
                            >
                              <FileText size={13} /> Factura Original <ExternalLink size={11} />
                            </a>
                          ) : (
                            <label
                              title="Adjuntar PDF o imagen original de esta factura"
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 5,
                                background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.25)",
                                borderRadius: 6, padding: "0.35rem 0.65rem", color: "rgba(255,255,255,0.7)",
                                fontSize: 11.5, cursor: attachingFile === f.id ? "wait" : "pointer"
                              }}
                            >
                              {attachingFile === f.id ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                              {attachingFile === f.id ? "Adjuntando..." : "Adjuntar Factura"}
                              <input
                                type="file"
                                accept="application/pdf,image/*"
                                style={{ display: "none" }}
                                disabled={attachingFile !== null}
                                onChange={(e) => {
                                  const fl = e.target.files?.[0];
                                  if (fl) handleAttachFileToFactura(f.id, fl);
                                }}
                              />
                            </label>
                          )}
                          <button
                            onClick={() => setSelectedFacturaDetail(f)}
                            title="Ver desglose de productos"
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: 6, padding: "0.35rem 0.65rem", color: "#fff", fontSize: 11.5, cursor: "pointer"
                            }}
                          >
                            <Eye size={13} /> Ver Detalle
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {facturas.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ padding: "2.5rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                        No hay facturas registradas todavía. Pulsa en "Subir Factura / Compra" para registrar tu primera factura.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Detalle de Factura con desglose de IVA y líneas de productos */}
          {selectedFacturaDetail && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
              <div style={{ background: "#14151a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, width: "100%", maxWidth: 800, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#fff" }}>
                      Factura {selectedFacturaDetail.numeroFactura} - {selectedFacturaDetail.proveedor}
                    </h3>
                    <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                      Fecha de emisión: {new Date(selectedFacturaDetail.fechaEmision).toLocaleDateString("es-ES")} {selectedFacturaDetail.cifProveedor ? `· CIF: ${selectedFacturaDetail.cifProveedor}` : ""}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {selectedFacturaDetail.archivoUrl ? (
                      <a
                        href={selectedFacturaDetail.archivoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          background: "rgba(201,168,76,0.18)", border: "1px solid rgba(201,168,76,0.5)",
                          borderRadius: 8, padding: "0.45rem 0.85rem", color: "#eab308", fontSize: 12,
                          textDecoration: "none", fontWeight: 700
                        }}
                      >
                        <FileText size={15} /> Ver Factura Original <ExternalLink size={12} />
                      </a>
                    ) : (
                      <label style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: "rgba(255,255,255,0.06)", border: "1px dashed rgba(255,255,255,0.25)",
                        borderRadius: 8, padding: "0.45rem 0.85rem", color: "rgba(255,255,255,0.8)",
                        fontSize: 12, cursor: attachingFile === selectedFacturaDetail.id ? "wait" : "pointer",
                        fontWeight: 600
                      }}>
                        {attachingFile === selectedFacturaDetail.id ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        {attachingFile === selectedFacturaDetail.id ? "Adjuntando..." : "Adjuntar Factura Original"}
                        <input
                          type="file"
                          accept="application/pdf,image/*"
                          style={{ display: "none" }}
                          disabled={attachingFile !== null}
                          onChange={(e) => {
                            const fl = e.target.files?.[0];
                            if (fl) handleAttachFileToFactura(selectedFacturaDetail.id, fl);
                          }}
                        />
                      </label>
                    )}
                    <button onClick={() => setSelectedFacturaDetail(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Resumen Fiscal de la Factura */}
                <div style={{ padding: "1rem 1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ background: "#1a1b22", padding: "0.75rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Gasto sin IVA (Base)</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginTop: 2 }}>{selectedFacturaDetail.totalBase.toFixed(2)} €</div>
                  </div>
                  <div style={{ background: "#1a1b22", padding: "0.75rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Importe del IVA</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#a1a1aa", marginTop: 2 }}>{selectedFacturaDetail.totalIva.toFixed(2)} €</div>
                  </div>
                  <div style={{ background: "#1a1b22", padding: "0.75rem", borderRadius: 8, border: "1px solid rgba(34,197,94,0.2)" }}>
                    <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Total Factura (con IVA)</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#4ade80", marginTop: 2 }}>{selectedFacturaDetail.totalFactura.toFixed(2)} €</div>
                  </div>
                </div>

                {/* Líneas de Productos Comprados e Ingresados en el Almacén */}
                <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "1rem 1.5rem" }}>
                  <h4 style={{ margin: "0 0 0.75rem", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
                    Productos Ingresados en el Almacén ({selectedFacturaDetail.items?.length || 0})
                  </h4>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
                    <thead>
                      <tr style={{ color: "rgba(255,255,255,0.4)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                        <th style={{ padding: "0.5rem" }}>Producto / Artículo</th>
                        <th style={{ padding: "0.5rem" }}>Cantidad</th>
                        <th style={{ padding: "0.5rem" }}>Unidad</th>
                        <th style={{ padding: "0.5rem" }}>P. Unitario</th>
                        <th style={{ padding: "0.5rem" }}>IVA</th>
                        <th style={{ padding: "0.5rem", textAlign: "right" }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedFacturaDetail.items || []).map((it: any, i: number) => (
                        <tr key={it.id || i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: "0.6rem 0.5rem", fontWeight: 600, color: "#fff" }}>
                            {it.descripcion}
                            {it.stockItem?.nombre && (
                              <span style={{ display: "block", fontSize: 11, color: "#4ade80" }}>
                                Vinculado a: {it.stockItem.nombre}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "0.6rem 0.5rem", color: "rgba(255,255,255,0.8)" }}>{it.cantidad}</td>
                          <td style={{ padding: "0.6rem 0.5rem", color: "rgba(255,255,255,0.5)" }}>{it.unidad}</td>
                          <td style={{ padding: "0.6rem 0.5rem", color: "rgba(255,255,255,0.8)" }}>{it.precioUnitario.toFixed(2)} €</td>
                          <td style={{ padding: "0.6rem 0.5rem", color: "rgba(255,255,255,0.5)" }}>{it.ivaPct}%</td>
                          <td style={{ padding: "0.6rem 0.5rem", textAlign: "right", fontWeight: 700, color: "#4ade80" }}>{it.subtotal.toFixed(2)} €</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setSelectedFacturaDetail(null)}
                    style={{ padding: "0.55rem 1.25rem", background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, cursor: "pointer" }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          PESTAÑA 3: MERMAS Y DESPERDICIO (LO QUE SE TIRA O SE PUDRE)
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "mermas" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#f3ede0", margin: 0 }}>
                Control de Mermas, Desperdicios y Caducidades
              </h2>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                Registro estricto de productos que se han podrido, caducado, tirado o estropeado en cocina.
              </p>
            </div>
            <button
              onClick={() => setModalMermaOpen(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "#dc2626", color: "#fff", border: "none",
                borderRadius: 8, padding: "0.55rem 0.95rem", fontSize: 12, fontWeight: 700, cursor: "pointer"
              }}
            >
              <Plus size={15} /> Registrar Merma
            </button>
          </div>

          <div style={{ background: "#111216", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.45)" }}>
                    <th style={{ padding: "0.85rem 1rem" }}>Fecha</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Producto Desperdiciado</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Cantidad Tirada</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Motivo</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Coste Económico Perdido</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Notas / Explicación</th>
                  </tr>
                </thead>
                <tbody>
                  {mermas.map(m => (
                    <tr key={m.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "0.85rem 1rem", color: "rgba(255,255,255,0.6)" }}>
                        {new Date(m.fecha).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#fff" }}>
                        {m.stockItem?.nombre || "Artículo eliminado"}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", fontWeight: 800, color: "#fca5a5" }}>
                        {m.cantidad} {m.unidad}
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(239,68,68,0.15)", color: "#ef4444", fontWeight: 600 }}>
                          {MOTIVOS_MERMA.find(x => x.id === m.motivo)?.label || m.motivo}
                        </span>
                      </td>
                      <td style={{ padding: "0.85rem 1rem", fontWeight: 800, color: "#f97316", fontSize: 14 }}>
                        -{m.costePerdido.toFixed(2)} €
                      </td>
                      <td style={{ padding: "0.85rem 1rem", color: "rgba(255,255,255,0.45)" }}>
                        {m.notas || "—"}
                      </td>
                    </tr>
                  ))}
                  {mermas.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: "2.5rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                        No hay registro de mermas o desperdicio. ¡Excelente control de cocina!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          PESTAÑA 4: ESCANDALLO (COSTE REAL POR SUSHI / PLATO)
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "escandallo" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#f3ede0", margin: 0 }}>
                Escandallo de la Carta (Coste de Ingredientes vs. Precio de Venta)
              </h2>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                Calcula al milímetro cuánto cuesta fabricar cada rollo, nigiri o plato de la carta según el precio real de compra.
              </p>
            </div>
            <button
              onClick={() => setModalEscandalloOpen(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "#c9a84c", color: "#000", border: "none",
                borderRadius: 8, padding: "0.55rem 0.95rem", fontSize: 12, fontWeight: 800, cursor: "pointer"
              }}
            >
              <Plus size={15} /> Asignar Ingrediente a Plato
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1rem" }}>
            {escandallos.map(plato => (
              <div key={plato.id} style={{ background: "#111216", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#fff" }}>{plato.nombre}</h3>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{plato.categoria}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: "#f3ede0" }}>{plato.precioVenta.toFixed(2)} €</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>PVP Venta</div>
                    </div>
                  </div>

                  {/* Barra de márgenes */}
                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "0.75rem", marginBottom: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>Coste Ingredientes:</span>
                      <strong style={{ color: "#ef4444" }}>{plato.costeMateriaPrima.toFixed(2)} € ({plato.foodCostPct}%)</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>Margen Bruto (Ganancia):</span>
                      <strong style={{ color: "#4ade80" }}>+{plato.beneficioBruto.toFixed(2)} € ({plato.margenPct}%)</strong>
                    </div>
                  </div>

                  {/* Lista de ingredientes que lleva */}
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 6, fontWeight: 700, textTransform: "uppercase" }}>
                    Ingredientes de la receta ({plato.ingredientesCount}):
                  </div>
                  {plato.ingredientes.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                      {plato.ingredientes.map((ing: any) => {
                        const coste = calcularCosteIngrediente(
                          ing.cantidad,
                          ing.unidad || "g",
                          ing.stockItem?.costeUnitario || 0,
                          ing.stockItem?.unidad || "kg"
                        );
                        return (
                          <div key={ing.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.75)", background: "rgba(255,255,255,0.02)", padding: "4px 8px", borderRadius: 6 }}>
                            <span>{ing.stockItem?.nombre || "Ingrediente"}</span>
                            <span style={{ fontWeight: 600 }}>{ing.cantidad} {ing.unidad} (~{coste.toFixed(2)} €)</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontStyle: "italic", marginBottom: 12 }}>
                      Sin receta asignada. Pulsa en vincular para añadir los gramos de salmón, arroz, etc.
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setEscandalloForm({
                      platoNombre: plato.nombre,
                      menuItemId: plato.id,
                      stockItemId: "",
                      cantidad: 20,
                      unidad: "g",
                      notas: ""
                    });
                    setModalEscandalloOpen(true);
                  }}
                  style={{
                    width: "100%", padding: "0.55rem", background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f3ede0",
                    fontSize: 12, fontWeight: 700, cursor: "pointer"
                  }}
                >
                  + Vincular Ingrediente a este Plato
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          PESTAÑA 5: EXTRACTO Y RENTABILIDAD DEL NEGOCIO
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "rentabilidad" && rentabilidad && (
        <div>
          <div style={{ background: "#111216", border: "1px solid rgba(200,30,34,0.2)", borderRadius: 16, padding: "1.75rem", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 1rem" }}>
              Resumen Financiero del Restaurante (Mes Actual)
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
                  Total Ingresos (Ventas de Pedidos)
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#4ade80", marginTop: 4 }}>
                  +{rentabilidad.metricas.ventasTotales.toLocaleString("es-ES")} €
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                  {rentabilidad.metricas.totalPedidos} pedidos completados
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
                  Total Compras (Facturas Proveedor)
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#ef4444", marginTop: 4 }}>
                  -{rentabilidad.metricas.comprasTotales.toLocaleString("es-ES")} €
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                  {rentabilidad.metricas.totalFacturas} facturas procesadas
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
                  Pérdidas por Mermas / Tirado
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#f97316", marginTop: 4 }}>
                  -{rentabilidad.metricas.perdidasMermas.toLocaleString("es-ES")} €
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                  Desperdicio cuantificado
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
                  Margen Bruto del Mes
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: rentabilidad.metricas.beneficioBruto >= 0 ? "#4ade80" : "#ef4444", marginTop: 4 }}>
                  {rentabilidad.metricas.beneficioBruto.toLocaleString("es-ES")} €
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                  Food Cost Ratio: {rentabilidad.metricas.foodCostPorcentaje}%
                </div>
              </div>
            </div>
          </div>

          {/* Desglose de Compras por Categoría */}
          <div style={{ background: "#111216", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1.5rem" }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#f3ede0", margin: "0 0 1rem" }}>
              Desglose de Gasto en Compras por Categoría
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
              {Object.entries(rentabilidad.desgloseCompras || {}).map(([cat, total]: [string, any]) => (
                <div key={cat} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "0.85rem 1rem" }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{cat}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#f3ede0", marginTop: 4 }}>
                    {total.toFixed(2)} €
                  </div>
                </div>
              ))}
              {Object.keys(rentabilidad.desgloseCompras || {}).length === 0 && (
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                  No hay desglose disponible para este periodo todavía.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL: ALTA / EDICIÓN INGREDIENTE
      ───────────────────────────────────────────────────────────────────────────── */}
      {modalItemOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#14151a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#fff" }}>
                  {itemForm.id ? "Editar Ingrediente de Almacén" : "Nuevo Ingrediente de Almacén"}
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.4)" }}>
                  Define unidades, existencias y equivalencias de compra para escandallos precisos
                </p>
              </div>
              <button onClick={() => setModalItemOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveStockItem} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase" }}>Nombre del Ingrediente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Salmón Noruego Fresco"
                  value={itemForm.nombre}
                  onChange={e => setItemForm({ ...itemForm, nombre: e.target.value })}
                  style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase" }}>Categoría *</label>
                  <select
                    value={itemForm.categoria}
                    onChange={e => setItemForm({ ...itemForm, categoria: e.target.value })}
                    style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
                  >
                    {CATEGORIAS_STOCK.filter(c => c !== "Todos").map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase" }}>Unidad de Medida Base *</label>
                  <select
                    value={itemForm.unidad}
                    onChange={e => setItemForm({ ...itemForm, unidad: e.target.value })}
                    style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
                  >
                    <optgroup label="Peso (Gramos / Kilogramos)">
                      <option value="g">Gramos (g) — Recomendado para cocina/sushi</option>
                      <option value="kg">Kilogramos (kg)</option>
                    </optgroup>
                    <optgroup label="Volumen (Líquidos / Salsas)">
                      <option value="ml">Mililitros (ml)</option>
                      <option value="cl">Centilitros (cl)</option>
                      <option value="l">Litros (l)</option>
                    </optgroup>
                    <optgroup label="Unidades / Conteo">
                      <option value="ud">Unidades / Piezas (ud)</option>
                      <option value="botella">Botellas</option>
                      <option value="lata">Latas</option>
                    </optgroup>
                    <optgroup label="Envases de Compra">
                      <option value="bote">Botes</option>
                      <option value="saco">Sacos</option>
                      <option value="caja">Cajas</option>
                      <option value="paquete">Paquetes</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* ── ASISTENTE DE CONVERSIÓN DE ENVASES (Botes, Sacos, Cajas...) ── */}
              <div style={{ background: "rgba(201,168,76,0.05)", border: "1px dashed rgba(201,168,76,0.35)", borderRadius: 10, padding: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#eab308", fontWeight: 700, fontSize: 12 }}>
                    <Package size={15} />
                    ¿Viene en Bote, Saco o Caja? (Calculadora de Formato)
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEnvaseAssistant(!showEnvaseAssistant)}
                    style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 6, padding: "2px 8px", color: "#eab308", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    {showEnvaseAssistant ? "Cerrar Calculadora" : "Abrir Calculadora ▼"}
                  </button>
                </div>

                {showEnvaseAssistant && (
                  <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.65rem", paddingTop: "0.65rem", borderTop: "1px solid rgba(201,168,76,0.2)" }}>
                    <p style={{ margin: 0, fontSize: 11.5, color: "rgba(255,255,255,0.6)" }}>
                      Indica el formato de compra para calcular automáticamente los gramos, kg o unidades reales y el coste unitario:
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 2 }}>Tipo Envase</label>
                        <select
                          value={envaseForm.tipoEnvase}
                          onChange={e => setEnvaseForm({ ...envaseForm, tipoEnvase: e.target.value })}
                          style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "0.45rem", color: "#fff", fontSize: 12 }}
                        >
                          <option value="bote">Bote / Tarro</option>
                          <option value="saco">Saco</option>
                          <option value="caja">Caja / Pack</option>
                          <option value="paquete">Paquete</option>
                          <option value="garrafa">Garrafa / Botella</option>
                          <option value="unidad">Unidad / Pieza</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 2 }}>Nº Envases</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="2"
                          value={envaseForm.numEnvases}
                          onChange={e => setEnvaseForm({ ...envaseForm, numEnvases: Number(e.target.value) || 0 })}
                          style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "0.45rem", color: "#fff", fontSize: 12 }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 2 }}>Contenido c/u</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="300"
                          value={envaseForm.contenidoPorEnvase}
                          onChange={e => setEnvaseForm({ ...envaseForm, contenidoPorEnvase: Number(e.target.value) || 0 })}
                          style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "0.45rem", color: "#fff", fontSize: 12 }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 2 }}>Unidad</label>
                        <select
                          value={envaseForm.unidadContenido}
                          onChange={e => setEnvaseForm({ ...envaseForm, unidadContenido: e.target.value })}
                          style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "0.45rem", color: "#fff", fontSize: 12 }}
                        >
                          <option value="g">Gramos (g)</option>
                          <option value="kg">Kilogramos (kg)</option>
                          <option value="ml">Mililitros (ml)</option>
                          <option value="l">Litros (l)</option>
                          <option value="ud">Unidades (ud)</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "0.5rem", alignItems: "flex-end" }}>
                      <div>
                        <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 2 }}>Precio por cada Envase (€)</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="5.50"
                          value={envaseForm.precioPorEnvase}
                          onChange={e => setEnvaseForm({ ...envaseForm, precioPorEnvase: Number(e.target.value) || 0 })}
                          style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "0.45rem", color: "#fff", fontSize: 12 }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleApplyEnvaseConversion}
                        style={{
                          background: "linear-gradient(135deg, #c9a84c, #eab308)",
                          color: "#000",
                          border: "none",
                          borderRadius: 6,
                          padding: "0.5rem 0.75rem",
                          fontWeight: 800,
                          fontSize: 12,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 5
                        }}
                      >
                        <Sparkles size={14} /> Aplicar al Formulario
                      </button>
                    </div>

                    {/* Tarjeta resumen de la conversión */}
                    <div style={{ background: "rgba(0,0,0,0.35)", borderRadius: 8, padding: "0.5rem 0.75rem", borderLeft: "3px solid #eab308", fontSize: 11.5 }}>
                      <div style={{ color: "#fff", fontWeight: 700 }}>
                        Stock resultante: <span style={{ color: "#4ade80" }}>{envaseConversionPreview.cantidadTotal} {envaseConversionPreview.unidadBase}</span> &nbsp;|&nbsp; Coste real: <span style={{ color: "#eab308" }}>{envaseConversionPreview.costeUnitarioBase} € / {envaseConversionPreview.unidadBase}</span>
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 2 }}>
                        {envaseConversionPreview.descripcion}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase" }}>
                    Existencias en Almacén ({itemForm.unidad || "ud"})
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={itemForm.cantidadActual}
                    onChange={e => setItemForm({ ...itemForm, cantidadActual: e.target.value })}
                    style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase" }}>Stock Mínimo (Alerta)</label>
                  <input
                    type="number"
                    step="any"
                    value={itemForm.stockMinimo}
                    onChange={e => setItemForm({ ...itemForm, stockMinimo: e.target.value })}
                    style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase" }}>
                    Coste Unitario (€ / {itemForm.unidad || "ud"})
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={itemForm.costeUnitario}
                    onChange={e => setItemForm({ ...itemForm, costeUnitario: e.target.value })}
                    style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
                  />
                  <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", marginTop: 2, display: "block" }}>
                    {itemForm.unidad === "g" ? "Precio por gramo (ej. 0.0183)" : itemForm.unidad === "kg" ? "Precio por kilogramo" : itemForm.unidad === "ml" ? "Precio por mililitro" : "Precio por unidad"}
                  </span>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase" }}>Proveedor Habitual</label>
                  <input
                    type="text"
                    placeholder="Ej. Pescados del Puerto"
                    value={itemForm.proveedorHabitual}
                    onChange={e => setItemForm({ ...itemForm, proveedorHabitual: e.target.value })}
                    style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setModalItemOpen(false)}
                  style={{ padding: "0.65rem 1rem", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 13, cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: "0.65rem 1.25rem", background: "#ef4444", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  Guardar Ingrediente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL: REGISTRAR FACTURA DE COMPRA
      ───────────────────────────────────────────────────────────────────────────── */}
      {modalFacturaOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{
            background: "#13141a",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 16,
            width: "100%",
            maxWidth: previewUrl ? 1440 : 680,
            height: previewUrl ? "92vh" : "auto",
            maxHeight: "94vh",
            display: "flex",
            flexDirection: "column",
            padding: "1.25rem 1.5rem",
            overflow: "hidden",
            boxShadow: "0 25px 60px rgba(0,0,0,0.75)"
          }}>
            {/* Cabecera del Modal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.85rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                  Registrar Factura de Proveedor
                  <span style={{ fontSize: 11, background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                    IA Auto-Fill Progresivo
                  </span>
                  {previewUrl && (
                    <span style={{ fontSize: 11, background: "rgba(201,168,76,0.15)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.3)", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                      Visor Comparador Activo
                    </span>
                  )}
                </h3>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                  {previewUrl
                    ? "Compara el documento original a la izquierda con los datos extraídos en vivo a la derecha."
                    : "Sube un archivo PDF (hasta 10 páginas) o foto. La IA extraerá los datos en vivo hoja por hoja."}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {previewUrl && (
                  <>
                    <button
                      type="button"
                      onClick={() => document.getElementById("invoice-photo-input")?.click()}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                        color: "#fff", borderRadius: 8, padding: "0.45rem 0.75rem", fontSize: 12, fontWeight: 600, cursor: "pointer"
                      }}
                      title="Subir otro archivo"
                    >
                      <RefreshCw size={13} /> Cambiar Archivo
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(previewUrl, "_blank")}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                        color: "#fff", borderRadius: 8, padding: "0.45rem 0.75rem", fontSize: 12, fontWeight: 600, cursor: "pointer"
                      }}
                      title="Abrir documento original en pestaña nueva"
                    >
                      <ExternalLink size={13} /> Pantalla Completa
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={closeModalFactura}
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Input de archivo oculto */}
            <input
              type="file"
              id="invoice-photo-input"
              accept="image/*,application/pdf,.pdf"
              disabled={scanningFactura}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleScanInvoiceFile(file);
                  e.target.value = "";
                }
              }}
              style={{ display: "none" }}
            />

            {/* VISTA 1: AÚN NO SE HA SUBIDO DOCUMENTO (Selector de Archivo destacado) */}
            {!previewUrl ? (
              <div style={{ padding: "1.75rem 0 0.5rem" }}>
                <div style={{
                  background: "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(201,168,76,0.08) 100%)",
                  border: "2px dashed rgba(239,68,68,0.4)",
                  borderRadius: 14,
                  padding: "2.5rem 1.5rem",
                  textAlign: "center",
                  cursor: "pointer",
                }}
                onClick={() => document.getElementById("invoice-photo-input")?.click()}
                >
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <span style={{ padding: 12, borderRadius: "50%", background: "rgba(239,68,68,0.15)", color: "#ef4444", display: "inline-flex" }}>
                      <Camera size={26} />
                    </span>
                    <span style={{ padding: 12, borderRadius: "50%", background: "rgba(201,168,76,0.15)", color: "#c9a84c", display: "inline-flex" }}>
                      <Sparkles size={26} />
                    </span>
                  </div>
                  <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#fff" }}>
                    📄 Selecciona tu Factura o Ticket (PDF multipágina o Foto)
                  </h4>
                  <p style={{ margin: "0 auto 16px", maxWidth: 460, fontSize: 12.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                    Admite archivos PDF de hasta 10 páginas, fotos JPG y PNG. Se abrirá el <strong>comparador visual a dos columnas</strong> y la IA irá volcando los artículos en vivo en pantalla.
                  </p>
                  <button
                    type="button"
                    style={{
                      background: "#ef4444", color: "#fff", border: "none",
                      borderRadius: 8, padding: "0.65rem 1.4rem", fontSize: 13, fontWeight: 700,
                      cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6
                    }}
                  >
                    <Upload size={16} /> Seleccionar Archivo
                  </button>
                </div>

                <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => setPreviewUrl("manual")}
                    style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
                  >
                    O introducir datos manualmente sin documento adjunto
                  </button>
                </div>
              </div>
            ) : (
              /* VISTA 2: COMPARADOR A 2 COLUMNAS (DOCUMENTO A LA IZQUIERDA + FORMULARIO A LA DERECHA) */
              <div style={{
                display: "grid",
                gridTemplateColumns: previewUrl === "manual" ? "1fr" : "1.05fr 1fr",
                gap: "1.25rem",
                flex: 1,
                minHeight: 0,
                marginTop: "1rem"
              }}>
                {/* ──────────────── COLUMNA 1: VISOR DEL DOCUMENTO ORIGINAL ──────────────── */}
                {previewUrl !== "manual" && (
                  <div style={{
                    background: "#0c0d12",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                    overflow: "hidden"
                  }}>
                    {/* Barra de título del visor */}
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "0.55rem 0.85rem", background: "rgba(255,255,255,0.03)",
                      borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 12
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#f3ede0", fontWeight: 600 }}>
                        <FileText size={14} color="#c9a84c" />
                        <span style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {previewFileName || "Factura original"}
                        </span>
                      </div>
                      <span style={{
                        fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                        background: "rgba(201,168,76,0.15)", color: "#c9a84c"
                      }}>
                        {totalScanPages > 0 ? `${totalScanPages} ${totalScanPages === 1 ? "Pág" : "Págs"}` : "Visor"}
                      </span>
                    </div>

                    {/* Cuerpo del visor: iframe nativo para PDF o imagen para fotos */}
                    <div style={{ flex: 1, minHeight: 0, position: "relative", background: "#181920" }}>
                      {previewType.includes("pdf") || (previewFileName && previewFileName.toLowerCase().endsWith(".pdf")) ? (
                        <iframe
                          src={previewUrl}
                          title="Visor Factura PDF"
                          style={{
                            width: "100%",
                            height: "100%",
                            border: "none",
                            background: "#22232a",
                            display: "block"
                          }}
                        />
                      ) : (
                        <div style={{
                          width: "100%",
                          height: "100%",
                          overflow: "auto",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "flex-start",
                          padding: "1rem"
                        }}>
                          <img
                            src={previewUrl}
                            alt="Factura original"
                            style={{ maxWidth: "100%", height: "auto", borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.6)" }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ──────────────── COLUMNA 2: DATOS Y ARTÍCULOS EN VIVO ──────────────── */}
                <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
                  {/* Banner de Estado Progresivo en Tiempo Real */}
                  {scanningFactura ? (
                    <div style={{
                      background: "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(201,168,76,0.15) 100%)",
                      border: "1px solid rgba(239,68,68,0.35)",
                      borderRadius: 10,
                      padding: "0.75rem 1rem",
                      marginBottom: "0.85rem",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Loader2 size={16} className="animate-spin" style={{ color: "#ef4444" }} />
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>
                            {scanMessage || `Leyendo Página ${currentScanPage} de ${totalScanPages}...`}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", background: "rgba(74,222,128,0.15)", padding: "2px 8px", borderRadius: 10 }}>
                          +{facturaForm.items.length} artículos detectados
                        </span>
                      </div>
                      {/* Barra de progreso */}
                      <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{
                          width: `${Math.max(10, (currentScanPage / (totalScanPages || 1)) * 100)}%`,
                          height: "100%",
                          background: "linear-gradient(90deg, #c81e22, #c9a84c)",
                          borderRadius: 2,
                          transition: "width 0.4s ease-out"
                        }} />
                      </div>
                    </div>
                  ) : facturaForm.items.length > 0 && (
                    <div style={{
                      background: "rgba(74,222,128,0.08)",
                      border: "1px solid rgba(74,222,128,0.25)",
                      borderRadius: 10,
                      padding: "0.6rem 0.85rem",
                      marginBottom: "0.85rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: "#4ade80",
                      fontWeight: 600
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <CheckCircle2 size={15} />
                        <span>Lectura finalizada ({totalScanPages > 1 ? `${totalScanPages} páginas` : "1 página"}). Coteja los datos con el documento de la izquierda.</span>
                      </div>
                      <span style={{ fontWeight: 800 }}>{facturaForm.items.length} líneas</span>
                    </div>
                  )}

                  {/* Formulario de Factura (Desplazable verticalmente) */}
                  <form
                    onSubmit={handleSaveFactura}
                    style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
                  >
                    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 6 }}>
                      {/* Datos de Cabecera */}
                      <div style={{ background: "#1c1d24", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "0.85rem", marginBottom: "0.85rem" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr", gap: "0.65rem", marginBottom: "0.65rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: 10.5, color: "rgba(255,255,255,0.45)", marginBottom: 3, textTransform: "uppercase" }}>Nº Factura / Albarán *</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. F-2026-001"
                              value={facturaForm.numeroFactura}
                              onChange={e => setFacturaForm({ ...facturaForm, numeroFactura: e.target.value })}
                              style={{ width: "100%", background: "#14151a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "0.5rem", color: "#fff", fontSize: 12.5, boxSizing: "border-box" }}
                            />
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: 10.5, color: "rgba(255,255,255,0.45)", marginBottom: 3, textTransform: "uppercase" }}>Proveedor *</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. Pescados del Puerto S.L."
                              value={facturaForm.proveedor}
                              onChange={e => setFacturaForm({ ...facturaForm, proveedor: e.target.value })}
                              style={{ width: "100%", background: "#14151a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "0.5rem", color: "#fff", fontSize: 12.5, boxSizing: "border-box" }}
                            />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.65rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: 10.5, color: "rgba(255,255,255,0.45)", marginBottom: 3, textTransform: "uppercase" }}>CIF / NIF</label>
                            <input
                              type="text"
                              placeholder="B12345678"
                              value={facturaForm.cifProveedor}
                              onChange={e => setFacturaForm({ ...facturaForm, cifProveedor: e.target.value })}
                              style={{ width: "100%", background: "#14151a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "0.5rem", color: "#fff", fontSize: 12.5, boxSizing: "border-box" }}
                            />
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: 10.5, color: "rgba(255,255,255,0.45)", marginBottom: 3, textTransform: "uppercase" }}>Fecha Emisión *</label>
                            <input
                              type="date"
                              required
                              value={facturaForm.fechaEmision}
                              onChange={e => setFacturaForm({ ...facturaForm, fechaEmision: e.target.value })}
                              style={{ width: "100%", background: "#14151a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "0.5rem", color: "#fff", fontSize: 12.5, boxSizing: "border-box" }}
                            />
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: 10.5, color: "rgba(255,255,255,0.45)", marginBottom: 3, textTransform: "uppercase" }}>Estado Pago</label>
                            <select
                              value={facturaForm.estadoPago}
                              onChange={e => setFacturaForm({ ...facturaForm, estadoPago: e.target.value })}
                              style={{ width: "100%", background: "#14151a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "0.5rem", color: "#fff", fontSize: 12.5, boxSizing: "border-box" }}
                            >
                              <option value="pagado">Pagado</option>
                              <option value="pendiente">Pendiente</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Lista de Líneas de Factura (Artículos Extraídos en Vivo) */}
                      <div style={{ marginBottom: "0.85rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <label style={{ fontSize: 12, fontWeight: 800, color: "#f3ede0", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                            <span>Líneas de Compra ({facturaForm.items.length})</span>
                            {scanningFactura && <span style={{ fontSize: 11, color: "#c9a84c", fontWeight: 600 }}>• Añadiendo en vivo...</span>}
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setFacturaForm({
                                ...facturaForm,
                                items: [...facturaForm.items, { descripcion: "", stockItemId: "", cantidad: 1, unidad: "kg", precioUnitario: 0, ivaPct: 10 }]
                              });
                            }}
                            style={{ background: "none", border: "none", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                          >
                            + Añadir línea manual
                          </button>
                        </div>

                        {facturaForm.items.length === 0 && (
                          <div style={{ background: "#1c1d24", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 10, padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                            {scanningFactura ? "Leyendo el documento... Los productos aparecerán aquí en vivo." : "No hay líneas añadidas. Sube una factura o añade una línea manualmente."}
                          </div>
                        )}

                        {facturaForm.items.map((line: any, idx: number) => (
                          <div key={idx} style={{
                            background: "#1c1d24",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: 8,
                            padding: "0.75rem",
                            marginBottom: "0.45rem",
                            transition: "all 0.2s ease"
                          }}>
                            {/* Fila 1: Nombre en factura + Ingrediente vinculado */}
                            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr", gap: "0.5rem", marginBottom: "0.45rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Producto según Factura</label>
                                <input
                                  type="text"
                                  placeholder="Ej. Salmón Noruego Fresco"
                                  value={line.descripcion}
                                  onChange={e => {
                                    const newItems = [...facturaForm.items];
                                    newItems[idx].descripcion = e.target.value;
                                    setFacturaForm({ ...facturaForm, items: newItems });
                                  }}
                                  style={{ width: "100%", background: "#14151a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "0.45rem", color: "#fff", fontSize: 12, boxSizing: "border-box" }}
                                />
                              </div>

                              <div>
                                <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Asociar a Almacén</label>
                                <select
                                  value={line.stockItemId}
                                  onChange={e => {
                                    const newItems = [...facturaForm.items];
                                    newItems[idx].stockItemId = e.target.value;
                                    const found = stockItems.find(x => x.id === Number(e.target.value));
                                    if (found && !newItems[idx].descripcion) {
                                      newItems[idx].descripcion = found.nombre;
                                      newItems[idx].unidad = found.unidad;
                                    }
                                    setFacturaForm({ ...facturaForm, items: newItems });
                                  }}
                                  style={{
                                    width: "100%", background: "#14151a",
                                    border: line.stockItemId ? "1px solid rgba(74,222,128,0.4)" : "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: 6, padding: "0.45rem",
                                    color: line.stockItemId ? "#4ade80" : "#fff",
                                    fontSize: 12, boxSizing: "border-box"
                                  }}
                                >
                                  <option value="">(Gasto general / Sin stock)</option>
                                  {stockItems.map(s => (
                                    <option key={s.id} value={s.id}>
                                      {s.nombre} ({s.unidad})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Fila 2: Cantidad, Unidad, Precio Unitario, Subtotal y Borrar */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr 1fr auto", gap: "0.45rem", alignItems: "flex-end" }}>
                              <div>
                                <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Cantidad</label>
                                <input
                                  type="number"
                                  step="any"
                                  value={line.cantidad}
                                  onChange={e => {
                                    const newItems = [...facturaForm.items];
                                    newItems[idx].cantidad = e.target.value;
                                    setFacturaForm({ ...facturaForm, items: newItems });
                                  }}
                                  style={{ width: "100%", background: "#14151a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "0.45rem", color: "#fff", fontSize: 12, boxSizing: "border-box" }}
                                />
                              </div>

                              <div>
                                <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Unidad</label>
                                <input
                                  type="text"
                                  value={line.unidad}
                                  onChange={e => {
                                    const newItems = [...facturaForm.items];
                                    newItems[idx].unidad = e.target.value;
                                    setFacturaForm({ ...facturaForm, items: newItems });
                                  }}
                                  style={{ width: "100%", background: "#14151a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "0.45rem", color: "#fff", fontSize: 12, boxSizing: "border-box" }}
                                />
                              </div>

                              <div>
                                <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>P. Unitario (€)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={line.precioUnitario}
                                  onChange={e => {
                                    const newItems = [...facturaForm.items];
                                    newItems[idx].precioUnitario = e.target.value;
                                    setFacturaForm({ ...facturaForm, items: newItems });
                                  }}
                                  style={{ width: "100%", background: "#14151a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "0.45rem", color: "#fff", fontSize: 12, boxSizing: "border-box" }}
                                />
                              </div>

                              <div>
                                <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Subtotal</label>
                                <div style={{ padding: "0.45rem 0", fontWeight: 700, color: "#4ade80", fontSize: 12.5 }}>
                                  {(Number(line.cantidad || 0) * Number(line.precioUnitario || 0)).toFixed(2)} €
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const newItems = facturaForm.items.filter((_: any, i: number) => i !== idx);
                                  setFacturaForm({ ...facturaForm, items: newItems });
                                }}
                                style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", padding: "0.45rem 0.25rem" }}
                                title="Eliminar línea"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Resumen de Totales y Botón de Guardado */}
                    <div style={{
                      paddingTop: "0.75rem",
                      borderTop: "1px solid rgba(255,255,255,0.08)",
                      background: "#13141a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Gasto sin IVA (Base)</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>
                            {baseImponible.toFixed(2)} €
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Importe IVA</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "#a1a1aa" }}>
                            {totalIva.toFixed(2)} €
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Total con IVA</div>
                          <div style={{ fontSize: 16, fontWeight: 900, color: "#4ade80" }}>
                            {totalFactura.toFixed(2)} €
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          type="button"
                          onClick={closeModalFactura}
                          style={{ padding: "0.6rem 1rem", background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#fff", fontSize: 12.5, cursor: "pointer" }}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={facturaForm.items.length === 0 || savingFactura}
                          style={{
                            padding: "0.6rem 1.3rem",
                            background: facturaForm.items.length === 0 || savingFactura ? "rgba(255,255,255,0.1)" : "#16a34a",
                            border: "none", borderRadius: 8, color: "#fff", fontSize: 12.5, fontWeight: 700,
                            cursor: facturaForm.items.length === 0 || savingFactura ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", gap: 6
                          }}
                        >
                          {savingFactura ? (
                            <>
                              <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Guardando e ingresando stock...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={15} /> Guardar Factura e Ingresar Stock
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL: REGISTRAR MERMA
      ───────────────────────────────────────────────────────────────────────────── */}
      {modalMermaOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#14151a", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 16, width: "100%", maxWidth: 480, padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#ef4444" }}>
                Registrar Merma / Desperdicio
              </h3>
              <button onClick={() => setModalMermaOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMerma} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase" }}>Ingrediente Tirado *</label>
                <select
                  required
                  value={mermaForm.stockItemId}
                  onChange={e => setMermaForm({ ...mermaForm, stockItemId: e.target.value })}
                  style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
                >
                  <option value="">Selecciona ingrediente...</option>
                  {stockItems.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre} ({s.cantidadActual} {s.unidad} disponibles)</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase" }}>Cantidad a Restar *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.5"
                    value={mermaForm.cantidad}
                    onChange={e => setMermaForm({ ...mermaForm, cantidad: e.target.value })}
                    style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase" }}>Motivo del Desperdicio *</label>
                  <select
                    value={mermaForm.motivo}
                    onChange={e => setMermaForm({ ...mermaForm, motivo: e.target.value })}
                    style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
                  >
                    {MOTIVOS_MERMA.map(m => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase" }}>Explicación / Detalle (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Ej. Se dejó fuera de la cámara o lomo con exceso de grasa no aprovechable"
                  value={mermaForm.notas}
                  onChange={e => setMermaForm({ ...mermaForm, notas: e.target.value })}
                  style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setModalMermaOpen(false)}
                  style={{ padding: "0.65rem 1rem", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 13, cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: "0.65rem 1.25rem", background: "#ef4444", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  Confirmar Pérdida y Descontar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL: VINCULAR INGREDIENTE A ESCANDALLO DE PLATO
      ───────────────────────────────────────────────────────────────────────────── */}
      {modalEscandalloOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#14151a", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 16, width: "100%", maxWidth: 480, padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#c9a84c" }}>
                Vincular Ingrediente a Receta (Escandallo)
              </h3>
              <button onClick={() => setModalEscandalloOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEscandallo} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase" }}>Plato de la Carta *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Uramaki Salmón Philadelphia"
                  value={escandalloForm.platoNombre}
                  onChange={e => setEscandalloForm({ ...escandalloForm, platoNombre: e.target.value })}
                  style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase" }}>Ingrediente que utiliza *</label>
                <select
                  required
                  value={escandalloForm.stockItemId}
                  onChange={e => {
                    const found = stockItems.find(x => x.id === Number(e.target.value));
                    setEscandalloForm({
                      ...escandalloForm,
                      stockItemId: e.target.value,
                      unidad: found ? (found.unidad === "kg" ? "g" : found.unidad) : "g"
                    });
                  }}
                  style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
                >
                  <option value="">Selecciona ingrediente del almacén...</option>
                  {stockItems.map(s => {
                    const pTxt = s.costeUnitario < 0.1 ? s.costeUnitario.toFixed(4) : s.costeUnitario.toFixed(2);
                    return (
                      <option key={s.id} value={s.id}>{s.nombre} ({pTxt} €/{s.unidad})</option>
                    );
                  })}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase" }}>Cantidad por Ración *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="20"
                    value={escandalloForm.cantidad}
                    onChange={e => setEscandalloForm({ ...escandalloForm, cantidad: e.target.value })}
                    style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase" }}>Unidad en la Receta *</label>
                  <select
                    value={escandalloForm.unidad}
                    onChange={e => setEscandalloForm({ ...escandalloForm, unidad: e.target.value })}
                    style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
                  >
                    <option value="g">Gramos (g)</option>
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="cl">Centilitros (cl)</option>
                    <option value="l">Litros (l)</option>
                    <option value="ud">Unidades / Piezas (ud)</option>
                    <option value="botella">Botella</option>
                    <option value="lata">Lata</option>
                    <option value="bote">Bote</option>
                  </select>
                </div>
              </div>

              {/* Vista previa en tiempo real del coste de la ración */}
              {selectedStockForEscandallo && (
                <div style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 10, padding: "0.75rem 1rem" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                    Coste Calculado de esta Ración en el Plato
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#eab308", marginTop: 2, display: "flex", alignItems: "baseline", gap: 6 }}>
                    {costeEstimadoEscandallo.toFixed(3)} €
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 400 }}>
                      ({escandalloForm.cantidad || 0} {escandalloForm.unidad} de ingrediente guardado en {selectedStockForEscandallo.unidad})
                    </span>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setModalEscandalloOpen(false)}
                  style={{ padding: "0.65rem 1rem", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 13, cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: "0.65rem 1.25rem", background: "#c9a84c", border: "none", borderRadius: 8, color: "#000", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
                >
                  Guardar en Receta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

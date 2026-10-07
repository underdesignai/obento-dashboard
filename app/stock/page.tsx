"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Boxes, Plus, Trash2, Pencil, Search, AlertTriangle,
  Receipt, TrendingUp, TrendingDown, ArrowDownRight,
  ArrowUpRight, DollarSign, Package, FileText, CheckCircle2,
  Calendar, Layers, Filter, Eye, RefreshCw, X, Camera, Sparkles, Upload, Loader2
} from "lucide-react";

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
    stockMinimo: 5,
    costeUnitario: "",
    proveedorHabitual: "",
    notas: ""
  });

  const [modalFacturaOpen, setModalFacturaOpen] = useState(false);
  const [scanningFactura, setScanningFactura] = useState(false);
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

  // Escanear Factura con Foto o PDF (IA Vision & OCR)
  const handleScanInvoiceFile = async (file: File) => {
    if (!file) return;
    setScanningFactura(true);
    setScanMessage("Analizando factura con IA y OCR...");
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/admin/facturas/scan", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (res.ok && data.factura) {
        const f = data.factura;
        setFacturaForm((prev: any) => ({
          ...prev,
          numeroFactura: f.numeroFactura || prev.numeroFactura,
          proveedor: f.proveedor || prev.proveedor,
          cifProveedor: f.cifProveedor || prev.cifProveedor,
          fechaEmision: f.fechaEmision || prev.fechaEmision,
          items: f.items && f.items.length > 0 ? f.items : prev.items,
        }));
        setScanMessage(
          data.method === "ai_vision"
            ? "¡Factura leída con IA y todos los campos rellenados!"
            : "¡Datos extraídos con éxito mediante OCR!"
        );
        setTimeout(() => setScanMessage(""), 4500);
      } else {
        setScanMessage("No se pudieron extraer datos automáticos: " + (data.error || "Intente con otra foto"));
        setTimeout(() => setScanMessage(""), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setScanMessage("Error procesando imagen: " + (err?.message || ""));
      setTimeout(() => setScanMessage(""), 4000);
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
    stockItemId: "",
    cantidad: 0.100,
    unidad: "kg",
    notas: ""
  });

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

  // Guardar factura
  const handleSaveFactura = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/facturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(facturaForm),
      });
      if (res.ok) {
        setModalFacturaOpen(false);
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
        loadData();
      }
    } catch (e) {
      console.error(e);
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
                cantidadActual: "", stockMinimo: 5, costeUnitario: "", proveedorHabitual: "", notas: ""
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
                    const isBajo = item.cantidadActual <= item.stockMinimo;
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
                            <span style={{ fontWeight: 800, fontSize: 14, color: isBajo ? "#ef4444" : "#f3ede0" }}>
                              {item.cantidadActual} {item.unidad}
                            </span>
                            {isBajo && (
                              <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(239,68,68,0.2)", color: "#ef4444", padding: "2px 5px", borderRadius: 4 }}>
                                BAJO
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "0.85rem 1rem", color: "rgba(255,255,255,0.5)" }}>
                          {item.stockMinimo} {item.unidad}
                        </td>
                        <td style={{ padding: "0.85rem 1rem", fontWeight: 600, color: "#c9a84c" }}>
                          {item.costeUnitario.toFixed(2)} € / {item.unidad}
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
                    <th style={{ padding: "0.85rem 1rem" }}>Base Imponible</th>
                    <th style={{ padding: "0.85rem 1rem" }}>IVA</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Total Factura</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Estado</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Líneas de Compra</th>
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
                      <td style={{ padding: "0.85rem 1rem", color: "rgba(255,255,255,0.8)" }}>
                        {f.totalBase.toFixed(2)} €
                      </td>
                      <td style={{ padding: "0.85rem 1rem", color: "rgba(255,255,255,0.5)" }}>
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
                      <td style={{ padding: "0.85rem 1rem", color: "rgba(255,255,255,0.6)" }}>
                        {f.items?.length || 0} artículos añadidos a stock
                      </td>
                    </tr>
                  ))}
                  {facturas.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: "2.5rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                        No hay facturas registradas todavía. Pulsa en "Subir Factura / Compra" para registrar tu primera factura.
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
                      {plato.ingredientes.map((ing: any) => (
                        <div key={ing.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.75)", background: "rgba(255,255,255,0.02)", padding: "4px 8px", borderRadius: 6 }}>
                          <span>{ing.stockItem?.nombre || "Ingrediente"}</span>
                          <span style={{ fontWeight: 600 }}>{ing.cantidad} {ing.unidad} (~{(ing.cantidad * (ing.stockItem?.costeUnitario || 0)).toFixed(2)}€)</span>
                        </div>
                      ))}
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
                      cantidad: 0.080,
                      unidad: "kg",
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#14151a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, width: "100%", maxWidth: 500, padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#fff" }}>
                {itemForm.id ? "Editar Ingrediente de Almacén" : "Nuevo Ingrediente de Almacén"}
              </h3>
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
                  <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase" }}>Unidad de Medida *</label>
                  <select
                    value={itemForm.unidad}
                    onChange={e => setItemForm({ ...itemForm, unidad: e.target.value })}
                    style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
                  >
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="g">Gramos (g)</option>
                    <option value="l">Litros (l)</option>
                    <option value="unidad">Unidades (ud)</option>
                    <option value="caja">Cajas</option>
                    <option value="paquete">Paquetes</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase" }}>Cantidad Inicial</label>
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
                  <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase" }}>Coste Unitario (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={itemForm.costeUnitario}
                    onChange={e => setItemForm({ ...itemForm, costeUnitario: e.target.value })}
                    style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
                  />
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#14151a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, width: "100%", maxWidth: 680, padding: "1.75rem", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                  Registrar Factura de Proveedor
                  <span style={{ fontSize: 11, background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                    IA Auto-Fill
                  </span>
                </h3>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                  Sube una foto o ticket y la IA rellenará automáticamente todos los datos y artículos.
                </p>
              </div>
              <button onClick={() => setModalFacturaOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {/* SECCIÓN IA / ESCANEAR FOTO DE FACTURA */}
            <div style={{
              background: "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(201,168,76,0.08) 100%)",
              border: "1px dashed rgba(239,68,68,0.35)",
              borderRadius: 12,
              padding: "1rem",
              marginBottom: "1.25rem",
              textAlign: "center",
              position: "relative"
            }}>
              <input
                type="file"
                id="invoice-photo-input"
                accept="image/*,application/pdf"
                capture="environment"
                disabled={scanningFactura}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleScanInvoiceFile(file);
                }}
                style={{ display: "none" }}
              />

              <label
                htmlFor="invoice-photo-input"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  cursor: scanningFactura ? "not-allowed" : "pointer",
                  padding: "0.5rem"
                }}
              >
                {scanningFactura ? (
                  <>
                    <Loader2 size={32} className="animate-spin" style={{ color: "#ef4444" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#f3ede0" }}>
                      Analizando factura con Inteligencia Artificial...
                    </span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                      Detectando proveedor, importes, cantidades y asociando al stock
                    </span>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ padding: 10, borderRadius: "50%", background: "rgba(239,68,68,0.15)", color: "#ef4444", display: "inline-flex" }}>
                        <Camera size={22} />
                      </span>
                      <span style={{ padding: 10, borderRadius: "50%", background: "rgba(201,168,76,0.15)", color: "#c9a84c", display: "inline-flex" }}>
                        <Sparkles size={22} />
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", display: "block" }}>
                        📷 Haz una foto o sube el ticket/factura
                      </span>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                        La IA extraerá proveedor, fecha, base, IVA y todas las líneas automáticamente
                      </span>
                    </div>
                    <span style={{
                      marginTop: 4,
                      background: "#ef4444",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "5px 14px",
                      borderRadius: 6,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5
                    }}>
                      <Upload size={14} /> Seleccionar Foto o Archivo
                    </span>
                  </>
                )}
              </label>

              {scanMessage && (
                <div style={{
                  marginTop: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: scanMessage.includes("éxito") || scanMessage.includes("leída") ? "#4ade80" : "#facc15"
                }}>
                  {scanMessage}
                </div>
              )}
            </div>

            <form onSubmit={handleSaveFactura} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase" }}>Nº Factura *</label>
                  <input
                    type="text"
                    required
                    placeholder="FAC-2026-001"
                    value={facturaForm.numeroFactura}
                    onChange={e => setFacturaForm({ ...facturaForm, numeroFactura: e.target.value })}
                    style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase" }}>Proveedor *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Pescados del Puerto S.L."
                    value={facturaForm.proveedor}
                    onChange={e => setFacturaForm({ ...facturaForm, proveedor: e.target.value })}
                    style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase" }}>Fecha de Emisión *</label>
                  <input
                    type="date"
                    required
                    value={facturaForm.fechaEmision}
                    onChange={e => setFacturaForm({ ...facturaForm, fechaEmision: e.target.value })}
                    style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase" }}>Estado de Pago</label>
                  <select
                    value={facturaForm.estadoPago}
                    onChange={e => setFacturaForm({ ...facturaForm, estadoPago: e.target.value })}
                    style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
                  >
                    <option value="pagado">Pagado</option>
                    <option value="pendiente">Pendiente de Pago</option>
                  </select>
                </div>
              </div>

              {/* Líneas de Factura */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#f3ede0", textTransform: "uppercase" }}>
                    Líneas de la Factura (Entradas al Almacén)
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
                    + Añadir otra línea
                  </button>
                </div>

                {facturaForm.items.map((line: any, idx: number) => (
                  <div key={idx} style={{ background: "#1c1d24", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "0.85rem", marginBottom: "0.5rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Descripción / Concepto</label>
                        <input
                          type="text"
                          placeholder="Ej. Salmón Noruego Fresco"
                          value={line.descripcion}
                          onChange={e => {
                            const newItems = [...facturaForm.items];
                            newItems[idx].descripcion = e.target.value;
                            setFacturaForm({ ...facturaForm, items: newItems });
                          }}
                          style={{ width: "100%", background: "#14151a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "0.5rem", color: "#fff", fontSize: 12, boxSizing: "border-box" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Asociar a Ingrediente de Stock</label>
                        <select
                          value={line.stockItemId}
                          onChange={e => {
                            const newItems = [...facturaForm.items];
                            newItems[idx].stockItemId = e.target.value;
                            // Pre-llenar descripción si está vacía
                            const found = stockItems.find(x => x.id === Number(e.target.value));
                            if (found && !newItems[idx].descripcion) {
                              newItems[idx].descripcion = found.nombre;
                              newItems[idx].unidad = found.unidad;
                            }
                            setFacturaForm({ ...facturaForm, items: newItems });
                          }}
                          style={{ width: "100%", background: "#14151a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "0.5rem", color: "#fff", fontSize: 12, boxSizing: "border-box" }}
                        >
                          <option value="">(No sumar a stock / Gasto general)</option>
                          {stockItems.map(s => (
                            <option key={s.id} value={s.id}>{s.nombre} ({s.unidad})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "0.5rem", alignItems: "flex-end" }}>
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
                          style={{ width: "100%", background: "#14151a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "0.5rem", color: "#fff", fontSize: 12, boxSizing: "border-box" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Precio Unitario (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={line.precioUnitario}
                          onChange={e => {
                            const newItems = [...facturaForm.items];
                            newItems[idx].precioUnitario = e.target.value;
                            setFacturaForm({ ...facturaForm, items: newItems });
                          }}
                          style={{ width: "100%", background: "#14151a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "0.5rem", color: "#fff", fontSize: 12, boxSizing: "border-box" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Subtotal (€)</label>
                        <div style={{ padding: "0.5rem", fontWeight: 700, color: "#4ade80", fontSize: 13 }}>
                          {(Number(line.cantidad || 0) * Number(line.precioUnitario || 0)).toFixed(2)} €
                        </div>
                      </div>

                      {facturaForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = facturaForm.items.filter((_: any, i: number) => i !== idx);
                            setFacturaForm({ ...facturaForm, items: newItems });
                          }}
                          style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", padding: "0.5rem" }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setModalFacturaOpen(false)}
                  style={{ padding: "0.65rem 1rem", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 13, cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: "0.65rem 1.25rem", background: "#16a34a", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  Registrar Factura y Actualizar Stock
                </button>
              </div>
            </form>
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
                      unidad: found ? found.unidad : "kg"
                    });
                  }}
                  style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
                >
                  <option value="">Selecciona ingrediente del almacén...</option>
                  {stockItems.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre} ({s.costeUnitario.toFixed(2)} €/{s.unidad})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase" }}>Cantidad por Ración *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.080"
                    value={escandalloForm.cantidad}
                    onChange={e => setEscandalloForm({ ...escandalloForm, cantidad: e.target.value })}
                    style={{ width: "100%", background: "#1c1d24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem", color: "#fff", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase" }}>Unidad</label>
                  <input
                    type="text"
                    readOnly
                    value={escandalloForm.unidad}
                    style={{ width: "100%", background: "#14151a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.65rem", color: "rgba(255,255,255,0.7)", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>
              </div>

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

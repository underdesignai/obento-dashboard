import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

export async function GET() {
  if (!(await getSessionRole())) return deny403();
  try {
    const facturas = await prisma.factura.findMany({
      include: {
        items: {
          include: {
            stockItem: {
              select: { id: true, nombre: true, unidad: true, categoria: true },
            },
          },
        },
      },
      orderBy: { fechaEmision: "desc" },
    });

    const totalGastado = facturas.reduce((acc, f) => acc + f.totalFactura, 0);
    const facturasPendientes = facturas.filter(f => f.estadoPago === "pendiente").length;

    return Response.json({
      facturas,
      stats: {
        totalFacturas: facturas.length,
        totalGastoCompras: Number(totalGastado.toFixed(2)),
        facturasPendientes,
      },
    });
  } catch (e) {
    console.error("[facturas GET]", e);
    return Response.json({ error: "Error al cargar facturas" }, { status: 500 });
  }
}

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

function inferStockCategory(nombre: string): string {
  const n = (nombre || "").toLowerCase();
  if (n.includes("salm") || n.includes("atun") || n.includes("pez") || n.includes("pescad") || n.includes("langost") || n.includes("gamba") || n.includes("pulpo") || n.includes("calamar") || n.includes("dorada") || n.includes("lubina") || n.includes("anguila")) return "Pescados y Mariscos";
  if (n.includes("pollo") || n.includes("ternera") || n.includes("cerdo") || n.includes("pato") || n.includes("buey") || n.includes("carne")) return "Carnes y Aves";
  if (n.includes("arroz") || n.includes("grano") || n.includes("harina") || n.includes("semola")) return "Arroz y Granos";
  if (n.includes("nori") || n.includes("alga") || n.includes("wakame") || n.includes("kombu")) return "Algas y Nori";
  if (n.includes("soja") || n.includes("salsa") || n.includes("vinagre") || n.includes("mirin") || n.includes("aceite") || n.includes("sesamo") || n.includes("wasabi") || n.includes("jengibre") || n.includes("curry") || n.includes("miso")) return "Salsas y Condimentos";
  if (n.includes("aguacate") || n.includes("pepino") || n.includes("ceboll") || n.includes("zanahoria") || n.includes("edamame") || n.includes("tomate") || n.includes("lechuga") || n.includes("verdura") || n.includes("seta") || n.includes("champ")) return "Verduras y Frescos";
  if (n.includes("caja") || n.includes("bolsa") || n.includes("palillo") || n.includes("envase") || n.includes("tapa") || n.includes("papel") || n.includes("packaging")) return "Packaging y Embalajes";
  if (n.includes("cerveza") || n.includes("vino") || n.includes("refresco") || n.includes("agua") || n.includes("te ") || n.includes("sake")) return "Bebidas";
  return "Varios";
}

export async function POST(req: Request) {
  if (!(await getSessionRole())) return deny403();
  try {
    const data = await req.json();

    if (!data.numeroFactura || !data.proveedor || !data.fechaEmision) {
      return Response.json({ error: "Número de factura, proveedor y fecha son obligatorios" }, { status: 400 });
    }

    const rawItems = Array.isArray(data.items) ? data.items : [];
    // Filtrar estrictamente cualquier fila de impuestos/resumen que no sea producto
    const validItems = rawItems.filter((it: any) => {
      const desc = String(it.descripcion || "").trim();
      return desc && !isFiscalSummaryText(desc);
    });

    let totalBase = 0;
    let totalIva = 0;

    for (const item of validItems) {
      const cantidad = Number(item.cantidad || 1);
      const precioUnitario = Number(item.precioUnitario || 0);
      const ivaPct = Number(item.ivaPct || 10);
      const subtotal = cantidad * precioUnitario;
      const cuotaIva = subtotal * (ivaPct / 100);

      totalBase += subtotal;
      totalIva += cuotaIva;
    }

    const totalFactura = Number((totalBase + totalIva).toFixed(2));

    // Transacción atómica optimizada con timeout de 60 segundos
    const facturaCreada = await prisma.$transaction(
      async (tx) => {
        const f = await tx.factura.create({
          data: {
            numeroFactura: data.numeroFactura.trim(),
            proveedor: data.proveedor.trim(),
            cifProveedor: data.cifProveedor?.trim() || null,
            fechaEmision: new Date(data.fechaEmision),
            totalBase: Number(totalBase.toFixed(2)),
            totalIva: Number(totalIva.toFixed(2)),
            totalFactura: totalFactura,
            estadoPago: data.estadoPago || "pagado",
            metodoPago: data.metodoPago || "transferencia",
            archivoUrl: data.archivoUrl || null,
            archivoNombre: data.archivoNombre || null,
            notas: data.notas?.trim() || null,
          },
        });

        // Pre-cargar todos los ingredientes activos una sola vez en memoria (evita 100+ roundtrips de red)
        const existingStock = await tx.stockItem.findMany({ where: { activo: true } });
        const stockById = new Map<number, any>(existingStock.map((s) => [s.id, s]));
        const stockByName = new Map<string, any>(existingStock.map((s) => [s.nombre.toLowerCase().trim(), s]));

        for (const item of validItems) {
          const cantidad = Number(item.cantidad || 1);
          const precioUnitario = Number(item.precioUnitario || 0);
          const ivaPct = Number(item.ivaPct || 10);
          const subtotal = Number((cantidad * precioUnitario).toFixed(2));
          const requestedId = item.stockItemId && !isNaN(Number(item.stockItemId)) ? Number(item.stockItemId) : null;
          const cleanName = String(item.descripcion || "").trim();
          const cleanNameLower = cleanName.toLowerCase();

          let finalStockItemId: number | null = null;
          let stockRecord: any = null;

          if (requestedId && stockById.has(requestedId)) {
            stockRecord = stockById.get(requestedId);
          } else if (cleanNameLower && stockByName.has(cleanNameLower)) {
            stockRecord = stockByName.get(cleanNameLower);
          }

          const esGastoSinStock = String(item.stockItemId || "").toLowerCase() === "gasto_general" || String(item.stockItemId || "").toLowerCase() === "none";

          if (!stockRecord && cleanName && !esGastoSinStock) {
            // Alta automática del producto nuevo en inventario
            stockRecord = await tx.stockItem.create({
              data: {
                nombre: cleanName,
                categoria: item.categoria || inferStockCategory(cleanName),
                unidad: item.unidad || "kg",
                cantidadActual: cantidad,
                stockMinimo: 0, // 0 por defecto para que la compra inicial no marque el producto falsamente como "BAJO"
                costeUnitario: precioUnitario,
                ultimoCoste: precioUnitario,
                proveedorHabitual: f.proveedor,
                activo: true,
              },
            });
            // Guardar en cache en memoria para las siguientes líneas
            stockById.set(stockRecord.id, stockRecord);
            stockByName.set(cleanNameLower, stockRecord);

            await tx.stockMovimiento.create({
              data: {
                stockItemId: stockRecord.id,
                tipo: "entrada_factura",
                cantidad,
                stockPrevio: 0,
                stockPosterior: cantidad,
                costeUnitario: precioUnitario,
                referencia: `Factura ${f.numeroFactura} (${f.proveedor})`,
                notas: `Alta en almacén por factura: ${cleanName}`,
              },
            });
          } else if (stockRecord) {
            // Actualizar stock existente y recalcular precio medio ponderado
            const stockPrevio = stockRecord.cantidadActual;
            const stockPosterior = stockPrevio + cantidad;

            let nuevoCosteMedio = stockRecord.costeUnitario;
            if (stockPosterior > 0) {
              const valorPrevio = Math.max(0, stockPrevio) * stockRecord.costeUnitario;
              const valorNuevo = cantidad * precioUnitario;
              nuevoCosteMedio = (valorPrevio + valorNuevo) / stockPosterior;
            } else {
              nuevoCosteMedio = precioUnitario;
            }

            await tx.stockItem.update({
              where: { id: stockRecord.id },
              data: {
                cantidadActual: Number(stockPosterior.toFixed(3)),
                costeUnitario: Number(nuevoCosteMedio.toFixed(3)),
                ultimoCoste: precioUnitario,
                proveedorHabitual: f.proveedor,
              },
            });

            await tx.stockMovimiento.create({
              data: {
                stockItemId: stockRecord.id,
                tipo: "entrada_factura",
                cantidad,
                stockPrevio,
                stockPosterior,
                costeUnitario: precioUnitario,
                referencia: `Factura ${f.numeroFactura} (${f.proveedor})`,
                notas: cleanName,
              },
            });

            stockRecord.cantidadActual = stockPosterior;
            stockRecord.costeUnitario = nuevoCosteMedio;
          }

          if (stockRecord) {
            finalStockItemId = stockRecord.id;
          }

          await tx.facturaItem.create({
            data: {
              facturaId: f.id,
              stockItemId: finalStockItemId,
              descripcion: cleanName || "Artículo",
              categoria: stockRecord?.categoria || item.categoria || null,
              cantidad,
              unidad: item.unidad || "kg",
              precioUnitario,
              ivaPct,
              subtotal,
            },
          });
        }

        return f;
      },
      {
        timeout: 60000,
        maxWait: 15000,
      }
    );

    return Response.json(facturaCreada, { status: 201 });
  } catch (e: any) {
    console.error("[facturas POST]", e);
    return Response.json({ error: e?.message || "Error al registrar factura de compra" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await getSessionRole())) return deny403();
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    if (!id) return Response.json({ error: "ID requerido" }, { status: 400 });

    await prisma.factura.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (e) {
    console.error("[facturas DELETE]", e);
    return Response.json({ error: "Error al eliminar factura" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!(await getSessionRole())) return deny403();
  try {
    const formData = await req.formData();
    const id = Number(formData.get("id"));
    const file = formData.get("file") as File | null;
    if (!id || !file) {
      return Response.json({ error: "ID de factura y archivo requeridos" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const isPdf = (file.type || "").toLowerCase().includes("pdf") || file.name.toLowerCase().endsWith(".pdf");
    const mime = isPdf ? "application/pdf" : (file.type || "image/jpeg");

    const savedDoc = await prisma.imagen.create({
      data: { mime, data: buffer },
      select: { id: true },
    });

    const updated = await prisma.factura.update({
      where: { id },
      data: {
        archivoUrl: `/api/imagenes/${savedDoc.id}`,
        archivoNombre: file.name,
      },
    });

    return Response.json({ success: true, factura: updated });
  } catch (e: any) {
    console.error("[facturas PATCH]", e);
    return Response.json({ error: e?.message || "Error al adjuntar archivo a la factura" }, { status: 500 });
  }
}

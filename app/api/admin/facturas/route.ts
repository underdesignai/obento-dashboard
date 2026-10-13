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

export async function POST(req: Request) {
  if (!(await getSessionRole())) return deny403();
  try {
    const data = await req.json();

    if (!data.numeroFactura || !data.proveedor || !data.fechaEmision) {
      return Response.json({ error: "Número de factura, proveedor y fecha son obligatorios" }, { status: 400 });
    }

    const items = Array.isArray(data.items) ? data.items : [];
    let totalBase = 0;
    let totalIva = 0;

    // Calcular totales de los items
    for (const item of items) {
      const cantidad = Number(item.cantidad || 1);
      const precioUnitario = Number(item.precioUnitario || 0);
      const ivaPct = Number(item.ivaPct || 10);
      const subtotal = cantidad * precioUnitario;
      const cuotaIva = subtotal * (ivaPct / 100);

      totalBase += subtotal;
      totalIva += cuotaIva;
    }

    const totalFactura = Number((totalBase + totalIva).toFixed(2));

    // Crear factura e items en transacción atómica
    const facturaCreada = await prisma.$transaction(async (tx) => {
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

      // Crear cada línea y alimentar automáticamente el stock
      for (const item of items) {
        const cantidad = Number(item.cantidad || 1);
        const precioUnitario = Number(item.precioUnitario || 0);
        const ivaPct = Number(item.ivaPct || 10);
        const subtotal = Number((cantidad * precioUnitario).toFixed(2));
        const requestedId = item.stockItemId && !isNaN(Number(item.stockItemId)) ? Number(item.stockItemId) : null;

        let finalStockItemId: number | null = null;
        let stockRecord: any = null;

        // 1. Si vino un ID, verificar si realmente existe en la BD
        if (requestedId) {
          stockRecord = await tx.stockItem.findUnique({ where: { id: requestedId } });
        }

        // 2. Si no existe por ID, buscar coincidencia por nombre de ingrediente
        if (!stockRecord && item.descripcion?.trim()) {
          stockRecord = await tx.stockItem.findFirst({
            where: {
              nombre: {
                equals: item.descripcion.trim(),
                mode: "insensitive",
              },
              activo: true,
            },
          });
        }

        // 3. Si no existe en el almacén, CREARLO AUTOMÁTICAMENTE para que los productos entren al stock
        const esGastoSinStock = String(item.stockItemId || "").toLowerCase() === "gasto_general" || String(item.stockItemId || "").toLowerCase() === "none";
        if (!stockRecord && item.descripcion?.trim() && !esGastoSinStock) {
          stockRecord = await tx.stockItem.create({
            data: {
              nombre: item.descripcion.trim(),
              categoria: item.categoria || inferStockCategory(item.descripcion),
              unidad: item.unidad || "kg",
              cantidadActual: cantidad,
              stockMinimo: 5,
              costeUnitario: precioUnitario,
              ultimoCoste: precioUnitario,
              proveedorHabitual: f.proveedor,
              activo: true,
            },
          });

          // Registrar movimiento inicial de alta por factura
          await tx.stockMovimiento.create({
            data: {
              stockItemId: stockRecord.id,
              tipo: "entrada_factura",
              cantidad,
              stockPrevio: 0,
              stockPosterior: cantidad,
              costeUnitario: precioUnitario,
              referencia: `Factura ${f.numeroFactura} (${f.proveedor})`,
              notas: `Alta en almacén por factura: ${item.descripcion}`,
            },
          });
        } else if (stockRecord) {
          // El ingrediente ya existía: sumar cantidad al stock y recalcular precio medio ponderado
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
              notas: item.descripcion,
            },
          });
        }

        if (stockRecord) {
          finalStockItemId = stockRecord.id;
        }

        // Crear la línea de factura con un stockItemId 100% verificado o null
        await tx.facturaItem.create({
          data: {
            facturaId: f.id,
            stockItemId: finalStockItemId,
            descripcion: item.descripcion?.trim() || "Artículo",
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
    });

    return Response.json(facturaCreada, { status: 201 });
  } catch (e) {
    console.error("[facturas POST]", e);
    return Response.json({ error: "Error al registrar factura de compra" }, { status: 500 });
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

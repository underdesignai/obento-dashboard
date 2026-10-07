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

      // Crear cada línea y alimentar automáticamente el stock
      for (const item of items) {
        const cantidad = Number(item.cantidad || 1);
        const precioUnitario = Number(item.precioUnitario || 0);
        const ivaPct = Number(item.ivaPct || 10);
        const subtotal = Number((cantidad * precioUnitario).toFixed(2));
        const stockItemId = item.stockItemId ? Number(item.stockItemId) : null;

        await tx.facturaItem.create({
          data: {
            facturaId: f.id,
            stockItemId,
            descripcion: item.descripcion?.trim() || "Artículo",
            categoria: item.categoria || null,
            cantidad,
            unidad: item.unidad || "kg",
            precioUnitario,
            ivaPct,
            subtotal,
          },
        });

        // Si la línea está asociada a un artículo de inventario, sumamos stock y recalculamos precio medio
        if (stockItemId) {
          const s = await tx.stockItem.findUnique({ where: { id: stockItemId } });
          if (s) {
            const stockPrevio = s.cantidadActual;
            const stockPosterior = stockPrevio + cantidad;

            // Precio Medio Ponderado (PMP): (StockActual * CosteActual + CantidadNueva * PrecioNuevo) / StockNuevo
            let nuevoCosteMedio = s.costeUnitario;
            if (stockPosterior > 0) {
              const valorPrevio = Math.max(0, stockPrevio) * s.costeUnitario;
              const valorNuevo = cantidad * precioUnitario;
              nuevoCosteMedio = (valorPrevio + valorNuevo) / stockPosterior;
            } else {
              nuevoCosteMedio = precioUnitario;
            }

            await tx.stockItem.update({
              where: { id: stockItemId },
              data: {
                cantidadActual: Number(stockPosterior.toFixed(3)),
                costeUnitario: Number(nuevoCosteMedio.toFixed(3)),
                ultimoCoste: precioUnitario,
                proveedorHabitual: f.proveedor,
              },
            });

            // Registrar movimiento de auditoría
            await tx.stockMovimiento.create({
              data: {
                stockItemId,
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
        }
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

import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";
import { calcularCosteIngrediente, convertirUnidad } from "@/lib/stock-unidades";

export async function GET() {
  if (!(await getSessionRole())) return deny403();
  try {
    const mermas = await prisma.mermaItem.findMany({
      include: {
        stockItem: {
          select: { id: true, nombre: true, categoria: true, unidad: true, costeUnitario: true },
        },
      },
      orderBy: { fecha: "desc" },
    });

    const totalDineroPerdido = mermas.reduce((acc, m) => acc + m.costePerdido, 0);

    return Response.json({
      mermas,
      stats: {
        totalRegistros: mermas.length,
        totalDineroPerdido: Number(totalDineroPerdido.toFixed(2)),
      },
    });
  } catch (e) {
    console.error("[mermas GET]", e);
    return Response.json({ error: "Error al cargar mermas" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await getSessionRole())) return deny403();
  try {
    const data = await req.json();

    if (!data.stockItemId || !data.cantidad || !data.motivo) {
      return Response.json({ error: "Artículo de stock, cantidad y motivo son obligatorios" }, { status: 400 });
    }

    const stockItemId = Number(data.stockItemId);
    const cantidad = Number(data.cantidad);
    const motivo = data.motivo.trim();

    const stockItem = await prisma.stockItem.findUnique({ where: { id: stockItemId } });
    if (!stockItem) return Response.json({ error: "Artículo de stock no encontrado" }, { status: 404 });

    const unidadEntrada = data.unidad || stockItem.unidad;
    const costePerdido = Number(calcularCosteIngrediente(cantidad, unidadEntrada, stockItem.costeUnitario, stockItem.unidad).toFixed(2));
    const cantidadEnUnidadStock = convertirUnidad(cantidad, unidadEntrada, stockItem.unidad) ?? cantidad;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear registro de merma
      const merma = await tx.mermaItem.create({
        data: {
          stockItemId,
          cantidad,
          unidad: unidadEntrada,
          motivo,
          costePerdido,
          notas: data.notas?.trim() || null,
          registradoPor: data.registradoPor || "Cocina / Admin",
        },
      });

      // 2. Descontar del inventario en unidad base
      const stockPrevio = stockItem.cantidadActual;
      const stockPosterior = Math.max(0, stockPrevio - cantidadEnUnidadStock);

      await tx.stockItem.update({
        where: { id: stockItemId },
        data: { cantidadActual: Number(stockPosterior.toFixed(3)) },
      });

      // 3. Registrar movimiento
      await tx.stockMovimiento.create({
        data: {
          stockItemId,
          tipo: "merma",
          cantidad: -cantidadEnUnidadStock,
          stockPrevio,
          stockPosterior,
          costeUnitario: stockItem.costeUnitario,
          referencia: `Merma: ${motivo}`,
          notas: data.notas?.trim() || `Desperdicio de ${cantidad} ${unidadEntrada} (${costePerdido}€)`,
        },
      });

      return merma;
    });

    return Response.json(result, { status: 201 });
  } catch (e) {
    console.error("[mermas POST]", e);
    return Response.json({ error: "Error al registrar merma" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await getSessionRole())) return deny403();
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    if (!id) return Response.json({ error: "ID requerido" }, { status: 400 });

    await prisma.mermaItem.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (e) {
    console.error("[mermas DELETE]", e);
    return Response.json({ error: "Error al eliminar registro de merma" }, { status: 500 });
  }
}

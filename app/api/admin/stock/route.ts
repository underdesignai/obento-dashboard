import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

export async function GET() {
  if (!(await getSessionRole())) return deny403();
  try {
    const items = await prisma.stockItem.findMany({
      where: { activo: true },
      orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
    });

    // Calcular estadísticas globales de almacén
    const totalItems = items.length;
    const itemsBajoStock = items.filter(i => i.cantidadActual <= i.stockMinimo);
    const valorTotalAlmacen = items.reduce((acc, i) => acc + (i.cantidadActual * i.costeUnitario), 0);

    return Response.json({
      items,
      stats: {
        totalArticulos: totalItems,
        alertaBajoStock: itemsBajoStock.length,
        valorTotalAlmacen: Number(valorTotalAlmacen.toFixed(2)),
      }
    });
  } catch (e) {
    console.error("[stock GET]", e);
    return Response.json({ error: "Error al cargar inventario de stock" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await getSessionRole())) return deny403();
  try {
    const data = await req.json();
    if (!data.nombre || !data.categoria) {
      return Response.json({ error: "Nombre y categoría son obligatorios" }, { status: 400 });
    }

    const cantidadInicial = Number(data.cantidadActual || 0);
    const costeUnitario = Number(data.costeUnitario || 0);

    const newItem = await prisma.stockItem.create({
      data: {
        nombre: data.nombre.trim(),
        categoria: data.categoria,
        unidad: data.unidad || "kg",
        cantidadActual: cantidadInicial,
        stockMinimo: Number(data.stockMinimo || 5),
        costeUnitario: costeUnitario,
        ultimoCoste: costeUnitario,
        proveedorHabitual: data.proveedorHabitual?.trim() || null,
        notas: data.notas?.trim() || null,
      },
    });

    // Si entra con cantidad > 0, registrar movimiento inicial
    if (cantidadInicial > 0) {
      await prisma.stockMovimiento.create({
        data: {
          stockItemId: newItem.id,
          tipo: "ajuste_manual",
          cantidad: cantidadInicial,
          stockPrevio: 0,
          stockPosterior: cantidadInicial,
          costeUnitario: costeUnitario,
          referencia: "Stock Inicial",
          notas: "Inventario de alta en sistema",
        },
      });
    }

    return Response.json(newItem, { status: 201 });
  } catch (e) {
    console.error("[stock POST]", e);
    return Response.json({ error: "Error al crear artículo de stock" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!(await getSessionRole())) return deny403();
  try {
    const data = await req.json();
    if (!data.id) {
      return Response.json({ error: "ID de artículo requerido" }, { status: 400 });
    }

    const existing = await prisma.stockItem.findUnique({ where: { id: Number(data.id) } });
    if (!existing) return Response.json({ error: "Artículo no encontrado" }, { status: 404 });

    const cantidadNueva = data.cantidadActual !== undefined ? Number(data.cantidadActual) : existing.cantidadActual;
    const costeNuevo = data.costeUnitario !== undefined ? Number(data.costeUnitario) : existing.costeUnitario;

    // Si hubo ajuste manual de cantidad, registrar movimiento de auditoría
    if (cantidadNueva !== existing.cantidadActual) {
      const diff = cantidadNueva - existing.cantidadActual;
      await prisma.stockMovimiento.create({
        data: {
          stockItemId: existing.id,
          tipo: "ajuste_manual",
          cantidad: diff,
          stockPrevio: existing.cantidadActual,
          stockPosterior: cantidadNueva,
          costeUnitario: costeNuevo,
          referencia: "Ajuste manual",
          notas: data.motivoAjuste || "Corrección de recuento físico",
        },
      });
    }

    const updated = await prisma.stockItem.update({
      where: { id: Number(data.id) },
      data: {
        nombre: data.nombre !== undefined ? data.nombre.trim() : existing.nombre,
        categoria: data.categoria || existing.categoria,
        unidad: data.unidad || existing.unidad,
        cantidadActual: cantidadNueva,
        stockMinimo: data.stockMinimo !== undefined ? Number(data.stockMinimo) : existing.stockMinimo,
        costeUnitario: costeNuevo,
        proveedorHabitual: data.proveedorHabitual !== undefined ? data.proveedorHabitual : existing.proveedorHabitual,
        notas: data.notas !== undefined ? data.notas : existing.notas,
      },
    });

    return Response.json(updated);
  } catch (e) {
    console.error("[stock PUT]", e);
    return Response.json({ error: "Error al actualizar artículo de stock" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await getSessionRole())) return deny403();
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    if (!id) return Response.json({ error: "ID requerido" }, { status: 400 });

    // Marcamos inactivo para conservar trazabilidad de movimientos y facturas históricas
    await prisma.stockItem.update({
      where: { id },
      data: { activo: false },
    });

    return Response.json({ success: true });
  } catch (e) {
    console.error("[stock DELETE]", e);
    return Response.json({ error: "Error al eliminar artículo de stock" }, { status: 500 });
  }
}

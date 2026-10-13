import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";
import { calcularCosteIngrediente } from "@/lib/stock-unidades";

export async function GET(req: Request) {
  if (!(await getSessionRole())) return deny403();
  try {
    const { searchParams } = new URL(req.url);
    const menuItemIdParam = searchParams.get("menuItemId");
    if (menuItemIdParam) {
      const items = await prisma.escandalloIngrediente.findMany({
        where: { menuItemId: Number(menuItemIdParam) },
        include: {
          stockItem: {
            select: { id: true, nombre: true, unidad: true, costeUnitario: true, categoria: true, cantidadActual: true },
          },
        },
        orderBy: { id: "asc" },
      });
      return Response.json(items);
    }

    // 1. Obtener todos los platos de la carta
    const platos = await prisma.menuItem.findMany({
      where: { activo: true },
      orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
    });

    // 2. Obtener todas las líneas de receta / escandallo
    const recetas = await prisma.escandalloIngrediente.findMany({
      include: {
        stockItem: {
          select: { id: true, nombre: true, unidad: true, costeUnitario: true, categoria: true },
        },
      },
    });

    // Agrupar escandallo por plato (usando platoNombre o menuItemId)
    const recetasPorPlato: Record<string, typeof recetas> = {};
    for (const r of recetas) {
      const key = r.menuItemId ? `id_${r.menuItemId}` : `name_${r.platoNombre}`;
      if (!recetasPorPlato[key]) recetasPorPlato[key] = [];
      recetasPorPlato[key].push(r);
    }

    // 3. Cruzar cada plato con sus ingredientes para calcular coste y margen
    const platosConCoste = platos.map(plato => {
      const keyId = `id_${plato.id}`;
      const keyName = `name_${plato.nombre}`;
      const ingredientes = recetasPorPlato[keyId] || recetasPorPlato[keyName] || [];

      const costeMateriaPrima = ingredientes.reduce((acc, ing) => {
        const costeUnit = ing.stockItem?.costeUnitario || 0;
        const unidadStock = ing.stockItem?.unidad || "kg";
        const unidadReceta = ing.unidad || "g";
        return acc + calcularCosteIngrediente(ing.cantidad, unidadReceta, costeUnit, unidadStock);
      }, 0);

      const pvp = plato.precio || 0;
      const beneficioBruto = Math.max(0, pvp - costeMateriaPrima);
      const margenPct = pvp > 0 ? (beneficioBruto / pvp) * 100 : 0;
      const foodCostPct = pvp > 0 ? (costeMateriaPrima / pvp) * 100 : 0;

      return {
        id: plato.id,
        nombre: plato.nombre,
        categoria: plato.categoria,
        precioVenta: pvp,
        costeMateriaPrima: Number(costeMateriaPrima.toFixed(2)),
        beneficioBruto: Number(beneficioBruto.toFixed(2)),
        margenPct: Number(margenPct.toFixed(1)),
        foodCostPct: Number(foodCostPct.toFixed(1)),
        ingredientesCount: ingredientes.length,
        ingredientes,
      };
    });

    return Response.json({
      platos: platosConCoste,
      totalPlatos: platos.length,
    });
  } catch (e) {
    console.error("[escandallos GET]", e);
    return Response.json({ error: "Error al cargar escandallos" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!(await getSessionRole())) return deny403();
  try {
    const data = await req.json();
    const { menuItemId, platoNombre, ingredientes } = data;

    if (!menuItemId && !platoNombre) {
      return Response.json({ error: "menuItemId o platoNombre es requerido" }, { status: 400 });
    }

    // Limpiar ingredientes previos del plato
    if (menuItemId) {
      await prisma.escandalloIngrediente.deleteMany({
        where: { menuItemId: Number(menuItemId) },
      });
    } else if (platoNombre) {
      await prisma.escandalloIngrediente.deleteMany({
        where: { platoNombre: String(platoNombre).trim() },
      });
    }

    // Insertar la lista actualizada de ingredientes
    if (Array.isArray(ingredientes) && ingredientes.length > 0) {
      await prisma.escandalloIngrediente.createMany({
        data: ingredientes.map((ing: any) => ({
          menuItemId: menuItemId ? Number(menuItemId) : null,
          platoNombre: platoNombre ? String(platoNombre).trim() : "",
          stockItemId: Number(ing.stockItemId),
          cantidad: Number(ing.cantidad),
          unidad: ing.unidad || "g",
          notas: ing.notas || null,
        })),
      });
    }

    const updated = await prisma.escandalloIngrediente.findMany({
      where: menuItemId ? { menuItemId: Number(menuItemId) } : { platoNombre: String(platoNombre).trim() },
      include: {
        stockItem: {
          select: { id: true, nombre: true, unidad: true, costeUnitario: true, categoria: true, cantidadActual: true },
        },
      },
      orderBy: { id: "asc" },
    });

    return Response.json({ success: true, ingredientes: updated });
  } catch (e) {
    console.error("[escandallos PUT]", e);
    return Response.json({ error: "Error al actualizar receta" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await getSessionRole())) return deny403();
  try {
    const data = await req.json();

    if (!data.platoNombre || !data.stockItemId || !data.cantidad) {
      return Response.json({ error: "Plato, ingrediente y cantidad son obligatorios" }, { status: 400 });
    }

    const item = await prisma.escandalloIngrediente.create({
      data: {
        menuItemId: data.menuItemId ? Number(data.menuItemId) : null,
        dishId: data.dishId || null,
        platoNombre: data.platoNombre.trim(),
        stockItemId: Number(data.stockItemId),
        cantidad: Number(data.cantidad),
        unidad: data.unidad || "g",
        notas: data.notas?.trim() || null,
      },
      include: {
        stockItem: true,
      },
    });

    return Response.json(item, { status: 201 });
  } catch (e) {
    console.error("[escandallos POST]", e);
    return Response.json({ error: "Error al guardar ingrediente en receta" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await getSessionRole())) return deny403();
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    if (!id) return Response.json({ error: "ID requerido" }, { status: 400 });

    await prisma.escandalloIngrediente.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (e) {
    console.error("[escandallos DELETE]", e);
    return Response.json({ error: "Error al eliminar ingrediente de receta" }, { status: 500 });
  }
}

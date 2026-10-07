import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

export async function GET(req: Request) {
  if (!(await getSessionRole())) return deny403();
  try {
    const { searchParams } = new URL(req.url);
    const mesParam = searchParams.get("mes"); // formato YYYY-MM opcional

    const now = new Date();
    const currentYear = mesParam ? parseInt(mesParam.split("-")[0]) : now.getFullYear();
    const currentMonth = mesParam ? parseInt(mesParam.split("-")[1]) - 1 : now.getMonth();

    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    // 1. Ingresos por ventas de pedidos completados/pagados en el periodo
    const pedidos = await prisma.pedidos.findMany({
      where: {
        created_at: { gte: startDate, lte: endDate },
        estado_pago: { not: "fallido" },
      },
      include: {
        pedido_items: true,
      },
    });

    const totalVentas = pedidos.reduce((acc, p) => acc + Number(p.total), 0);
    const totalPedidos = pedidos.length;

    // 2. Gastos en facturas de compras del periodo
    const facturas = await prisma.factura.findMany({
      where: {
        fechaEmision: { gte: startDate, lte: endDate },
      },
      include: {
        items: true,
      },
    });

    const totalCompras = facturas.reduce((acc, f) => acc + f.totalFactura, 0);
    const totalComprasBase = facturas.reduce((acc, f) => acc + f.totalBase, 0);

    // 3. Mermas y desperdicios del periodo
    const mermas = await prisma.mermaItem.findMany({
      where: {
        fecha: { gte: startDate, lte: endDate },
      },
      include: {
        stockItem: { select: { nombre: true, categoria: true } },
      },
    });

    const totalMermas = mermas.reduce((acc, m) => acc + m.costePerdido, 0);

    // 4. Valor total actual del inventario en almacén (a día de hoy)
    const stockItems = await prisma.stockItem.findMany({ where: { activo: true } });
    const valorAlmacenActual = stockItems.reduce((acc, s) => acc + (s.cantidadActual * s.costeUnitario), 0);

    // 5. Métricas de Rentabilidad del negocio
    // Margen Bruto = Ventas - (Compras de Materia Prima + Mermas)
    const beneficioBrutoEstimado = Math.max(-99999, totalVentas - totalCompras - totalMermas);
    const foodCostRatio = totalVentas > 0 ? ((totalCompras + totalMermas) / totalVentas) * 100 : 0;
    const margenBrutoRatio = totalVentas > 0 ? (beneficioBrutoEstimado / totalVentas) * 100 : 0;

    // 6. Desglose de compras por categoría
    const comprasPorCategoria: Record<string, number> = {};
    for (const f of facturas) {
      for (const item of f.items) {
        const cat = item.categoria || "Varios";
        comprasPorCategoria[cat] = (comprasPorCategoria[cat] || 0) + item.subtotal;
      }
    }

    return Response.json({
      periodo: {
        mes: currentMonth + 1,
        año: currentYear,
        fechaInicio: startDate,
        fechaFin: endDate,
      },
      metricas: {
        ventasTotales: Number(totalVentas.toFixed(2)),
        totalPedidos,
        ticketMedio: totalPedidos > 0 ? Number((totalVentas / totalPedidos).toFixed(2)) : 0,
        comprasTotales: Number(totalCompras.toFixed(2)),
        comprasBase: Number(totalComprasBase.toFixed(2)),
        totalFacturas: facturas.length,
        perdidasMermas: Number(totalMermas.toFixed(2)),
        beneficioBruto: Number(beneficioBrutoEstimado.toFixed(2)),
        foodCostPorcentaje: Number(foodCostRatio.toFixed(1)),
        margenPorcentaje: Number(margenBrutoRatio.toFixed(1)),
        valorInventarioActual: Number(valorAlmacenActual.toFixed(2)),
      },
      desgloseCompras: comprasPorCategoria,
      mermasRecientes: mermas.slice(0, 10),
    });
  } catch (e) {
    console.error("[reportes rentabilidad GET]", e);
    return Response.json({ error: "Error al calcular extracto de rentabilidad" }, { status: 500 });
  }
}

import { prisma } from "@/lib/prisma";
import OverviewDisplay from "./OverviewDisplay";

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); } catch (e) { console.error("[admin overview SSR]", e); return fallback; }
}

async function getData() {
  const hoy    = new Date(); hoy.setHours(0,0,0,0);
  const semana = new Date(hoy); semana.setDate(semana.getDate() - 7);
  const mes    = new Date(hoy); mes.setDate(1);

  const [
    pedidosNuevos, pedidosHoy,
    reviewsPendientes,
    visitasHoy, visitasSemana,
    platosActivos,
    ultimosPedidosRaw, pedidosMes,
    leadsTotales,
  ] = await Promise.all([
    safe(() => prisma.pedidos.count({ where: { estado_pedido: { in: ["recibido", "nuevo"] } } }), 0),
    safe(() => prisma.pedidos.count({ where: { created_at: { gte: hoy } } }), 0),
    safe(() => prisma.review.count({ where: { aprobado: false } }), 0),
    safe(() => prisma.visita.count({ where: { createdAt: { gte: hoy } } }), 0),
    safe(() => prisma.visita.count({ where: { createdAt: { gte: semana } } }), 0),
    safe(() => prisma.menuItem.count({ where: { activo: true } }), 0),
    safe(() => prisma.pedidos.findMany({
      take: 6, orderBy: { id: "desc" },
      select: { id: true, numero_pedido: true, cliente_nombre: true, total: true, estado_pedido: true, created_at: true },
    }), []),
    safe(() => prisma.pedidos.findMany({ where: { created_at: { gte: mes } }, select: { total: true } }), []),
    safe(() => prisma.cliente.count(), 0),
  ]);

  const ingresosMes = (pedidosMes as { total: any }[]).reduce((s, p) => s + Number(p.total ?? 0), 0);

  return {
    pedidosNuevos, pedidosHoy, ingresosMes,
    reviewsPendientes, visitasHoy, visitasSemana,
    platosActivos, leadsTotales,
    ultimosPedidos: (ultimosPedidosRaw as any[])
      .map(p => ({
        id: p.id,
        numeroPedido: p.numero_pedido || `OB-${p.id}`,
        nombre: p.cliente_nombre,
        total: Number(p.total),
        estado: p.estado_pedido === "recibido" ? "nuevo" : p.estado_pedido,
        createdAt: p.created_at instanceof Date ? p.created_at.toISOString() : (p.created_at || new Date().toISOString()),
      })),
  };
}

export default async function AdminOverview() {
  const d = await getData();
  return <OverviewDisplay data={d} />;
}

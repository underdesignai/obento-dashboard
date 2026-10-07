import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); } catch { return fallback; }
}

export async function GET() {
  if (!(await getSessionRole())) return deny403();

  const hoy    = new Date(); hoy.setHours(0, 0, 0, 0);
  const semana = new Date(hoy); semana.setDate(semana.getDate() - 7);
  const mes    = new Date(hoy); mes.setDate(1);

  const [
    reservasHoy, reservasSemana, reservasMes,
    pedidosNuevos, pedidosHoy,
    reviewsPendientes,
    visitasHoy, visitasSemana,
    platosActivos,
    ultimasReservas, ultimosPedidosRaw, pedidosMes,
    leadsTotales,
  ] = await Promise.all([
    safe(() => prisma.reserva.count({ where: { fecha: { gte: hoy } } }), 0),
    safe(() => prisma.reserva.count({ where: { createdAt: { gte: semana } } }), 0),
    safe(() => prisma.reserva.count({ where: { createdAt: { gte: mes } } }), 0),
    safe(() => prisma.pedidos.count({ where: { estado_pedido: { in: ["recibido", "nuevo"] } } }), 0),
    safe(() => prisma.pedidos.count({ where: { created_at: { gte: hoy } } }), 0),
    safe(() => prisma.review.count({ where: { aprobado: false } }), 0),
    safe(() => prisma.visita.count({ where: { createdAt: { gte: hoy } } }), 0),
    safe(() => prisma.visita.count({ where: { createdAt: { gte: semana } } }), 0),
    safe(() => prisma.menuItem.count({ where: { activo: true } }), 0),
    safe(() => prisma.reserva.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: { id: true, nombre: true, fecha: true, personas: true, seccion: true, estado: true, createdAt: true },
    }), []),
    safe(() => prisma.pedidos.findMany({
      take: 6,
      orderBy: { id: "desc" },
      select: { id: true, numero_pedido: true, cliente_nombre: true, total: true, estado_pedido: true, created_at: true },
    }), []),
    safe(() => prisma.pedidos.findMany({ where: { created_at: { gte: mes } }, select: { total: true } }), []),
    safe(() => prisma.cliente.count(), 0),
  ]);

  const ingresosMes = (pedidosMes as { total: any }[]).reduce((s, p) => s + Number(p.total ?? 0), 0);

  return NextResponse.json({
    reservasHoy, reservasSemana, reservasMes,
    pedidosNuevos, pedidosHoy, ingresosMes,
    reviewsPendientes, visitasHoy, visitasSemana,
    platosActivos, leadsTotales,
    ultimasReservas: (ultimasReservas as any[]).map(r => ({
      ...r,
      fecha: r.fecha instanceof Date ? r.fecha.toISOString() : r.fecha,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    })),
    ultimosPedidos: (ultimosPedidosRaw as any[]).map(p => ({
      id: p.id,
      numeroPedido: p.numero_pedido || `OB-${p.id}`,
      nombre: p.cliente_nombre,
      total: Number(p.total),
      estado: p.estado_pedido === "recibido" ? "nuevo" : p.estado_pedido,
      createdAt: p.created_at instanceof Date ? p.created_at.toISOString() : (p.created_at || new Date().toISOString()),
    })),
  });
}

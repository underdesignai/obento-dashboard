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
    ultimasReservas, ultimosPedidos, pedidosMes,
    leadsTotales,
  ] = await Promise.all([
    safe(() => prisma.reserva.count({ where: { fecha: { gte: hoy } } }), 0),
    safe(() => prisma.reserva.count({ where: { createdAt: { gte: semana } } }), 0),
    safe(() => prisma.reserva.count({ where: { createdAt: { gte: mes } } }), 0),
    safe(() => prisma.pedido.count({ where: { estado: "nuevo" } }), 0),
    safe(() => prisma.pedido.count({ where: { createdAt: { gte: hoy } } }), 0),
    safe(() => prisma.review.count({ where: { aprobado: false } }), 0),
    safe(() => prisma.visita.count({ where: { createdAt: { gte: hoy } } }), 0),
    safe(() => prisma.visita.count({ where: { createdAt: { gte: semana } } }), 0),
    safe(() => prisma.menuItem.count({ where: { activo: true } }), 0),
    safe(() => prisma.reserva.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      where: { createdAt: { gte: hoy } },
      select: { id: true, nombre: true, fecha: true, personas: true, seccion: true, estado: true, createdAt: true },
    }), []),
    safe(() => prisma.pedido.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      where: { createdAt: { gte: hoy } },
      select: { id: true, nombre: true, total: true, estado: true, createdAt: true },
    }), []),
    safe(() => prisma.pedido.findMany({ where: { createdAt: { gte: mes } }, select: { total: true } }), []),
    safe(() => prisma.reserva.count(), 0),
  ]);

  const ingresosMes = (pedidosMes as { total: number | null }[]).reduce((s, p) => s + (p.total ?? 0), 0);

  return NextResponse.json({
    reservasHoy, reservasSemana, reservasMes,
    pedidosNuevos, pedidosHoy, ingresosMes,
    reviewsPendientes, visitasHoy, visitasSemana,
    platosActivos, leadsTotales,
    ultimasReservas: (ultimasReservas as { id: number; nombre: string; fecha: Date; personas: number; seccion: string | null; estado: string; createdAt: Date }[])
      .map(r => ({ ...r, fecha: r.fecha.toISOString(), createdAt: r.createdAt.toISOString() })),
    ultimosPedidos: (ultimosPedidos as { id: number; nombre: string; total: number | null; estado: string; createdAt: Date }[])
      .map(p => ({ ...p, createdAt: p.createdAt.toISOString() })),
  });
}

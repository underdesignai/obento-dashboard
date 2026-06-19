import { prisma } from "@/lib/prisma";
import OverviewDisplay from "./OverviewDisplay";

async function getData() {
  try {
    const hoy    = new Date(); hoy.setHours(0,0,0,0);
    const semana = new Date(hoy); semana.setDate(semana.getDate() - 7);
    const mes    = new Date(hoy); mes.setDate(1);

    const [
      reservasHoy, reservasSemana, reservasMes,
      pedidosNuevos, pedidosHoy, ingresosMes,
      reviewsPendientes,
      visitasHoy, visitasSemana,
      platosActivos, leadsTotales,
      ultimasReservas, ultimosPedidos,
    ] = await Promise.all([
      prisma.reserva.count({ where: { fecha: { gte: hoy } } }),
      prisma.reserva.count({ where: { createdAt: { gte: semana } } }),
      prisma.reserva.count({ where: { createdAt: { gte: mes } } }),
      prisma.pedido.count({ where: { estado: "nuevo" } }),
      prisma.pedido.count({ where: { createdAt: { gte: hoy } } }),
      prisma.pedido.aggregate({ where: { createdAt: { gte: mes } }, _sum: { total: true } }),
      prisma.review.count({ where: { aprobado: false } }),
      prisma.visita.count({ where: { createdAt: { gte: hoy } } }),
      prisma.visita.count({ where: { createdAt: { gte: semana } } }),
      prisma.menuItem.count({ where: { activo: true } }),
      prisma.reserva.groupBy({ by: ["email"] }).then((r: {email: string}[]) => r.length),
      prisma.reserva.findMany({
        take: 6, orderBy: { createdAt: "desc" },
        select: { id: true, nombre: true, fecha: true, personas: true, seccion: true, estado: true, createdAt: true },
      }),
      prisma.pedido.findMany({
        take: 6, orderBy: { createdAt: "desc" },
        select: { id: true, nombre: true, total: true, estado: true, createdAt: true },
      }),
    ]);

    return {
      reservasHoy, reservasSemana, reservasMes,
      pedidosNuevos, pedidosHoy,
      ingresosMes: ingresosMes._sum.total ?? 0,
      reviewsPendientes, visitasHoy, visitasSemana,
      platosActivos, leadsTotales,
      ultimasReservas: ultimasReservas.map((r: {id:number,nombre:string,fecha:Date,personas:number,seccion:string|null,estado:string,createdAt:Date}) => ({ ...r, fecha: r.fecha.toISOString(), createdAt: r.createdAt.toISOString() })),
      ultimosPedidos: ultimosPedidos.map((p: {id:number,nombre:string,total:number|null,estado:string,createdAt:Date}) => ({ ...p, createdAt: p.createdAt.toISOString() })),
    };
  } catch { return null; }
}

export default async function AdminOverview() {
  const d = await getData();
  return <OverviewDisplay data={d} />;
}

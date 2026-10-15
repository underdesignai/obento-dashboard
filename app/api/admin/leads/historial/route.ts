import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getSessionRole, deny403 } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await getSessionRole())) return deny403();
  const email  = req.nextUrl.searchParams.get("email");
  const nombre = req.nextUrl.searchParams.get("nombre");

  try {
    const whereReserva = email
      ? { email: { equals: email, mode: "insensitive" as const } }
      : { nombre: { equals: nombre ?? "", mode: "insensitive" as const } };

    const wherePedido = email
      ? { cliente_email: { equals: email, mode: "insensitive" as const } }
      : { cliente_nombre: { equals: nombre ?? "", mode: "insensitive" as const } };

    const [reservas, pedidos] = await Promise.all([
      prisma.reserva.findMany({
        where: whereReserva,
        orderBy: { fecha: "desc" },
        select: { id: true, fecha: true, personas: true, seccion: true, estado: true, mensaje: true },
      }),
      prisma.pedidos.findMany({
        where: wherePedido,
        orderBy: { created_at: "desc" },
        select: { id: true, numero_pedido: true, created_at: true, total: true, estado_pedido: true, notas: true },
      }),
    ]);

    const formattedPedidos = pedidos.map(p => ({
      id: `p-${p.id}`,
      fecha: p.created_at instanceof Date ? p.created_at.toISOString() : (p.created_at || new Date().toISOString()),
      personas: 1,
      seccion: "sushi",
      estado: p.estado_pedido === "recibido" ? "confirmada" : p.estado_pedido === "cancelado" ? "cancelada" : "llego",
      mensaje: `Pedido #${p.numero_pedido || `OB-${p.id}`} · ${Number(p.total).toFixed(2)} € ${p.notas ? `(${p.notas})` : ""}`,
      tipo: "pedido",
    }));

    const formattedReservas = reservas.map(r => ({
      ...r,
      fecha: r.fecha instanceof Date ? r.fecha.toISOString() : String(r.fecha),
      tipo: "reserva",
    }));

    const all = [...formattedPedidos, ...formattedReservas].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    return Response.json(all);
  } catch (e) {
    console.error("[leads/historial]", e);
    return Response.json({ error: "Error al cargar historial" }, { status: 500 });
  }
}


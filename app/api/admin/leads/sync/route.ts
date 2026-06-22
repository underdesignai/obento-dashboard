import { prisma } from "@/lib/prisma";
import { upsertCliente } from "@/lib/clienteSync";
import { getSessionRole, deny403 } from "@/lib/auth";

export async function POST() {
  if (!(await getSessionRole())) return deny403();

  const [reservas, pedidos] = await Promise.all([
    prisma.reserva.findMany({ select: { nombre: true, email: true, telefono: true, fecha: true } }),
    prisma.pedido.findMany({ select: { nombre: true, email: true, telefono: true, createdAt: true } }),
  ]);

  let count = 0;
  for (const r of reservas) {
    await upsertCliente({ nombre: r.nombre, email: r.email, telefono: r.telefono, fecha: r.fecha, tipo: "reserva" });
    count++;
  }
  for (const p of pedidos) {
    await upsertCliente({ nombre: p.nombre, email: p.email, telefono: p.telefono, fecha: p.createdAt, tipo: "pedido" });
    count++;
  }

  return Response.json({ ok: true, synced: count });
}

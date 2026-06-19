import { prisma } from "@/lib/prisma";
import { upsertCliente } from "@/lib/clienteSync";

export async function POST() {
  try {
    const reservas = await prisma.reserva.findMany({
      select: { nombre: true, email: true, telefono: true, fecha: true },
      orderBy: { fecha: "asc" },
    });

    let creados = 0;
    let actualizados = 0;
    const antes = await prisma.cliente.count();

    for (const r of reservas) {
      await upsertCliente(r);
    }

    const despues = await prisma.cliente.count();
    creados = despues - antes;
    actualizados = reservas.length - creados;

    return Response.json({ ok: true, clientes: despues, creados, procesadas: reservas.length });
  } catch (e) {
    console.error(e);
    return Response.json({ ok: false }, { status: 500 });
  }
}

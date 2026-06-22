import { prisma } from "@/lib/prisma";
import { upsertCliente } from "@/lib/clienteSync";

export async function GET() {
  try {
    const reservas = await prisma.reserva.findMany({ orderBy: { createdAt: "desc" } });
    return Response.json(reservas);
  } catch (e) {
    console.error("[reservas GET]", e);
    return Response.json({ error: "Error al cargar reservas" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data.nombre || !data.email || !data.fecha || !data.personas) {
      return Response.json({ error: "nombre, email, fecha y personas son requeridos" }, { status: 400 });
    }
    const fecha = new Date(data.fecha);
    const r = await prisma.reserva.create({ data: { ...data, fecha } });
    // Crear/actualizar ficha de cliente automáticamente
    upsertCliente({ nombre: data.nombre, email: data.email, telefono: data.telefono, fecha, tipo: "reserva" }).catch(() => {});
    return Response.json(r, { status: 201 });
  } catch (e) {
    console.error("[reservas POST]", e);
    return Response.json({ error: "Error al crear reserva" }, { status: 500 });
  }
}

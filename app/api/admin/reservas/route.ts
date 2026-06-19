import { prisma } from "@/lib/prisma";
import { upsertCliente } from "@/lib/clienteSync";

export async function GET() {
  try {
    const reservas = await prisma.reserva.findMany({ orderBy: { createdAt: "desc" } });
    return Response.json(reservas);
  } catch { return Response.json([], { status: 200 }); }
}

export async function POST(req: Request) {
  const data = await req.json();
  const fecha = new Date(data.fecha);
  const r = await prisma.reserva.create({ data: { ...data, fecha } });
  // Crear/actualizar ficha de cliente automáticamente
  upsertCliente({ nombre: data.nombre, email: data.email, telefono: data.telefono, fecha }).catch(() => {});
  return Response.json(r, { status: 201 });
}

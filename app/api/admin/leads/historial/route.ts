import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const email  = req.nextUrl.searchParams.get("email");
  const nombre = req.nextUrl.searchParams.get("nombre");

  try {
    const where = email
      ? { email: { equals: email, mode: "insensitive" as const } }
      : { nombre: { equals: nombre ?? "", mode: "insensitive" as const } };

    const reservas = await prisma.reserva.findMany({
      where,
      orderBy: { fecha: "desc" },
      select: { id: true, fecha: true, personas: true, seccion: true, estado: true, mensaje: true },
    });

    return Response.json(reservas);
  } catch (e) {
    console.error(e);
    return Response.json([], { status: 200 });
  }
}

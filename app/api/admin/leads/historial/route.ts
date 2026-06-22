import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getSessionRole, deny403 } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await getSessionRole())) return deny403();
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
    console.error("[leads/historial]", e);
    return Response.json({ error: "Error al cargar historial" }, { status: 500 });
  }
}


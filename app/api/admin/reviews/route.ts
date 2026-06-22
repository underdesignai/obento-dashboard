import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

export async function GET() {
  if (!(await getSessionRole())) return deny403();
  try {
    const reviews = await prisma.review.findMany({ orderBy: { createdAt: "desc" } });
    return Response.json(reviews);
  } catch (e) {
    console.error("[reviews GET]", e);
    return Response.json({ error: "Error al cargar reviews" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await getSessionRole())) return deny403();
  try {
    const data = await req.json();
    if (!data.nombre || !data.texto) {
      return Response.json({ error: "nombre y texto son requeridos" }, { status: 400 });
    }
    const r = await prisma.review.create({ data });
    return Response.json(r, { status: 201 });
  } catch (e) {
    console.error("[reviews POST]", e);
    return Response.json({ error: "Error al crear review" }, { status: 500 });
  }
}

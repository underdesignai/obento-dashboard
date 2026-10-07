import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

export async function GET() {
  if (!(await getSessionRole())) return deny403();
  try {
    const ofertas = await prisma.oferta.findMany({ orderBy: { createdAt: "desc" } });
    return Response.json(ofertas);
  } catch (e) {
    console.error("[ofertas GET]", e);
    return Response.json({ error: "Error al cargar ofertas" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await getSessionRole())) return deny403();
  try {
    const { titulo, descripcion, descuento, tipo, badge, validoHasta, activo } = await req.json();
    if (!titulo || !titulo.trim()) {
      return Response.json({ error: "El título de la oferta es obligatorio" }, { status: 400 });
    }

    const o = await prisma.oferta.create({
      data: {
        titulo: titulo.trim(),
        descripcion: descripcion?.trim() || null,
        descuento: descuento !== undefined && descuento !== null && descuento !== "" ? Number(descuento) : null,
        tipo: tipo || "porcentaje",
        badge: badge?.trim() || "PROMO",
        validoHasta: validoHasta?.trim() || null,
        activo: activo !== undefined ? Boolean(activo) : true,
      },
    });
    return Response.json(o, { status: 201 });
  } catch (e) {
    console.error("[ofertas POST]", e);
    return Response.json({ error: "Error al crear la oferta" }, { status: 500 });
  }
}

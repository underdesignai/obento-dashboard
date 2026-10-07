import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

export async function GET() {
  if (!(await getSessionRole())) return deny403();
  try {
    const cupones = await prisma.cupon.findMany({ orderBy: { createdAt: "desc" } });
    return Response.json(cupones);
  } catch (e) {
    console.error("[cupones GET]", e);
    return Response.json({ error: "Error al cargar cupones" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await getSessionRole())) return deny403();
  const { codigo, descuento, tipo, maxUsos, minimo, descripcion } = await req.json();
  if (!codigo || !descuento) return Response.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  try {
    const c = await prisma.cupon.create({
      data: {
        codigo: codigo.toUpperCase().trim(),
        descripcion: descripcion?.trim() || null,
        descuento: Number(descuento),
        tipo: tipo || "porcentaje",
        minimo: minimo ? Number(minimo) : null,
        maxUsos: maxUsos ? Number(maxUsos) : null,
      },
    });
    return Response.json(c, { status: 201 });
  } catch (e) {
    console.error("[cupones POST]", e);
    return Response.json({ error: "El código ya existe" }, { status: 409 });
  }
}

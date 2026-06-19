import { prisma } from "@/lib/prisma";

export async function GET() {
  const cupones = await prisma.cupon.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json(cupones);
}

export async function POST(req: Request) {
  const { codigo, descuento, tipo, maxUsos } = await req.json();
  if (!codigo || !descuento) return Response.json({ error: "Faltan campos" }, { status: 400 });
  try {
    const c = await prisma.cupon.create({
      data: { codigo: codigo.toUpperCase().trim(), descuento: Number(descuento), tipo: tipo || "porcentaje", maxUsos: maxUsos ? Number(maxUsos) : null },
    });
    return Response.json(c, { status: 201 });
  } catch {
    return Response.json({ error: "El código ya existe" }, { status: 409 });
  }
}

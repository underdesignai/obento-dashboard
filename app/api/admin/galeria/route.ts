import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const fotos = await prisma.galeriaFoto.findMany({ orderBy: { orden: "asc" } });
    return Response.json(fotos);
  } catch { return Response.json([]); }
}

export async function POST(req: Request) {
  const data = await req.json();
  const foto = await prisma.galeriaFoto.create({ data });
  return Response.json(foto, { status: 201 });
}

import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

// GET es público: el sitio web lo usa para mostrar la galería a los visitantes
export async function GET() {
  try {
    const fotos = await prisma.galeriaFoto.findMany({ orderBy: { orden: "asc" } });
    return Response.json(fotos);
  } catch (e) {
    console.error("[galeria GET]", e);
    return Response.json([]);
  }
}

export async function POST(req: Request) {
  if (!(await getSessionRole())) return deny403();
  try {
    const data = await req.json();
    if (!data.url) return Response.json({ error: "url es requerida" }, { status: 400 });
    const foto = await prisma.galeriaFoto.create({ data });
    return Response.json(foto, { status: 201 });
  } catch (e) {
    console.error("[galeria POST]", e);
    return Response.json({ error: "Error al crear foto" }, { status: 500 });
  }
}

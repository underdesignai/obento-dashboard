import { prisma } from "@/lib/prisma";

// GET público: sirve imágenes almacenadas en la BD compartida
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const img = await prisma.imagen.findUnique({ where: { id: Number(id) } });
    if (!img) return new Response("Not found", { status: 404 });
    const body = new Uint8Array(img.data);
    return new Response(body, {
      headers: {
        "Content-Type": img.mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    console.error("[imagenes GET]", e);
    return new Response("Error", { status: 500 });
  }
}

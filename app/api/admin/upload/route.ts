import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  const role = await getSessionRole();
  if (!role) return deny403();

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return Response.json({ error: "No file" }, { status: 400 });

    if (!ALLOWED_TYPES.has(file.type)) {
      return Response.json({ error: "Tipo de archivo no permitido (solo jpg, png, webp)" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return Response.json({ error: "Archivo demasiado grande (máx 10MB)" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    // Guardar en la BD compartida para que cualquier app (web incluida) la sirva
    const img = await prisma.imagen.create({
      data: { mime: file.type, data: bytes },
      select: { id: true },
    });

    return Response.json({ url: `/api/imagenes/${img.id}` });
  } catch (e) {
    console.error("[upload]", e);
    return Response.json({ error: "Error al subir archivo" }, { status: 500 });
  }
}

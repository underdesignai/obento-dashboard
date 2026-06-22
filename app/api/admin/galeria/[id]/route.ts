import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionRole())) return deny403();
  const { id } = await params;
  try {
    const body = await req.json();
    const foto = await prisma.galeriaFoto.update({ where: { id: Number(id) }, data: body });
    return Response.json(foto);
  } catch (e) {
    console.error("[galeria/id PATCH]", e);
    return Response.json({ error: "Error al actualizar foto" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionRole())) return deny403();
  const { id } = await params;
  try {
    await prisma.galeriaFoto.delete({ where: { id: Number(id) } });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[galeria/id DELETE]", e);
    return Response.json({ error: "Error al eliminar foto" }, { status: 500 });
  }
}

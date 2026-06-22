import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionRole())) return deny403();
  const { id } = await params;
  try {
    const body = await req.json();
    const item = await prisma.reservaServicio.update({ where: { id: Number(id) }, data: body });
    return Response.json(item);
  } catch (e) {
    console.error("[servicios/id PATCH]", e);
    return Response.json({ error: "Error al actualizar servicio" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionRole())) return deny403();
  const { id } = await params;
  try {
    await prisma.reservaServicio.delete({ where: { id: Number(id) } });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[servicios/id DELETE]", e);
    return Response.json({ error: "Error al eliminar servicio" }, { status: 500 });
  }
}

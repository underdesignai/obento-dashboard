import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionRole())) return deny403();
  const { id } = await params;
  try {
    const body = await req.json();
    const cupon = await prisma.cupon.update({ where: { id: Number(id) }, data: body });
    return Response.json(cupon);
  } catch (e) {
    console.error("[cupones/id PATCH]", e);
    return Response.json({ error: "Error al actualizar cupón" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionRole())) return deny403();
  const { id } = await params;
  try {
    await prisma.cupon.delete({ where: { id: Number(id) } });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[cupones/id DELETE]", e);
    return Response.json({ error: "Error al eliminar cupón" }, { status: 500 });
  }
}

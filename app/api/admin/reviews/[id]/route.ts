import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionRole())) return deny403();
  const { id } = await params;
  try {
    const body = await req.json();
    const review = await prisma.review.update({ where: { id: Number(id) }, data: body });
    return Response.json(review);
  } catch (e) {
    console.error("[reviews/id PATCH]", e);
    return Response.json({ error: "Error al actualizar review" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionRole())) return deny403();
  const { id } = await params;
  try {
    await prisma.review.delete({ where: { id: Number(id) } });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[reviews/id DELETE]", e);
    return Response.json({ error: "Error al eliminar review" }, { status: 500 });
  }
}

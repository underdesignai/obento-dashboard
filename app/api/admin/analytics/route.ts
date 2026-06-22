import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [total, visitas] = await Promise.all([
      prisma.visita.count(),
      prisma.visita.findMany({ select: { pagina: true } }),
    ]);

    const counts = new Map<string, number>();
    for (const v of visitas) {
      counts.set(v.pagina, (counts.get(v.pagina) ?? 0) + 1);
    }
    const stats = [...counts.entries()]
      .map(([pagina, count]) => ({ pagina, _count: { pagina: count } }))
      .sort((a, b) => b._count.pagina - a._count.pagina);

    return Response.json({ total, stats });
  } catch (e) {
    console.error("[analytics]", e);
    return Response.json({ error: "Error al cargar analytics" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { pagina, referrer } = await req.json();
    if (!pagina) return Response.json({ error: "pagina requerida" }, { status: 400 });
    await prisma.visita.create({ data: { pagina, referrer } });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[analytics POST]", e);
    return Response.json({ error: "Error al registrar visita" }, { status: 500 });
  }
}

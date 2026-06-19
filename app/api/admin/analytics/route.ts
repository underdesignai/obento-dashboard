import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [total, stats] = await Promise.all([
      prisma.visita.count(),
      prisma.visita.groupBy({ by: ["pagina"], _count: { pagina: true }, orderBy: { _count: { pagina: "desc" } } }),
    ]);
    return Response.json({ total, stats });
  } catch { return Response.json({ total: 0, stats: [] }); }
}

export async function POST(req: Request) {
  const { pagina, referrer } = await req.json();
  await prisma.visita.create({ data: { pagina, referrer } });
  return Response.json({ ok: true });
}

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pedidos = await prisma.pedido.findMany({ orderBy: { id: "desc" } });

    const menuItems = await prisma.menuItem.findMany({ select: { id: true, imagen: true } });
    const imgMap = Object.fromEntries(menuItems.map((m: {id:number,imagen:string|null}) => [String(m.id), m.imagen]));

    const enriched = pedidos.map(p => {
      const items = (p.items as any[]).map(item => ({
        ...item,
        image: item.image ?? imgMap[String(item.id)] ?? null,
      }));
      return { ...p, items };
    });

    return Response.json(enriched);
  } catch { return Response.json([]); }
}

export async function POST(req: Request) {
  const data = await req.json();
  const p = await prisma.pedido.create({ data });
  return Response.json(p, { status: 201 });
}

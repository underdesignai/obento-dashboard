import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.menuItem.findMany({ orderBy: { categoria: "asc" } });
    return Response.json(items);
  } catch { return Response.json([]); }
}

export async function POST(req: Request) {
  const data = await req.json();
  const item = await prisma.menuItem.create({ data: { ...data, precio: Number(data.precio) } });
  return Response.json(item, { status: 201 });
}

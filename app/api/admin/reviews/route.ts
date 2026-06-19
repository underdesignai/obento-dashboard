import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({ orderBy: { createdAt: "desc" } });
    return Response.json(reviews);
  } catch { return Response.json([]); }
}

export async function POST(req: Request) {
  const data = await req.json();
  const r = await prisma.review.create({ data });
  return Response.json(r, { status: 201 });
}

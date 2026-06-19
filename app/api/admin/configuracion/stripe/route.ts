import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

async function isAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return false;
    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "secret");
    const { payload } = await jwtVerify(token, secret);
    return payload.role === "admin";
  } catch { return false; }
}

export async function GET() {
  if (!await isAdmin()) return Response.json({ error: "No autorizado" }, { status: 403 });
  const rows = await prisma.configuracion.findMany({
    where: { clave: { in: ["stripe_publishable_key", "stripe_secret_key"] } },
  });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.clave] = r.valor;
  return Response.json({
    publishableKey: map["stripe_publishable_key"] ?? "",
    hasSecretKey: !!map["stripe_secret_key"],
    isTestMode: (map["stripe_publishable_key"] ?? "").startsWith("pk_test_"),
  });
}

export async function POST(req: Request) {
  if (!await isAdmin()) return Response.json({ error: "No autorizado" }, { status: 403 });
  const { publishableKey, secretKey } = await req.json();

  if (publishableKey !== undefined) {
    await prisma.configuracion.upsert({
      where: { clave: "stripe_publishable_key" },
      update: { valor: publishableKey },
      create: { clave: "stripe_publishable_key", valor: publishableKey },
    });
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = publishableKey;
  }

  if (secretKey) {
    await prisma.configuracion.upsert({
      where: { clave: "stripe_secret_key" },
      update: { valor: secretKey },
      create: { clave: "stripe_secret_key", valor: secretKey },
    });
    process.env.STRIPE_SECRET_KEY = secretKey;
  }

  return Response.json({ ok: true });
}

import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

const CLAVE = "resend_config";
const OLD_CLAVE = "email_config";

export async function readResendConfig(): Promise<{ apiKey: string; from: string; fromName: string }> {
  // 1. Intentar clave nueva resend_config
  let row = await prisma.configuracion.findUnique({ where: { clave: CLAVE } });
  if (row) {
    try {
      const cfg = JSON.parse(row.valor);
      return {
        apiKey: cfg.apiKey ?? process.env.RESEND_API_KEY ?? "",
        from: cfg.from ?? process.env.EMAIL_FROM ?? "pedidos@obentojapanesefood.es",
        fromName: cfg.fromName ?? "Obento Japanese Food",
      };
    } catch {}
  }

  // 2. Fallback a clave anterior email_config
  row = await prisma.configuracion.findUnique({ where: { clave: OLD_CLAVE } });
  if (row) {
    try {
      const cfg = JSON.parse(row.valor);
      return {
        apiKey: cfg.apiKey ?? process.env.RESEND_API_KEY ?? "",
        from: cfg.from ?? process.env.EMAIL_FROM ?? "pedidos@obentojapanesefood.es",
        fromName: cfg.fromName ?? "Obento Japanese Food",
      };
    } catch {}
  }

  return {
    apiKey: process.env.RESEND_API_KEY ?? "",
    from: process.env.EMAIL_FROM ?? "pedidos@obentojapanesefood.es",
    fromName: "Obento Japanese Food",
  };
}

async function writeResendConfig(cfg: { apiKey: string; from: string; fromName: string }) {
  const valor = JSON.stringify(cfg);
  await prisma.configuracion.upsert({
    where: { clave: CLAVE },
    update: { valor },
    create: { clave: CLAVE, valor },
  });
}

export async function GET() {
  if (!(await getSessionRole())) return deny403();
  const cfg = await readResendConfig();
  return Response.json({
    from: cfg.from,
    fromName: cfg.fromName,
    hasApiKey: !!cfg.apiKey,
    apiKeyMasked: cfg.apiKey ? `${cfg.apiKey.slice(0, 6)}...${cfg.apiKey.slice(-4)}` : "",
  });
}

export async function POST(req: Request) {
  if (!(await getSessionRole())) return deny403();
  const { apiKey, from, fromName } = await req.json();
  const existing = await readResendConfig();

  const updated = {
    apiKey: apiKey ? apiKey.trim() : existing.apiKey,
    from: from ? from.trim() : (existing.from || "pedidos@obentojapanesefood.es"),
    fromName: fromName ? fromName.trim() : (existing.fromName || "Obento Japanese Food"),
  };

  await writeResendConfig(updated);

  if (updated.apiKey) process.env.RESEND_API_KEY = updated.apiKey;
  process.env.EMAIL_FROM = updated.from;

  return Response.json({
    ok: true,
    hasApiKey: !!updated.apiKey,
    apiKeyMasked: updated.apiKey ? `${updated.apiKey.slice(0, 6)}...${updated.apiKey.slice(-4)}` : "",
  });
}

import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

const CLAVE = "email_config";

async function readConfig(): Promise<{ from: string; password: string }> {
  const row = await prisma.configuracion.findUnique({ where: { clave: CLAVE } });
  if (!row) return { from: "", password: "" };
  try {
    const cfg = JSON.parse(row.valor);
    return { from: cfg.from ?? "", password: cfg.password ?? "" };
  } catch {
    return { from: "", password: "" };
  }
}

async function writeConfig(cfg: { from: string; password: string }) {
  const valor = JSON.stringify(cfg);
  await prisma.configuracion.upsert({
    where: { clave: CLAVE },
    update: { valor },
    create: { clave: CLAVE, valor },
  });
}

export async function GET() {
  if (!(await getSessionRole())) return deny403();
  const cfg = await readConfig();
  return Response.json({ from: cfg.from, hasPassword: !!cfg.password });
}

export async function POST(req: Request) {
  if (!(await getSessionRole())) return deny403();
  const { from, password } = await req.json();
  const existing = await readConfig();
  const updated = {
    from: from ?? existing.from,
    // Solo actualizar la contraseña si llega una nueva
    password: password ? password : existing.password,
  };
  await writeConfig(updated);

  // Actualiza las variables de entorno en memoria para uso inmediato
  process.env.EMAIL_FROM = updated.from;
  if (password) process.env.EMAIL_PASSWORD = password;

  return Response.json({ ok: true });
}

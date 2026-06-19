import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "data", "email-config.json");

async function readConfig() {
  try {
    const raw = await readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { from: "", password: "" };
  }
}

export async function GET() {
  const cfg = await readConfig();
  return Response.json({ from: cfg.from, hasPassword: !!cfg.password });
}

export async function POST(req: Request) {
  const { from, password } = await req.json();
  const existing = await readConfig();
  const updated = {
    from: from ?? existing.from,
    password: password ?? existing.password,
  };
  await mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(updated, null, 2));

  // Actualiza las variables de entorno en memoria para que el transporter las use
  process.env.EMAIL_FROM = updated.from;
  if (password) process.env.EMAIL_PASSWORD = password;

  return Response.json({ ok: true });
}

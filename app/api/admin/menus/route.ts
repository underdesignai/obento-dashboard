import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const DATA_PATH = join(process.cwd(), "data", "menus.json");

function readMenus() {
  return JSON.parse(readFileSync(DATA_PATH, "utf-8"));
}

export async function GET() {
  try {
    return Response.json(readMenus());
  } catch {
    return Response.json({ mexicana: [], sushi: [], bebidas: [] });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    writeFileSync(DATA_PATH, JSON.stringify(body, null, 2), "utf-8");
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

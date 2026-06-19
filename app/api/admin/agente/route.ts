import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const CONFIG_PATH = join(process.cwd(), "data", "agent-config.json");

function readConfig() {
  return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
}

export async function GET() {
  try {
    const config = readConfig();
    // Never expose the API key to the client
    const { apiKey, ...safe } = config;
    return Response.json({ ...safe, apiKeySet: !!apiKey });
  } catch {
    return Response.json({}, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const current = readConfig();
    // Only update apiKey if a new one is provided
    const merged = {
      ...current,
      ...body,
      apiKey: body.apiKey?.trim() ? body.apiKey.trim() : current.apiKey,
    };
    writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), "utf-8");
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

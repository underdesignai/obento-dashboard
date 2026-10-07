import { getSessionRole, deny403 } from "@/lib/auth";
import { syncCartaToWeb } from "@/lib/syncCarta";

export async function POST() {
  if (!(await getSessionRole())) return deny403();
  try {
    const result = await syncCartaToWeb();
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 500 });
    }
    return Response.json({ ok: true, count: result.count });
  } catch (e: any) {
    console.error("[carta/sync POST]", e);
    return Response.json({ error: e?.message || String(e) }, { status: 500 });
  }
}

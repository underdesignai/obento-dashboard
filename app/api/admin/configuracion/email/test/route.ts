import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

export async function POST(req: Request) {
  if (!(await getSessionRole())) return deny403();
  try {
    const body = await req.json().catch(() => ({}));
    const testTo = body?.to?.trim();

    let apiKey = process.env.RESEND_API_KEY;
    let from = process.env.EMAIL_FROM || "pedidos@obentojapanesefood.es";
    let fromName = "Obento Japanese Food";

    try {
      const row = await prisma.configuracion.findFirst({
        where: { clave: { in: ["resend_config", "email_config"] } },
        orderBy: { clave: "desc" },
      });
      if (row) {
        const cfg = JSON.parse(row.valor);
        if (cfg.apiKey) apiKey = cfg.apiKey;
        if (cfg.from) from = cfg.from;
        if (cfg.fromName) fromName = cfg.fromName;
      }
    } catch {}

    if (!apiKey) {
      return Response.json({
        ok: false,
        msg: "No hay ninguna API Key de Resend configurada. Introduce tu clave (re_...) y pulsa 'Guardar Configuración'.",
      });
    }

    const destinatario = testTo || from;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${from}>`,
        to: [destinatario],
        subject: "Prueba de conexión — Obento Dashboard (Resend)",
        html: `
          <div style="font-family:sans-serif;max-width:540px;margin:20px auto;padding:24px;background:#ffffff;border:1px solid #eee;border-radius:8px;">
            <div style="background:#0a0a0f;padding:16px 20px;border-radius:6px;margin-bottom:16px;">
              <span style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:#c9a84c;letter-spacing:0.1em;">OBENTO</span>
              <span style="margin-left:8px;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.15em;">Restaurant · Murcia</span>
            </div>
            <h3 style="color:#111;margin-top:0;">✅ ¡Conexión con Resend completada con éxito!</h3>
            <p style="font-size:14px;color:#444;line-height:1.5;">Tu API Key de Resend está funcionando correctamente. A partir de ahora, el restaurante podrá enviar confirmaciones automáticas de pedidos y notificaciones a los clientes.</p>
            <div style="background:#f4fdf7;border-left:3px solid #22c55e;padding:12px 14px;margin:16px 0;border-radius:4px;">
              <span style="font-size:12px;color:#15803d;font-weight:600;">Remitente configurado:</span>
              <div style="font-size:13px;color:#166534;margin-top:2px;">${fromName} &lt;${from}&gt;</div>
            </div>
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
            <p style="font-size:11px;color:#999;margin:0;">Enviado desde el panel de administración de Obento Japanese Food.</p>
          </div>
        `,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data?.message || data?.error || `Error HTTP ${res.status}`;
      return Response.json({
        ok: false,
        msg: `Resend respondió con error: ${errorMsg}`,
      });
    }

    return Response.json({
      ok: true,
      msg: `¡Correo de prueba enviado con éxito a ${destinatario}! (ID de Resend: ${data.id || "ok"})`,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return Response.json({ ok: false, msg: `Error al conectar con Resend: ${msg}` });
  }
}

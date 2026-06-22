import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

export async function POST() {
  if (!(await getSessionRole())) return deny403();
  try {
    let from = process.env.EMAIL_FROM;
    let pass = process.env.EMAIL_PASSWORD;

    // Intenta leer de la BD si las env están vacías
    try {
      const row = await prisma.configuracion.findUnique({ where: { clave: "email_config" } });
      if (row) {
        const cfg = JSON.parse(row.valor);
        if (!from) from = cfg.from;
        if (!pass) pass = cfg.password;
      }
    } catch { /* sin config en BD */ }

    if (!from || !pass) {
      return Response.json({ ok: false, msg: "No hay email configurado. Guarda el email y la App Password primero." });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: from, pass },
    });

    await transporter.sendMail({
      from: `"Coyo Restaurant" <${from}>`,
      to: from,
      subject: "Test de email — Coyo Dashboard",
      html: `<p style="font-family:sans-serif">✅ El email está configurado correctamente en el dashboard de Coyo.</p>`,
    });

    return Response.json({ ok: true, msg: `Email de prueba enviado a ${from}` });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return Response.json({ ok: false, msg });
  }
}

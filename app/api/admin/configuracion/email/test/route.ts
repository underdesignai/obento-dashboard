import nodemailer from "nodemailer";
import { readFile } from "fs/promises";
import path from "path";

export async function POST() {
  try {
    let from = process.env.EMAIL_FROM;
    let pass = process.env.EMAIL_PASSWORD;

    // Intenta leer del fichero de config si las env están vacías
    try {
      const raw = await readFile(path.join(process.cwd(), "data", "email-config.json"), "utf-8");
      const cfg = JSON.parse(raw);
      if (!from) from = cfg.from;
      if (!pass) pass = cfg.password;
    } catch { /* no config file yet */ }

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

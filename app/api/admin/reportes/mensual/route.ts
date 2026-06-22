import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";

async function getEmailConfig() {
  let from = process.env.EMAIL_FROM;
  let pass = process.env.EMAIL_PASSWORD;
  try {
    const row = await prisma.configuracion.findUnique({ where: { clave: "email_config" } });
    if (row) {
      const cfg = JSON.parse(row.valor);
      if (!from) from = cfg.from;
      if (!pass) pass = cfg.password;
    }
  } catch { /* sin config en BD */ }
  return { from, pass };
}

function nombreMes(n: number) {
  return ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][n];
}

async function generarPDF(reservas: {
  id: number; nombre: string; fecha: Date; personas: number; seccion: string; estado: string;
}[], mes: number, anyo: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", c => chunks.push(c));
    doc.on("end",  () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const GOLD   = "#C9A84C";
    const DARK   = "#1a1a1a";
    const GRAY   = "#555555";
    const LIGHT  = "#888888";
    const W      = doc.page.width - 100;

    // ── Cabecera ──────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 110).fill(DARK);
    doc.fontSize(28).fillColor(GOLD).font("Helvetica-Bold")
       .text("COYO", 50, 30);
    doc.fontSize(10).fillColor("#aaaaaa").font("Helvetica")
       .text("Mexican Food & Sushi Bar · Oslo", 50, 62);
    doc.fontSize(14).fillColor("#ffffff").font("Helvetica-Bold")
       .text(`Informe mensual de reservas`, 50, 82);

    doc.fillColor(GOLD).rect(0, 110, doc.page.width, 3).fill();

    // ── Periodo ───────────────────────────────────────────────────────────────
    doc.moveDown(1.5);
    doc.fontSize(11).fillColor(GRAY).font("Helvetica")
       .text(`Periodo: ${nombreMes(mes)} ${anyo}`, 50, 130);
    doc.fontSize(10).fillColor(LIGHT)
       .text(`Generado el ${new Date().toLocaleDateString("es-ES", { day:"2-digit", month:"long", year:"numeric" })}`, 50, 148);

    // ── Estadísticas principales ───────────────────────────────────────────
    const confirmadas = reservas.filter(r => r.estado === "confirmada");
    const totalPersonas = confirmadas.reduce((s, r) => s + r.personas, 0);
    const mexican = confirmadas.filter(r => r.seccion === "mexican").length;
    const sushi   = confirmadas.filter(r => r.seccion === "sushi").length;

    const statsY = 175;
    const boxW   = (W - 30) / 3;

    const stats = [
      { label: "Reservas confirmadas", value: String(confirmadas.length) },
      { label: "Total comensales",     value: String(totalPersonas) },
      { label: "Media comensales/reserva", value: confirmadas.length ? (totalPersonas / confirmadas.length).toFixed(1) : "0" },
    ];

    stats.forEach((s, i) => {
      const x = 50 + i * (boxW + 15);
      doc.rect(x, statsY, boxW, 65).fill("#f7f3eb").stroke(GOLD);
      doc.fontSize(22).fillColor(GOLD).font("Helvetica-Bold")
         .text(s.value, x, statsY + 10, { width: boxW, align: "center" });
      doc.fontSize(9).fillColor(GRAY).font("Helvetica")
         .text(s.label, x, statsY + 40, { width: boxW, align: "center" });
    });

    // ── Sección ───────────────────────────────────────────────────────────────
    const secY = statsY + 85;
    doc.fontSize(11).fillColor(DARK).font("Helvetica-Bold").text("Por sección", 50, secY);
    doc.moveTo(50, secY + 16).lineTo(50 + W, secY + 16).strokeColor(GOLD).lineWidth(0.5).stroke();

    const seccionData = [
      { label: "🌮  Mexican", count: mexican, pct: confirmadas.length ? Math.round(mexican / confirmadas.length * 100) : 0 },
      { label: "🍣  Sushi",   count: sushi,   pct: confirmadas.length ? Math.round(sushi   / confirmadas.length * 100) : 0 },
    ];
    seccionData.forEach((s, i) => {
      const y = secY + 26 + i * 22;
      doc.fontSize(10).fillColor(DARK).font("Helvetica").text(s.label, 50, y);
      doc.text(`${s.count} reservas  (${s.pct}%)`, 250, y);
      doc.rect(380, y + 2, Math.round(W * 0.4 * s.pct / 100), 10).fill(GOLD);
      doc.rect(380, y + 2, Math.round(W * 0.4), 10).stroke("#dddddd");
    });

    // ── Desglose semanal ──────────────────────────────────────────────────────
    const semY = secY + 100;
    doc.fontSize(11).fillColor(DARK).font("Helvetica-Bold").text("Desglose semanal", 50, semY);
    doc.moveTo(50, semY + 16).lineTo(50 + W, semY + 16).strokeColor(GOLD).lineWidth(0.5).stroke();

    const porSemana: Record<number, number> = {};
    confirmadas.forEach(r => {
      const d   = new Date(r.fecha);
      const day = d.getDate();
      const sem = Math.ceil(day / 7);
      porSemana[sem] = (porSemana[sem] ?? 0) + 1;
    });

    Object.entries(porSemana).sort(([a],[b]) => Number(a)-Number(b)).forEach(([sem, cnt], i) => {
      const y = semY + 26 + i * 20;
      doc.fontSize(10).fillColor(DARK).font("Helvetica")
         .text(`Semana ${sem}`, 50, y)
         .text(`${cnt} reservas`, 250, y);
    });

    // ── Tabla de reservas ─────────────────────────────────────────────────────
    const tablaY = semY + 26 + Object.keys(porSemana).length * 20 + 20;
    doc.fontSize(11).fillColor(DARK).font("Helvetica-Bold").text("Listado de reservas", 50, tablaY);
    doc.moveTo(50, tablaY + 16).lineTo(50 + W, tablaY + 16).strokeColor(GOLD).lineWidth(0.5).stroke();

    // Cabecera tabla
    const th = tablaY + 24;
    doc.rect(50, th, W, 18).fill(DARK);
    doc.fontSize(9).fillColor("#ffffff").font("Helvetica-Bold")
       .text("#",       55,  th + 4)
       .text("Nombre",  90,  th + 4)
       .text("Fecha",   250, th + 4)
       .text("Hora",    340, th + 4)
       .text("Personas",390, th + 4)
       .text("Sección", 450, th + 4);

    let rowY = th + 22;
    confirmadas.sort((a,b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .forEach((r, i) => {
        if (rowY > doc.page.height - 80) { doc.addPage(); rowY = 50; }
        if (i % 2 === 0) doc.rect(50, rowY - 2, W, 18).fill("#f9f6f0");
        const fecha = new Date(r.fecha);
        doc.fontSize(9).fillColor(DARK).font("Helvetica")
           .text(String(r.id),       55,  rowY)
           .text(r.nombre,           90,  rowY, { width: 155, ellipsis: true })
           .text(fecha.toLocaleDateString("es-ES"), 250, rowY)
           .text(fecha.toLocaleTimeString("es-ES", { hour:"2-digit", minute:"2-digit" }), 340, rowY)
           .text(String(r.personas), 395, rowY)
           .text(r.seccion === "sushi" ? "Sushi" : "Mexican", 450, rowY);
        rowY += 18;
      });

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.fontSize(8).fillColor(LIGHT).font("Helvetica")
       .text("Coyo Restaurant · Oslo · Informe generado automáticamente", 50, doc.page.height - 40, { align: "center", width: W });

    doc.end();
  });
}

export async function POST(req: Request) {
  try {
    // Acepta ?mes=4&anyo=2025 o calcula el mes anterior
    const url    = new URL(req.url);
    const now    = new Date();
    const mes    = Number(url.searchParams.get("mes")  ?? (now.getMonth() === 0 ? 11 : now.getMonth() - 1));
    const anyo   = Number(url.searchParams.get("anyo") ?? (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()));

    const inicio = new Date(anyo, mes, 1);
    const fin    = new Date(anyo, mes + 1, 0, 23, 59, 59);

    const reservas = await prisma.reserva.findMany({
      where: { fecha: { gte: inicio, lte: fin }, estado: "confirmada" },
      orderBy: { fecha: "asc" },
    });

    const pdf = await generarPDF(reservas.map(r => ({ ...r, fecha: new Date(r.fecha) })), mes, anyo);

    const { from, pass } = await getEmailConfig();
    if (!from || !pass) {
      return Response.json({ ok: false, msg: "Email no configurado" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: from, pass } });

    await transporter.sendMail({
      from:    `"Coyo Restaurant" <${from}>`,
      to:      from,
      subject: `Informe mensual de reservas — ${nombreMes(mes)} ${anyo}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
          <div style="background:#1a1a1a;padding:24px;border-radius:8px 8px 0 0">
            <h2 style="color:#C9A84C;margin:0;font-size:22px">Coyo Restaurant</h2>
            <p style="color:#aaa;margin:4px 0 0;font-size:12px">Mexican Food &amp; Sushi Bar · Oslo</p>
          </div>
          <div style="background:#f9f6f0;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e8dfc8">
            <h3 style="color:#1a1a1a;margin:0 0 16px">Informe mensual — ${nombreMes(mes)} ${anyo}</h3>
            <p style="color:#555;line-height:1.6">Adjunto encontrarás el informe de reservas confirmadas del mes de <strong>${nombreMes(mes)} ${anyo}</strong>.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <tr><td style="padding:8px;background:#fff;border:1px solid #e0d8c8;color:#555">Reservas confirmadas</td><td style="padding:8px;background:#fff;border:1px solid #e0d8c8;font-weight:700;color:#C9A84C">${reservas.length}</td></tr>
              <tr><td style="padding:8px;background:#f7f3eb;border:1px solid #e0d8c8;color:#555">Total comensales</td><td style="padding:8px;background:#f7f3eb;border:1px solid #e0d8c8;font-weight:700;color:#C9A84C">${reservas.reduce((s,r)=>s+r.personas,0)}</td></tr>
            </table>
            <p style="color:#888;font-size:12px;margin-top:16px">Este informe se genera automáticamente el día 1 de cada mes.</p>
          </div>
        </div>
      `,
      attachments: [{
        filename: `informe-reservas-${nombreMes(mes).toLowerCase()}-${anyo}.pdf`,
        content:  pdf,
        contentType: "application/pdf",
      }],
    });

    return Response.json({ ok: true, msg: `Informe de ${nombreMes(mes)} ${anyo} enviado a ${from}`, reservas: reservas.length });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return Response.json({ ok: false, msg }, { status: 500 });
  }
}

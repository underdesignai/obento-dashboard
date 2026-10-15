import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export async function getEmailConfig() {
  let resendApiKey = process.env.RESEND_API_KEY;
  let from = process.env.EMAIL_FROM || "pedidos@obentojapanesefood.es";
  let fromName = "Obento Japanese Food";
  let pass = process.env.EMAIL_PASSWORD;

  try {
    const row = await prisma.configuracion.findFirst({
      where: { clave: { in: ["resend_config", "email_config"] } },
      orderBy: { clave: "desc" },
    });
    if (row) {
      const cfg = JSON.parse(row.valor);
      if (cfg.apiKey) resendApiKey = cfg.apiKey;
      if (cfg.from) from = cfg.from;
      if (cfg.fromName) fromName = cfg.fromName;
      if (cfg.password) pass = cfg.password;
    }
  } catch {}

  return { resendApiKey, from, fromName, pass };
}

export type EmailAttachment = {
  filename: string;
  content: Buffer | string;
  contentType?: string;
};

export async function sendEmail({
  to,
  subject,
  html,
  fromOverride,
  attachments,
}: {
  to: string | string[];
  subject: string;
  html: string;
  fromOverride?: string;
  attachments?: EmailAttachment[];
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const cfg = await getEmailConfig();
  const toList = Array.isArray(to) ? to : [to];
  const fromAddress = fromOverride || `${cfg.fromName} <${cfg.from}>`;

  // 1. Enviar prioritariamente con Resend REST API
  if (cfg.resendApiKey) {
    try {
      const resendPayload: any = {
        from: fromAddress,
        to: toList,
        subject,
        html,
      };

      if (attachments && attachments.length > 0) {
        resendPayload.attachments = attachments.map((a) => ({
          filename: a.filename,
          content: Buffer.isBuffer(a.content) ? a.content.toString("base64") : a.content,
        }));
      }

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.resendApiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resendPayload),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { success: true, id: data.id };
      }
      console.warn("[Resend send warning]", data);
    } catch (err: any) {
      console.error("[Resend send error]", err?.message);
    }
  }

  // 2. Fallback a Nodemailer / SMTP si no hay Resend configurado o falló
  if (cfg.from && cfg.pass) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: cfg.from, pass: cfg.pass },
      });
      const info = await transporter.sendMail({
        from: fromAddress,
        to: toList.join(", "),
        subject,
        html,
        attachments,
      });
      return { success: true, id: info.messageId };
    } catch (err: any) {
      console.error("[SMTP Fallback error]", err?.message);
      return { success: false, error: err?.message };
    }
  }

  console.warn(`[Email no enviado] Ni Resend ni SMTP configurados. Destinatario: ${to}, Asunto: ${subject}`);
  return { success: false, error: "No hay proveedor de correo configurado (Resend o SMTP)" };
}

type OrderItem = { name: string; nameEn?: string; qty: number; price: number };

function itemsHtml(items: OrderItem[], lang: string) {
  return items.map(i => `
    <tr>
      <td style="padding:8px 0;color:#333;font-size:14px;">${i.qty}× ${lang === "en" && i.nameEn ? i.nameEn : i.name}</td>
      <td style="padding:8px 0;color:#333;font-size:14px;text-align:right;">${(i.qty * i.price).toLocaleString("es-ES")},-</td>
    </tr>`).join("");
}

function baseLayout(content: string) {
  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="margin:0;padding:0;background:#f5f5f0;font-family:Georgia,serif;">
    <div style="max-width:560px;margin:40px auto;background:#fff;border-top:4px solid #c9a84c;">
      <div style="background:#0a0a0f;padding:24px 32px;display:flex;align-items:center;">
        <span style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#c9a84c;letter-spacing:0.1em;">OBENTO</span>
        <span style="margin-left:8px;font-size:11px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.2em;">Restaurant · Murcia</span>
      </div>
      <div style="padding:32px;">
        ${content}
      </div>
      <div style="background:#f5f5f0;padding:16px 32px;text-align:center;">
        <p style="font-size:11px;color:#999;margin:0;text-transform:uppercase;letter-spacing:0.15em;">C. Amargura, 3 · 30830 La Ñora, Murcia · obentojapanesefood.es</p>
      </div>
    </div>
  </body>
  </html>`;
}

export async function sendOrderConfirmation(to: string, data: {
  nombre: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  horaRecogida?: string;
  lang?: string;
}) {
  const en = data.lang === "en";
  const html = baseLayout(en ? `
    <h1 style="font-size:24px;color:#0a0a0f;margin:0 0 8px;">Order confirmed!</h1>
    <p style="color:#666;font-size:14px;margin:0 0 24px;">Hi ${data.nombre}, we've received your order.</p>
    <div style="background:#f9f7f2;border-left:3px solid #c9a84c;padding:12px 16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Order number</p>
      <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#c9a84c;">${data.orderNumber}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <tr style="border-bottom:1px solid #eee;">
        <th style="padding:8px 0;text-align:left;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Item</th>
        <th style="padding:8px 0;text-align:right;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Price</th>
      </tr>
      ${itemsHtml(data.items, "en")}
      <tr style="border-top:2px solid #0a0a0f;">
        <td style="padding:12px 0;font-weight:700;font-size:15px;color:#0a0a0f;">Total</td>
        <td style="padding:12px 0;font-weight:700;font-size:18px;color:#c9a84c;text-align:right;">${data.total.toLocaleString("es-ES")},-</td>
      </tr>
    </table>
    ${data.horaRecogida ? `<p style="font-size:14px;color:#555;">🕐 Pick-up at <strong>${data.horaRecogida}</strong> — C. Amargura, 3, 30830 La Ñora, Murcia.</p>` : ""}
    <p style="font-size:13px;color:#999;margin-top:24px;">We'll let you know when your order is being prepared.</p>
  ` : `
    <h1 style="font-size:24px;color:#0a0a0f;margin:0 0 8px;">¡Pedido confirmado!</h1>
    <p style="color:#666;font-size:14px;margin:0 0 24px;">Hola ${data.nombre}, hemos recibido tu pedido.</p>
    <div style="background:#f9f7f2;border-left:3px solid #c9a84c;padding:12px 16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Número de pedido</p>
      <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#c9a84c;">${data.orderNumber}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <tr style="border-bottom:1px solid #eee;">
        <th style="padding:8px 0;text-align:left;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Producto</th>
        <th style="padding:8px 0;text-align:right;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Precio</th>
      </tr>
      ${itemsHtml(data.items, "es")}
      <tr style="border-top:2px solid #0a0a0f;">
        <td style="padding:12px 0;font-weight:700;font-size:15px;color:#0a0a0f;">Total</td>
        <td style="padding:12px 0;font-weight:700;font-size:18px;color:#c9a84c;text-align:right;">${data.total.toLocaleString("es-ES")},-</td>
      </tr>
    </table>
    ${data.horaRecogida ? `<p style="font-size:14px;color:#555;">🕐 Recogida a las <strong>${data.horaRecogida}</strong> en C. Amargura, 3, 30830 La Ñora, Murcia.</p>` : ""}
    <p style="font-size:13px;color:#999;margin-top:24px;">Te avisaremos cuando tu pedido esté en preparación.</p>
  `);

  await sendEmail({
    to,
    subject: en ? `Order confirmed · ${data.orderNumber}` : `Pedido confirmado · ${data.orderNumber}`,
    html,
  });
}

export async function sendOrderPreparing(to: string, data: {
  nombre: string;
  orderNumber: string;
  horaRecogida?: string;
  lang?: string;
}) {
  const en = data.lang === "en";
  const html = baseLayout(en ? `
    <h1 style="font-size:24px;color:#0a0a0f;margin:0 0 8px;">Your order is being prepared! 👨‍🍳</h1>
    <p style="color:#666;font-size:14px;margin:0 0 24px;">Hi ${data.nombre}, our team is already working on your order.</p>
    <div style="background:#fffbeb;border-left:3px solid #fbbf24;padding:12px 16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Order</p>
      <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#c9a84c;">${data.orderNumber}</p>
    </div>
    ${data.horaRecogida ? `<p style="font-size:14px;color:#555;">🕐 Pick-up at <strong>${data.horaRecogida}</strong> — C. Amargura, 3, 30830 La Ñora, Murcia.</p>` : ""}
    <p style="font-size:13px;color:#999;margin-top:24px;">We'll let you know when it's ready to pick up.</p>
  ` : `
    <h1 style="font-size:24px;color:#0a0a0f;margin:0 0 8px;">¡Tu pedido está en preparación! 👨‍🍳</h1>
    <p style="color:#666;font-size:14px;margin:0 0 24px;">Hola ${data.nombre}, nuestro equipo ya está preparando tu pedido.</p>
    <div style="background:#fffbeb;border-left:3px solid #fbbf24;padding:12px 16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Pedido</p>
      <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#c9a84c;">${data.orderNumber}</p>
    </div>
    ${data.horaRecogida ? `<p style="font-size:14px;color:#555;">🕐 Recogida a las <strong>${data.horaRecogida}</strong> en C. Amargura, 3, 30830 La Ñora, Murcia.</p>` : ""}
    <p style="font-size:13px;color:#999;margin-top:24px;">Te avisaremos cuando esté listo para recoger.</p>
  `);

  await sendEmail({
    to,
    subject: en ? `Your order is being prepared · ${data.orderNumber}` : `Tu pedido está en preparación · ${data.orderNumber}`,
    html,
  });
}

export async function sendOrderReady(to: string, data: {
  nombre: string;
  orderNumber: string;
  horaRecogida?: string;
  lang?: string;
}) {
  const en = data.lang === "en";
  const html = baseLayout(en ? `
    <h1 style="font-size:24px;color:#0a0a0f;margin:0 0 8px;">Your order is ready! 🎉</h1>
    <p style="color:#666;font-size:14px;margin:0 0 24px;">Hi ${data.nombre}, your order is ready to pick up.</p>
    <div style="background:#f0fdf4;border-left:3px solid #4ade80;padding:12px 16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Order</p>
      <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#c9a84c;">${data.orderNumber}</p>
    </div>
    <p style="font-size:14px;color:#555;">📍 Pick up at <strong>C. Amargura, 3, 30830 La Ñora, Murcia</strong>${data.horaRecogida ? ` — agreed time: <strong>${data.horaRecogida}</strong>` : ""}.</p>
    <p style="font-size:13px;color:#999;margin-top:24px;">Thank you for choosing Obento! We hope to see you again soon.</p>
  ` : `
    <h1 style="font-size:24px;color:#0a0a0f;margin:0 0 8px;">¡Tu pedido está listo! 🎉</h1>
    <p style="color:#666;font-size:14px;margin:0 0 24px;">Hola ${data.nombre}, tu pedido ya está listo para recoger.</p>
    <div style="background:#f0fdf4;border-left:3px solid #4ade80;padding:12px 16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Pedido</p>
      <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#c9a84c;">${data.orderNumber}</p>
    </div>
    <p style="font-size:14px;color:#555;">📍 Recoge en <strong>C. Amargura, 3, 30830 La Ñora, Murcia</strong>${data.horaRecogida ? ` — hora acordada: <strong>${data.horaRecogida}</strong>` : ""}.</p>
    <p style="font-size:13px;color:#999;margin-top:24px;">¡Gracias por elegir Obento! Esperamos verte pronto.</p>
  `);

  await sendEmail({
    to,
    subject: en ? `Your order is ready to pick up! · ${data.orderNumber}` : `¡Tu pedido está listo para recoger! · ${data.orderNumber}`,
    html,
  });
}

export async function sendOrderDelivered(to: string, data: {
  nombre: string;
  orderNumber: string;
  lang?: string;
}) {
  const en = data.lang === "en";
  const html = baseLayout(en ? `
    <h1 style="font-size:24px;color:#0a0a0f;margin:0 0 8px;">Order delivered! 🙌</h1>
    <p style="color:#666;font-size:14px;margin:0 0 24px;">Hi ${data.nombre}, your order <strong style="color:#c9a84c;">${data.orderNumber}</strong> has been delivered. Enjoy!</p>
    <div style="background:#f0fdf4;border-left:3px solid #4ade80;padding:12px 16px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#555;">Thank you for choosing <strong>Obento Restaurant</strong>. We'd love to see you again.</p>
    </div>
    <p style="font-size:13px;color:#999;margin-top:24px;">📍 C. Amargura, 3 · 30830 La Ñora, Murcia · obentojapanesefood.es</p>
  ` : `
    <h1 style="font-size:24px;color:#0a0a0f;margin:0 0 8px;">¡Pedido entregado! 🙌</h1>
    <p style="color:#666;font-size:14px;margin:0 0 24px;">Hola ${data.nombre}, tu pedido <strong style="color:#c9a84c;">${data.orderNumber}</strong> ha sido entregado. ¡Esperamos que lo disfrutes!</p>
    <div style="background:#f0fdf4;border-left:3px solid #4ade80;padding:12px 16px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#555;">Gracias por elegir <strong>Obento Restaurant</strong>. Estaremos encantados de verte de nuevo.</p>
    </div>
    <p style="font-size:13px;color:#999;margin-top:24px;">📍 C. Amargura, 3 · 30830 La Ñora, Murcia · obentojapanesefood.es</p>
  `);

  await sendEmail({
    to,
    subject: en ? `Thank you for your order! · ${data.orderNumber}` : `¡Gracias por tu pedido! · ${data.orderNumber}`,
    html,
  });
}

export async function sendOrderIncident(to: string, data: {
  nombre: string;
  orderNumber: string;
  lang?: string;
}) {
  const en = data.lang === "en";
  const html = baseLayout(en ? `
    <h1 style="font-size:24px;color:#0a0a0f;margin:0 0 8px;">A small hiccup ☕</h1>
    <p style="color:#666;font-size:14px;margin:0 0 24px;">Hi ${data.nombre}, we're writing to you about your order.</p>
    <div style="background:#fff9f0;border-left:3px solid #f97316;padding:16px 20px;margin-bottom:24px;border-radius:0 4px 4px 0;">
      <p style="margin:0;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Order</p>
      <p style="margin:4px 0 8px;font-size:20px;font-weight:700;color:#c9a84c;">${data.orderNumber}</p>
      <p style="margin:0;font-size:15px;color:#333;line-height:1.6;">
        Your order had a brief issue in the kitchen.<br>
        <strong>Have a coffee — it's on us!</strong> ☕<br>
        We'll have it ready in just a moment. Thank you for your patience. 🙏
      </p>
    </div>
    <p style="font-size:13px;color:#999;margin-top:8px;">The Obento team</p>
  ` : `
    <h1 style="font-size:24px;color:#0a0a0f;margin:0 0 8px;">Un pequeño contratiempo ☕</h1>
    <p style="color:#666;font-size:14px;margin:0 0 24px;">Hola ${data.nombre}, te escribimos sobre tu pedido.</p>
    <div style="background:#fff9f0;border-left:3px solid #f97316;padding:16px 20px;margin-bottom:24px;border-radius:0 4px 4px 0;">
      <p style="margin:0;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Pedido</p>
      <p style="margin:4px 0 8px;font-size:20px;font-weight:700;color:#c9a84c;">${data.orderNumber}</p>
      <p style="margin:0;font-size:15px;color:#333;line-height:1.6;">
        Tu pedido ha tenido un breve inconveniente en cocina.<br>
        <strong>¡Tómate un café — nosotros te invitamos!</strong> ☕<br>
        Lo tendremos listo en un momento. Gracias por tu paciencia. 🙏
      </p>
    </div>
    <p style="font-size:13px;color:#999;margin-top:8px;">El equipo de Obento</p>
  `);

  await sendEmail({
    to,
    subject: en ? `Update on your order ${data.orderNumber} · Obento` : `Actualización de tu pedido ${data.orderNumber} · Obento`,
    html,
  });
}

export async function sendReservationConfirmation(to: string, data: {
  nombre: string;
  fecha: string;
  hora: string;
  personas: number;
  seccion?: string;
  cancelToken: string;
  baseUrl: string;
  lang?: string;
}) {
  const en = data.lang === "en";
  const cancelUrl = `${data.baseUrl}/api/reservas/cancelar?token=${data.cancelToken}`;

  const html = baseLayout(en ? `
    <h1 style="font-size:24px;color:#0a0a0f;margin:0 0 8px;">Reservation confirmed!</h1>
    <p style="color:#666;font-size:14px;margin:0 0 24px;">Hi ${data.nombre}, we've received your reservation.</p>
    <div style="background:#f9f7f2;border-left:3px solid #c9a84c;padding:16px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;padding:4px 0;">Date</td><td style="font-size:14px;color:#333;text-align:right;">${data.fecha}</td></tr>
        <tr><td style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;padding:4px 0;">Time</td><td style="font-size:14px;font-weight:700;color:#c9a84c;text-align:right;">${data.hora}</td></tr>
        <tr><td style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;padding:4px 0;">Guests</td><td style="font-size:14px;color:#333;text-align:right;">${data.personas}</td></tr>
      </table>
    </div>
    <p style="font-size:14px;color:#555;margin-bottom:24px;">📍 C. Amargura, 3 · 30830 La Ñora, Murcia. We look forward to seeing you!</p>
    <div style="border-top:1px solid #eee;padding-top:20px;margin-top:8px;text-align:center;">
      <p style="font-size:12px;color:#999;margin-bottom:12px;">Can't make it? Cancel here:</p>
      <a href="${cancelUrl}" style="display:inline-block;padding:10px 24px;background:#0a0a0f;color:#fff;text-decoration:none;border-radius:4px;font-size:13px;font-weight:600;letter-spacing:0.05em;">CANCEL RESERVATION</a>
      <p style="font-size:11px;color:#bbb;margin-top:12px;">Clicking this link will automatically cancel your reservation.</p>
    </div>
  ` : `
    <h1 style="font-size:24px;color:#0a0a0f;margin:0 0 8px;">¡Reserva confirmada!</h1>
    <p style="color:#666;font-size:14px;margin:0 0 24px;">Hola ${data.nombre}, hemos recibido tu reserva correctamente.</p>
    <div style="background:#f9f7f2;border-left:3px solid #c9a84c;padding:16px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;padding:4px 0;">Fecha</td><td style="font-size:14px;color:#333;text-align:right;">${data.fecha}</td></tr>
        <tr><td style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;padding:4px 0;">Hora</td><td style="font-size:14px;font-weight:700;color:#c9a84c;text-align:right;">${data.hora}</td></tr>
        <tr><td style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;padding:4px 0;">Personas</td><td style="font-size:14px;color:#333;text-align:right;">${data.personas}</td></tr>
      </table>
    </div>
    <p style="font-size:14px;color:#555;margin-bottom:24px;">📍 C. Amargura, 3 · 30830 La Ñora, Murcia. ¡Te esperamos!</p>
    <div style="border-top:1px solid #eee;padding-top:20px;margin-top:8px;text-align:center;">
      <p style="font-size:12px;color:#999;margin-bottom:12px;">¿No puedes venir? Cancela aquí:</p>
      <a href="${cancelUrl}" style="display:inline-block;padding:10px 24px;background:#0a0a0f;color:#fff;text-decoration:none;border-radius:4px;font-size:13px;font-weight:600;letter-spacing:0.05em;">CANCELAR RESERVA</a>
      <p style="font-size:11px;color:#bbb;margin-top:12px;">Al hacer clic tu reserva quedará cancelada automáticamente.</p>
    </div>
  `);

  await sendEmail({
    to,
    subject: en ? `Reservation confirmed · ${data.fecha} at ${data.hora}` : `Reserva confirmada · ${data.fecha} a las ${data.hora}`,
    html,
  });
}

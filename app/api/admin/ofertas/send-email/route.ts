import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";
import nodemailer from "nodemailer";

async function getEmailTransporter() {
  let from = process.env.EMAIL_FROM || "pedidos@obentojapanesefood.es";
  let pass = process.env.EMAIL_PASSWORD;

  try {
    const row = await prisma.configuracion.findUnique({ where: { clave: "email_config" } });
    if (row) {
      const cfg = JSON.parse(row.valor);
      if (cfg.from) from = cfg.from;
      if (cfg.password) pass = cfg.password;
    }
  } catch {
    // ignorar error de lectura de config
  }

  if (pass) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: from, pass },
    });
    return { transporter, from };
  }

  return { transporter: null, from };
}

function generateOfferEmailHtml(params: {
  nombreCliente: string;
  asunto: string;
  mensaje: string;
  ofertaTitulo: string;
  ofertaDescripcion?: string;
  ofertaBadge?: string;
  ofertaValidoHasta?: string;
}) {
  const {
    nombreCliente,
    asunto,
    mensaje,
    ofertaTitulo,
    ofertaDescripcion,
    ofertaBadge,
    ofertaValidoHasta,
  } = params;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${asunto}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0908; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3ede0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0908; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Contenedor Principal del Email -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #141110; border-radius: 16px; overflow: hidden; border: 1px solid rgba(200, 30, 34, 0.35); box-shadow: 0 16px 40px rgba(0,0,0,0.6);">
          
          <!-- Encabezado con Logotipo Obento -->
          <tr>
            <td align="center" style="background: linear-gradient(180deg, #1f1011 0%, #141110 100%); padding: 32px 24px 20px; border-bottom: 1px solid rgba(200, 30, 34, 0.2);">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background: #c81e22; color: #ffffff; font-weight: 900; font-size: 11px; letter-spacing: 0.25em; padding: 4px 12px; border-radius: 4px; text-transform: uppercase; margin-bottom: 8px;">
                      OBENTO JAPANESE FOOD
                    </div>
                    <h1 style="margin: 8px 0 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: 0.05em; font-family: 'Georgia', serif;">
                      お弁当 · OBENTO
                    </h1>
                    <p style="margin: 4px 0 0; font-size: 12px; color: #c9a84c; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">
                      Auténtico Sushi Takeaway & Bar
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cuerpo del Email -->
          <tr>
            <td style="padding: 32px 28px;">
              
              <!-- Saludo personalizado -->
              <p style="margin: 0 0 16px; font-size: 16px; color: #ffffff; font-weight: 700;">
                ¡Hola, ${nombreCliente}! 👋
              </p>

              <!-- Gancho / Mensaje personalizado de la oferta -->
              <div style="background: rgba(200, 30, 34, 0.08); border-left: 4px solid #c81e22; border-radius: 0 10px 10px 0; padding: 16px 20px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #f3ede0; font-weight: 500;">
                  ${mensaje.replace(/\n/g, "<br />")}
                </p>
              </div>

              <!-- Tarjeta destacada de la Oferta -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, rgba(35, 18, 19, 0.9) 0%, rgba(20, 15, 15, 0.95) 100%); border: 1px solid rgba(200, 30, 34, 0.4); border-radius: 12px; margin-bottom: 28px; padding: 20px;">
                <tr>
                  <td>
                    <table border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 10px;">
                      <tr>
                        <td>
                          <span style="background: #c81e22; color: #ffffff; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.08em; text-transform: uppercase;">
                            ${ofertaBadge || "PROMO EXCLUSIVA"}
                          </span>
                        </td>
                      </tr>
                    </table>
                    <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 800; color: #ffffff;">
                      ${ofertaTitulo}
                    </h2>
                    ${
                      ofertaDescripcion
                        ? `<p style="margin: 0 0 12px; font-size: 13px; color: rgba(255, 255, 255, 0.7); line-height: 1.5;">${ofertaDescripcion}</p>`
                        : ""
                    }
                    ${
                      ofertaValidoHasta
                        ? `<div style="font-size: 12px; color: #ff999b; font-weight: 600;">
                            📅 Validez: ${ofertaValidoHasta}
                          </div>`
                        : ""
                    }
                  </td>
                </tr>
              </table>

              <!-- Botón Llamado a la Acción (CTA) -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="https://obentojapanesefood.es/carta" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #c81e22 0%, #851316 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; box-shadow: 0 6px 20px rgba(200, 30, 34, 0.4); border: 1px solid rgba(255,255,255,0.2);">
                      🍣 PEDIR ONLINE Y RECLAMAR OFERTA
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; text-align: center; font-size: 12px; color: rgba(255, 255, 255, 0.45);">
                * Válido para pedidos online en nuestra página web o recogida en tienda.
              </p>

            </td>
          </tr>

          <!-- Pie del Email (Footer con dirección y RGPD) -->
          <tr>
            <td style="background-color: #0d0b0a; padding: 24px; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #f3ede0;">
                Obento Japanese Food
              </p>
              <p style="margin: 0 0 12px; font-size: 11px; color: rgba(255, 255, 255, 0.4); line-height: 1.5;">
                C/ Trapería, Murcia · Tel: +34 968 00 00 00<br />
                Horario Takeaway: Martes a Domingo 13:00 - 16:00 | 20:00 - 23:30
              </p>
              <p style="margin: 0; font-size: 10px; color: rgba(255, 255, 255, 0.25);">
                Recibes este correo porque has realizado pedidos o reservas en Obento Japanese Food.<br />
                <a href="https://obentojapanesefood.es" style="color: #c9a84c; text-decoration: underline;">Visitar web oficial</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function POST(req: Request) {
  if (!(await getSessionRole())) return deny403();

  try {
    const body = await req.json();
    const {
      asunto,
      mensaje,
      destinatarios,
      ofertaTitulo,
      ofertaDescripcion,
      ofertaBadge,
      ofertaValidoHasta,
    } = body || {};

    if (!asunto || !asunto.trim()) {
      return Response.json({ error: "El asunto del correo es obligatorio" }, { status: 400 });
    }
    if (!mensaje || !mensaje.trim()) {
      return Response.json({ error: "El mensaje del correo es obligatorio" }, { status: 400 });
    }
    if (!Array.isArray(destinatarios) || destinatarios.length === 0) {
      return Response.json({ error: "Debes seleccionar al menos un cliente destinatario" }, { status: 400 });
    }

    const { transporter, from } = await getEmailTransporter();

    let enviadosCount = 0;
    const errors: string[] = [];

    for (const d of destinatarios) {
      const email = typeof d === "string" ? d : d.email;
      const nombre = (typeof d === "object" && d.nombre) ? d.nombre : "Cliente";

      if (!email || !email.includes("@")) continue;

      const html = generateOfferEmailHtml({
        nombreCliente: nombre,
        asunto,
        mensaje,
        ofertaTitulo: ofertaTitulo || "Oferta Exclusiva",
        ofertaDescripcion,
        ofertaBadge,
        ofertaValidoHasta,
      });

      if (transporter) {
        try {
          await transporter.sendMail({
            from: `"Obento Japanese Food" <${from}>`,
            to: email,
            subject: asunto,
            html,
          });
          enviadosCount++;
        } catch (mailErr: any) {
          console.error(`[Error enviando a ${email}]:`, mailErr);
          errors.push(`${email}: ${mailErr.message}`);
        }
      } else {
        // Modo simulado / desarrollo si no hay credenciales SMTP configuradas
        console.log(`[Simulación Email Oferta] Enviado a ${nombre} <${email}>: "${asunto}"`);
        enviadosCount++;
      }
    }

    return Response.json({
      ok: true,
      enviados: enviadosCount,
      totalSolicitados: destinatarios.length,
      modo: transporter ? "smtp" : "simulado",
      message: `¡Campaña enviada exitosamente a ${enviadosCount} cliente(s)!`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("[ofertas/send-email POST]", error);
    return Response.json({ error: error.message || "Error al procesar el envío de correos" }, { status: 500 });
  }
}

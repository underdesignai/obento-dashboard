import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getSessionRole, deny403 } from "@/lib/auth";
import PDFDocument from "pdfkit";

export async function GET(req: NextRequest) {
  if (!(await getSessionRole())) return deny403();

  try {
    const { searchParams } = new URL(req.url);
    const tipo = (searchParams.get("tipo") || "diario") as "diario" | "semanal";
    const fechaParam = searchParams.get("fecha");

    const refDate = fechaParam ? new Date(fechaParam) : new Date();
    if (isNaN(refDate.getTime())) {
      return Response.json({ error: "Fecha inválida" }, { status: 400 });
    }

    let startDate: Date;
    let endDate: Date;
    let periodoTexto: string;

    if (tipo === "diario") {
      startDate = new Date(refDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(refDate);
      endDate.setHours(23, 59, 59, 999);
      periodoTexto = refDate.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } else {
      // Semanal: Lunes a Domingo
      const d = new Date(refDate);
      const day = d.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      startDate = new Date(d);
      startDate.setDate(d.getDate() + diffToMonday);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);

      const f1 = startDate.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
      const f2 = endDate.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
      periodoTexto = `Semana del ${f1} al ${f2}`;
    }

    const pedidos = await prisma.pedidos.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { created_at: "asc" },
      include: { pedido_items: true },
    });

    // Generar PDF con PDFKit
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const chunks: Buffer[] = [];
      doc.on("data", c => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const GOLD = "#C9A84C";
      const DARK = "#111216";
      const TEXT_LIGHT = "#9CA3AF";
      const TEXT_DARK = "#1F2937";
      const W = doc.page.width - 80;

      // ── Cabecera ──────────────────────────────────────────────
      doc.rect(0, 0, doc.page.width, 100).fill(DARK);
      doc.fontSize(24).fillColor(GOLD).font("Helvetica-Bold")
         .text("OBENTO JAPANESE FOOD", 40, 25);
      doc.fontSize(10).fillColor("#E5E7EB").font("Helvetica")
         .text("Calle Mayor 45 · Tel: 910 000 000 · Madrid", 40, 52);

      const titulo = tipo === "diario"
        ? "INFORME DIARIO DE REPARTOS Y DELIVERY"
        : "INFORME SEMANAL DE REPARTOS Y DELIVERY";

      doc.fontSize(12).fillColor("#FFFFFF").font("Helvetica-Bold")
         .text(titulo, 40, 72);

      // Franja dorada decorativa
      doc.rect(0, 100, doc.page.width, 3).fill(GOLD);

      // ── Periodo y Generación ───────────────────────────────────
      doc.fontSize(11).fillColor(TEXT_DARK).font("Helvetica-Bold")
         .text(`Periodo: ${periodoTexto.toUpperCase()}`, 40, 118);
      doc.fontSize(9).fillColor(TEXT_LIGHT).font("Helvetica")
         .text(`Documento generado el ${new Date().toLocaleDateString("es-ES")} a las ${new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`, 40, 134);

      // ── Cajas de KPIs ──────────────────────────────────────────
      const totalRepartos = pedidos.length;
      const facturacion = pedidos.reduce((acc, p) => acc + Number(p.total || 0), 0);
      const efectivo = pedidos
        .filter(p => p.metodo_pago === "local" || p.metodo_pago === "restaurante")
        .reduce((acc, p) => acc + Number(p.total || 0), 0);
      const online = facturacion - efectivo;
      const tiemposValidos = pedidos.filter(p => p.tiempo_entrega_minutos && p.tiempo_entrega_minutos > 0);
      const tiempoMedio = tiemposValidos.length > 0
        ? Math.round(tiemposValidos.reduce((a, b) => a + (b.tiempo_entrega_minutos || 0), 0) / tiemposValidos.length)
        : 24;

      const kpiY = 155;
      const boxW = (W - 30) / 4;

      const kpis = [
        { label: "Total Repartos", val: String(totalRepartos), sub: `${pedidos.filter(p => p.estado_pedido === "entregado").length} entregados` },
        { label: "Facturación Delivery", val: `${facturacion.toFixed(2)} €`, sub: "Total del periodo" },
        { label: "Tiempo Medio", val: `${tiempoMedio} min`, sub: "Salida a puerta" },
        { label: "Efectivo a Liquidar", val: `${efectivo.toFixed(2)} €`, sub: `Online: ${online.toFixed(2)} €` },
      ];

      kpis.forEach((k, idx) => {
        const x = 40 + idx * (boxW + 10);
        doc.rect(x, kpiY, boxW, 58).fill("#F9FAFB").stroke("#E5E7EB");
        doc.fontSize(8.5).fillColor(TEXT_LIGHT).font("Helvetica-Bold")
           .text(k.label.toUpperCase(), x, kpiY + 8, { width: boxW, align: "center" });
        doc.fontSize(15).fillColor(GOLD).font("Helvetica-Bold")
           .text(k.val, x, kpiY + 22, { width: boxW, align: "center" });
        doc.fontSize(7.5).fillColor("#6B7280").font("Helvetica")
           .text(k.sub, x, kpiY + 42, { width: boxW, align: "center" });
      });

      // ── Resumen de Repartidores ────────────────────────────────
      let curY = kpiY + 75;
      doc.fontSize(11).fillColor(DARK).font("Helvetica-Bold")
         .text("Rendimiento del Equipo de Reparto", 40, curY);
      doc.moveTo(40, curY + 16).lineTo(40 + W, curY + 16).strokeColor(GOLD).lineWidth(0.8).stroke();

      curY += 22;

      // Encabezado tabla repartidores
      doc.rect(40, curY, W, 20).fill("#F3F4F6");
      doc.fontSize(8.5).fillColor("#374151").font("Helvetica-Bold");
      doc.text("REPARTIDOR", 50, curY + 6);
      doc.text("ENVÍOS", 200, curY + 6, { width: 60, align: "center" });
      doc.text("TIEMPO MEDIO", 280, curY + 6, { width: 80, align: "center" });
      doc.text("COBRADO EN MANO (EFECTIVO)", 380, curY + 6, { width: 140, align: "right" });

      curY += 20;

      // Agrupar repartidores
      const repMap = new Map<string, { total: number; efectivo: number; tiempos: number[] }>();
      pedidos.forEach(p => {
        const rName = p.repartidor_nombre || "Sin Asignar";
        if (!repMap.has(rName)) repMap.set(rName, { total: 0, efectivo: 0, tiempos: [] });
        const item = repMap.get(rName)!;
        item.total++;
        if (p.metodo_pago === "local" || p.metodo_pago === "restaurante") {
          item.efectivo += Number(p.total || 0);
        }
        if (p.tiempo_entrega_minutos) item.tiempos.push(p.tiempo_entrega_minutos);
      });

      if (repMap.size === 0) {
        doc.fontSize(9).fillColor(TEXT_LIGHT).font("Helvetica")
           .text("No se registraron repartos en este periodo.", 50, curY + 6);
        curY += 20;
      } else {
        Array.from(repMap.entries()).forEach(([nombre, data], i) => {
          if (i % 2 === 1) doc.rect(40, curY, W, 18).fill("#FAFAFA");
          doc.fontSize(9).fillColor(TEXT_DARK).font("Helvetica");
          doc.text(nombre, 50, curY + 5);
          doc.text(String(data.total), 200, curY + 5, { width: 60, align: "center" });
          const tProm = data.tiempos.length ? Math.round(data.tiempos.reduce((a, b) => a + b, 0) / data.tiempos.length) : 22;
          doc.text(`${tProm} min`, 280, curY + 5, { width: 80, align: "center" });
          doc.font("Helvetica-Bold").text(`${data.efectivo.toFixed(2)} €`, 380, curY + 5, { width: 140, align: "right" });
          curY += 18;
        });
      }

      // ── Detalle de Pedidos ─────────────────────────────────────
      curY += 15;
      if (curY > 620) {
        doc.addPage();
        curY = 40;
      }

      doc.fontSize(11).fillColor(DARK).font("Helvetica-Bold")
         .text("Detalle de Envíos Realizados", 40, curY);
      doc.moveTo(40, curY + 16).lineTo(40 + W, curY + 16).strokeColor(GOLD).lineWidth(0.8).stroke();

      curY += 22;

      // Encabezado pedidos
      doc.rect(40, curY, W, 20).fill("#F3F4F6");
      doc.fontSize(8).fillColor("#374151").font("Helvetica-Bold");
      doc.text("HORA / Nº", 46, curY + 6);
      doc.text("CLIENTE", 110, curY + 6);
      doc.text("DIRECCIÓN / CP", 230, curY + 6);
      doc.text("REPARTIDOR", 370, curY + 6);
      doc.text("ESTADO", 450, curY + 6);
      doc.text("TOTAL", 500, curY + 6, { width: 45, align: "right" });

      curY += 20;

      pedidos.forEach((p, idx) => {
        if (curY > 750) {
          doc.addPage();
          curY = 40;
          doc.rect(40, curY, W, 20).fill("#F3F4F6");
          doc.fontSize(8).fillColor("#374151").font("Helvetica-Bold");
          doc.text("HORA / Nº", 46, curY + 6);
          doc.text("CLIENTE", 110, curY + 6);
          doc.text("DIRECCIÓN / CP", 230, curY + 6);
          doc.text("REPARTIDOR", 370, curY + 6);
          doc.text("ESTADO", 450, curY + 6);
          doc.text("TOTAL", 500, curY + 6, { width: 45, align: "right" });
          curY += 20;
        }

        if (idx % 2 === 1) doc.rect(40, curY, W, 22).fill("#FAFAFA");
        doc.fontSize(8).fillColor(TEXT_DARK).font("Helvetica");

        const hora = p.created_at ? new Date(p.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "--:--";
        doc.text(`${hora} · ${p.numero_pedido}`, 46, curY + 4, { width: 60 });
        doc.text(p.cliente_nombre.substring(0, 22), 110, curY + 4, { width: 115 });
        const dir = `${p.direccion_entrega || "En local"} ${p.codigo_postal ? `(${p.codigo_postal})` : ""}`;
        doc.text(dir.substring(0, 32), 230, curY + 4, { width: 135 });
        doc.text((p.repartidor_nombre || "—").substring(0, 15), 370, curY + 4, { width: 75 });
        doc.text(p.estado_pedido.toUpperCase(), 450, curY + 4, { width: 45 });
        doc.font("Helvetica-Bold").text(`${Number(p.total).toFixed(2)} €`, 500, curY + 4, { width: 45, align: "right" });

        curY += 22;
      });

      // ── Firma y Cuadre de Caja ─────────────────────────────────
      curY += 25;
      if (curY > 730) {
        doc.addPage();
        curY = 40;
      }

      doc.rect(40, curY, W, 50).fill("#FFFBEB").stroke("#FDE68A");
      doc.fontSize(9).fillColor("#92400E").font("Helvetica-Bold")
         .text("CONCILIACIÓN Y LIQUIDACIÓN DE CAJA", 50, curY + 8);
      doc.fontSize(8.5).fillColor("#78350F").font("Helvetica")
         .text(`Total en efectivo a ingresar en caja: ${efectivo.toFixed(2)} €  ·  Total facturado digitalmente: ${online.toFixed(2)} €`, 50, curY + 22);
      doc.text("Firma del Responsable de Turno: ____________________________________", 50, curY + 36);

      doc.end();
    });

    const filename = `reporte-repartos-${tipo}-${startDate.toISOString().slice(0, 10)}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[repartos reporte PDF]", error);
    return Response.json({ error: "Error al generar reporte PDF" }, { status: 500 });
  }
}

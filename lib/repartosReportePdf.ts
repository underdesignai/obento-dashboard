import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";

export async function generarReporteRepartosPdf({
  tipo,
  fechaParam,
}: {
  tipo: "diario" | "semanal";
  fechaParam?: string;
}): Promise<{
  pdfBuffer: Buffer;
  filename: string;
  periodoTexto: string;
  totalRepartos: number;
  facturacionTotal: number;
  efectivoTotal: number;
}> {
  const refDate = fechaParam ? new Date(fechaParam) : new Date();
  if (isNaN(refDate.getTime())) {
    throw new Error("Fecha inválida");
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

  const totalRepartos = pedidos.length;
  const facturacionTotal = pedidos.reduce((acc, p) => acc + Number(p.total || 0), 0);
  const efectivoTotal = pedidos
    .filter(p => p.metodo_pago === "local" || p.metodo_pago === "restaurante")
    .reduce((acc, p) => acc + Number(p.total || 0), 0);
  const onlineTotal = facturacionTotal - efectivoTotal;

  const tiemposValidos = pedidos.filter(p => p.tiempo_entrega_minutos && p.tiempo_entrega_minutos > 0);
  const tiempoMedio = tiemposValidos.length > 0
    ? Math.round(tiemposValidos.reduce((a, b) => a + (b.tiempo_entrega_minutos || 0), 0) / tiemposValidos.length)
    : 24;

  const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", c => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const GOLD = "#C9A84C";
    const DARK = "#111216";
    const TEXT_LIGHT = "#9CA3AF";
    const TEXT_DARK = "#1F2937";
    const W = doc.page.width - 80;

    // Función cabecera común
    const printHeader = (subtitulo: string) => {
      doc.rect(0, 0, doc.page.width, 95).fill(DARK);
      doc.fontSize(22).fillColor(GOLD).font("Helvetica-Bold")
         .text("OBENTO JAPANESE FOOD", 40, 22);
      doc.fontSize(9.5).fillColor("#E5E7EB").font("Helvetica")
         .text("La Ñora · Murcia · Delivery & Take Away Oficial", 40, 48);
      doc.fontSize(11).fillColor("#FFFFFF").font("Helvetica-Bold")
         .text(subtitulo.toUpperCase(), 40, 68);
      doc.rect(0, 95, doc.page.width, 3).fill(GOLD);
    };

    // ══════════════════════════════════════════════════════════════════
    // PÁGINA 1: RESUMEN EJECUTIVO
    // ══════════════════════════════════════════════════════════════════
    const tituloPrincipal = tipo === "semanal"
      ? "INFORME SEMANAL CONSOLIDADO DE REPARTOS (LUNES A DOMINGO)"
      : "INFORME DIARIO DE REPARTOS";
    printHeader(tituloPrincipal);

    // Periodo
    doc.fontSize(10.5).fillColor(TEXT_DARK).font("Helvetica-Bold")
       .text(`PERIODO: ${periodoTexto.toUpperCase()}`, 40, 114);
    doc.fontSize(8.5).fillColor(TEXT_LIGHT).font("Helvetica")
       .text(`Generado automáticamente el ${new Date().toLocaleDateString("es-ES")} a las ${new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`, 40, 128);

    // 4 Cajas KPIs
    const kpiY = 145;
    const boxW = (W - 30) / 4;
    const kpis = [
      { label: "Total Repartos", val: String(totalRepartos), sub: `${pedidos.filter(p => p.estado_pedido === "entregado").length} entregados` },
      { label: "Facturación Delivery", val: `${facturacionTotal.toFixed(2)} €`, sub: `Ticket medio: ${(totalRepartos > 0 ? facturacionTotal / totalRepartos : 0).toFixed(2)} €` },
      { label: "Tiempo Medio", val: `${tiempoMedio} min`, sub: "Salida a entrega" },
      { label: "Efectivo a Liquidar", val: `${efectivoTotal.toFixed(2)} €`, sub: `Online: ${onlineTotal.toFixed(2)} €` },
    ];

    kpis.forEach((k, idx) => {
      const x = 40 + idx * (boxW + 10);
      doc.rect(x, kpiY, boxW, 58).fill("#F9FAFB").stroke("#E5E7EB");
      doc.fontSize(8).fillColor(TEXT_LIGHT).font("Helvetica-Bold")
         .text(k.label.toUpperCase(), x, kpiY + 8, { width: boxW, align: "center" });
      doc.fontSize(14).fillColor(GOLD).font("Helvetica-Bold")
         .text(k.val, x, kpiY + 22, { width: boxW, align: "center" });
      doc.fontSize(7.5).fillColor("#6B7280").font("Helvetica")
         .text(k.sub, x, kpiY + 42, { width: boxW, align: "center" });
    });

    // ── Resumen de los 7 Días de la Semana (si es semanal) ──
    let curY = kpiY + 72;
    if (tipo === "semanal") {
      doc.fontSize(10).fillColor(DARK).font("Helvetica-Bold")
         .text("Rastreo de Actividad por Día de la Semana", 40, curY);
      doc.moveTo(40, curY + 14).lineTo(40 + W, curY + 14).strokeColor(GOLD).lineWidth(0.8).stroke();
      curY += 20;

      const nombresDias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
      const dayBoxW = (W - 30) / 7;

      nombresDias.forEach((nombreDia, idx) => {
        const curDate = new Date(startDate);
        curDate.setDate(startDate.getDate() + idx);

        const pedidosDia = pedidos.filter(p => {
          if (!p.created_at) return false;
          const pDate = new Date(p.created_at);
          return (
            pDate.getFullYear() === curDate.getFullYear() &&
            pDate.getMonth() === curDate.getMonth() &&
            pDate.getDate() === curDate.getDate()
          );
        });

        const totalDia = pedidosDia.length;
        const factDia = pedidosDia.reduce((s, p) => s + Number(p.total || 0), 0);
        const x = 40 + idx * (dayBoxW + 5);

        doc.rect(x, curY, dayBoxW, 44).fill(totalDia > 0 ? "#F0FDF4" : "#F9FAFB").stroke(totalDia > 0 ? "#BBF7D0" : "#E5E7EB");
        doc.fontSize(7.5).fillColor(TEXT_DARK).font("Helvetica-Bold")
           .text(nombreDia.toUpperCase(), x, curY + 6, { width: dayBoxW, align: "center" });
        doc.fontSize(11).fillColor(totalDia > 0 ? "#15803D" : "#9CA3AF").font("Helvetica-Bold")
           .text(`${totalDia} envíos`, x, curY + 18, { width: dayBoxW, align: "center" });
        doc.fontSize(7).fillColor("#6B7280").font("Helvetica")
           .text(`${factDia.toFixed(0)} €`, x, curY + 31, { width: dayBoxW, align: "center" });
      });

      curY += 56;
    }

    // ── Rendimiento por Repartidor & Liquidación ──
    doc.fontSize(10).fillColor(DARK).font("Helvetica-Bold")
       .text("Liquidación de Efectivo y Rendimiento por Repartidor", 40, curY);
    doc.moveTo(40, curY + 14).lineTo(40 + W, curY + 14).strokeColor(GOLD).lineWidth(0.8).stroke();
    curY += 20;

    // Encabezado repartidores
    doc.rect(40, curY, W, 18).fill("#F3F4F6");
    doc.fontSize(8).fillColor("#374151").font("Helvetica-Bold");
    doc.text("REPARTIDOR", 50, curY + 5);
    doc.text("TOTAL REPARTOS", 180, curY + 5, { width: 80, align: "center" });
    doc.text("ENTREGADOS", 270, curY + 5, { width: 70, align: "center" });
    doc.text("TIEMPO MEDIO", 350, curY + 5, { width: 70, align: "center" });
    doc.text("EFECTIVO EN MANO (CAJA)", 430, curY + 5, { width: 120, align: "right" });
    curY += 18;

    const repMap = new Map<string, { total: number; entregados: number; efectivo: number; tiempos: number[] }>();
    pedidos.forEach(p => {
      const rName = p.repartidor_nombre || "Sin Asignar";
      if (!repMap.has(rName)) repMap.set(rName, { total: 0, entregados: 0, efectivo: 0, tiempos: [] });
      const item = repMap.get(rName)!;
      item.total++;
      if (p.estado_pedido === "entregado") item.entregados++;
      if (p.metodo_pago === "local" || p.metodo_pago === "restaurante") {
        item.efectivo += Number(p.total || 0);
      }
      if (p.tiempo_entrega_minutos) item.tiempos.push(p.tiempo_entrega_minutos);
    });

    if (repMap.size === 0) {
      doc.fontSize(8.5).fillColor(TEXT_LIGHT).font("Helvetica")
         .text("Sin actividad de reparto registrada en este periodo.", 50, curY + 5);
      curY += 18;
    } else {
      Array.from(repMap.entries()).forEach(([nombre, rData], i) => {
        if (i % 2 === 1) doc.rect(40, curY, W, 18).fill("#FAFAFA");
        doc.fontSize(8.5).fillColor(TEXT_DARK).font("Helvetica");
        doc.text(nombre, 50, curY + 5);
        doc.text(String(rData.total), 180, curY + 5, { width: 80, align: "center" });
        doc.text(String(rData.entregados), 270, curY + 5, { width: 70, align: "center" });
        const tProm = rData.tiempos.length ? Math.round(rData.tiempos.reduce((a, b) => a + b, 0) / rData.tiempos.length) : 22;
        doc.text(`${tProm} min`, 350, curY + 5, { width: 70, align: "center" });
        doc.font("Helvetica-Bold").fillColor(rData.efectivo > 0 ? "#B45309" : "#15803D")
           .text(`${rData.efectivo.toFixed(2)} €`, 430, curY + 5, { width: 120, align: "right" });
        curY += 18;
      });
    }

    // ── Resumen de Códigos Postales Top ──
    curY += 14;
    doc.fontSize(10).fillColor(DARK).font("Helvetica-Bold")
       .text("Distribución por Códigos Postales / Zonas", 40, curY);
    doc.moveTo(40, curY + 14).lineTo(40 + W, curY + 14).strokeColor(GOLD).lineWidth(0.8).stroke();
    curY += 20;

    const cpMap = new Map<string, { total: number; facturacion: number }>();
    pedidos.forEach(p => {
      const cp = p.codigo_postal || "Sin C.P.";
      if (!cpMap.has(cp)) cpMap.set(cp, { total: 0, facturacion: 0 });
      const item = cpMap.get(cp)!;
      item.total++;
      item.facturacion += Number(p.total || 0);
    });

    const cpList = Array.from(cpMap.entries()).sort((a, b) => b[1].total - a[1].total).slice(0, 5);
    if (cpList.length === 0) {
      doc.fontSize(8.5).fillColor(TEXT_LIGHT).font("Helvetica").text("Sin códigos postales registrados.", 50, curY + 5);
      curY += 18;
    } else {
      doc.rect(40, curY, W, 18).fill("#F3F4F6");
      doc.fontSize(8).fillColor("#374151").font("Helvetica-Bold");
      doc.text("CÓDIGO POSTAL", 50, curY + 5);
      doc.text("REPARTOS", 250, curY + 5, { width: 80, align: "center" });
      doc.text("TOTAL FACTURADO", 430, curY + 5, { width: 120, align: "right" });
      curY += 18;

      cpList.forEach(([cp, data], i) => {
        if (i % 2 === 1) doc.rect(40, curY, W, 18).fill("#FAFAFA");
        doc.fontSize(8.5).fillColor(TEXT_DARK).font("Helvetica");
        doc.text(cp, 50, curY + 5);
        doc.text(`${data.total} envíos`, 250, curY + 5, { width: 80, align: "center" });
        doc.font("Helvetica-Bold").text(`${data.facturacion.toFixed(2)} €`, 430, curY + 5, { width: 120, align: "right" });
        curY += 18;
      });
    }

    // ══════════════════════════════════════════════════════════════════
    // PÁGINAS SIGUIENTES: DESGLOSE DETALLADO DÍA POR DÍA
    // ══════════════════════════════════════════════════════════════════
    if (tipo === "semanal") {
      const nombresDias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

      nombresDias.forEach((nombreDia, idx) => {
        const curDate = new Date(startDate);
        curDate.setDate(startDate.getDate() + idx);

        const pedidosDia = pedidos.filter(p => {
          if (!p.created_at) return false;
          const pDate = new Date(p.created_at);
          return (
            pDate.getFullYear() === curDate.getFullYear() &&
            pDate.getMonth() === curDate.getMonth() &&
            pDate.getDate() === curDate.getDate()
          );
        });

        const totalDia = pedidosDia.length;
        const factDia = pedidosDia.reduce((s, p) => s + Number(p.total || 0), 0);
        const efectDia = pedidosDia
          .filter(p => p.metodo_pago === "local" || p.metodo_pago === "restaurante")
          .reduce((s, p) => s + Number(p.total || 0), 0);

        // Si queda poco espacio en la página, añade página
        if (curY > 640 || idx === 0) {
          doc.addPage();
          curY = 35;
          printHeader(`DESGLOSE DIARIO DE REPARTOS: ${nombreDia.toUpperCase()}`);
          curY = 115;
        }

        // Tira del día
        const fechaFormateada = curDate.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
        doc.rect(40, curY, W, 22).fill(totalDia > 0 ? "#1E293B" : "#F3F4F6");
        doc.fontSize(9.5).fillColor(totalDia > 0 ? "#F3EDE0" : "#6B7280").font("Helvetica-Bold");
        doc.text(`📅 ${nombreDia.toUpperCase()} (${fechaFormateada})`, 50, curY + 6);
        doc.fontSize(8.5).fillColor(totalDia > 0 ? GOLD : "#9CA3AF").font("Helvetica-Bold");
        doc.text(
          `${totalDia} pedidos · Facturado: ${factDia.toFixed(2)} € (Efectivo: ${efectDia.toFixed(2)} €)`,
          240,
          curY + 6,
          { width: W - 210, align: "right" }
        );
        curY += 24;

        if (totalDia === 0) {
          doc.fontSize(8.5).fillColor(TEXT_LIGHT).font("Helvetica-Oblique")
             .text("Sin pedidos a domicilio registrados en esta jornada.", 52, curY + 4);
          curY += 22;
        } else {
          // Encabezado pedidos del día
          doc.rect(40, curY, W, 16).fill("#E2E8F0");
          doc.fontSize(7.5).fillColor("#334155").font("Helvetica-Bold");
          doc.text("HORA / PEDIDO", 48, curY + 4);
          doc.text("CLIENTE", 120, curY + 4);
          doc.text("DIRECCIÓN / CP", 230, curY + 4);
          doc.text("REPARTIDOR", 355, curY + 4);
          doc.text("PAGO", 430, curY + 4);
          doc.text("TIEMPO", 480, curY + 4);
          doc.text("TOTAL", 515, curY + 4, { width: 35, align: "right" });
          curY += 16;

          pedidosDia.forEach((p, pIdx) => {
            if (curY > 740) {
              doc.addPage();
              curY = 35;
              printHeader(`DESGLOSE DIARIO DE REPARTOS: ${nombreDia.toUpperCase()} (CONT.)`);
              curY = 115;
            }

            if (pIdx % 2 === 1) doc.rect(40, curY, W, 18).fill("#FAFAFA");
            doc.fontSize(7.5).fillColor(TEXT_DARK).font("Helvetica");

            const hora = p.created_at ? new Date(p.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "--:--";
            doc.text(`${hora} · #${p.numero_pedido}`, 48, curY + 4, { width: 68 });
            doc.text((p.cliente_nombre || "Cliente").substring(0, 20), 120, curY + 4, { width: 105 });
            const dir = `${p.direccion_entrega || "Local"} ${p.codigo_postal ? `(${p.codigo_postal})` : ""}`;
            doc.text(dir.substring(0, 26), 230, curY + 4, { width: 120 });
            doc.text((p.repartidor_nombre || "—").substring(0, 14), 355, curY + 4, { width: 70 });
            const esEfectivo = p.metodo_pago === "local" || p.metodo_pago === "restaurante";
            doc.fillColor(esEfectivo ? "#B45309" : "#2563EB").font(esEfectivo ? "Helvetica-Bold" : "Helvetica")
               .text(esEfectivo ? "Efectivo" : "Online", 430, curY + 4, { width: 45 });
            doc.fillColor(TEXT_DARK).font("Helvetica")
               .text(p.tiempo_entrega_minutos ? `${p.tiempo_entrega_minutos}m` : "—", 480, curY + 4, { width: 30 });
            doc.font("Helvetica-Bold")
               .text(`${Number(p.total).toFixed(2)} €`, 515, curY + 4, { width: 35, align: "right" });

            curY += 18;
          });
          curY += 10;
        }
      });
    }

    // ── Bloque de Firma y Liquidación Semanal al final ──
    if (curY > 670) {
      doc.addPage();
      curY = 50;
    } else {
      curY += 20;
    }

    doc.rect(40, curY, W, 62).fill("#FFFBEB").stroke("#FDE68A");
    doc.fontSize(9.5).fillColor("#92400E").font("Helvetica-Bold")
       .text("CONCILIACIÓN Y LIQUIDACIÓN SEMANAL DE CAJA", 50, curY + 8);
    doc.fontSize(8.5).fillColor("#78350F").font("Helvetica")
       .text(`Total recaudado en efectivo a ingresar en caja: ${efectivoTotal.toFixed(2)} €  ·  Total facturado online: ${onlineTotal.toFixed(2)} €`, 50, curY + 22);
    doc.text("Firma del Administrador / Responsable: _________________________    Fecha de Arqueo: ____/____/________", 50, curY + 42);

    doc.end();
  });

  const filename = `Obento_Repartos_${tipo === "semanal" ? `Semana_${startDate.toISOString().slice(0, 10)}` : `Dia_${startDate.toISOString().slice(0, 10)}`}.pdf`;

  return {
    pdfBuffer,
    filename,
    periodoTexto,
    totalRepartos,
    facturacionTotal,
    efectivoTotal,
  };
}

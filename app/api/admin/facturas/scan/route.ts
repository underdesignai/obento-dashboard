import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // Hasta 2 minutos para PDFs multipágina

function isFiscalSummaryText(text: string): boolean {
  const d = (text || "").toLowerCase().trim();
  if (!d) return false;
  return (
    d.includes("identific. iva") ||
    d.includes("identific iva") ||
    d.includes("identif. iva") ||
    d.includes("identif iva") ||
    d.includes("base imponible") ||
    d.includes("base imp.") ||
    d.includes("cuota iva") ||
    d.includes("cuota de iva") ||
    d.includes("desglose iva") ||
    d.includes("desglose de iva") ||
    d.includes("tipo iva") ||
    d.includes("total factura") ||
    d.includes("total a pagar") ||
    d.includes("total importe") ||
    d.includes("recargo de equiv") ||
    d.includes("recargo equiv") ||
    d.includes("importe iva") ||
    d === "iva" ||
    /^iva\s*[:\-\s]?\s*\d+%?$/i.test(d) ||
    /^(base|total|cuota)\s*(imponible|iva|factura)?$/i.test(d)
  );
}

function sanitizeStockItemMatch(
  items: any[],
  existingStockItems: { id: number; nombre: string; unidad: string }[]
) {
  if (!Array.isArray(items)) return [];

  return items
    .filter((it: any) => {
      const desc = String(it.descripcion || "").trim();
      if (!desc) return false;
      if (isFiscalSummaryText(desc)) return false;
      return true;
    })
    .map((it: any) => {
      const desc = String(it.descripcion || "").trim();
      let matchedStockId = String(it.stockItemId || "").trim();

      // Si no vino vinculado, buscar coincidencia inteligente por nombre
      if (!matchedStockId && desc) {
        const lowerDesc = desc.toLowerCase();
        const match = existingStockItems.find((s) => {
          const sLower = s.nombre.toLowerCase();
          return lowerDesc.includes(sLower) || sLower.includes(lowerDesc);
        });
        if (match) matchedStockId = String(match.id);
      }

      const cantidad = Number(it.cantidad);
      const precio = Number(it.precioUnitario);
      const iva = Number(it.ivaPct);

      return {
        descripcion: desc || "Artículo de compra",
        stockItemId: matchedStockId,
        cantidad: !isNaN(cantidad) && cantidad > 0 ? cantidad : 1,
        unidad: String(it.unidad || "kg").trim() || "unidades",
        precioUnitario: !isNaN(precio) && precio >= 0 ? precio : 0,
        ivaPct: !isNaN(iva) && iva >= 0 ? iva : 10,
      };
    });
}

function sanitizeHeader(header: any) {
  if (!header || typeof header !== "object") return {};
  let fecha = String(header.fechaEmision || "").trim();
  if (!fecha || fecha === "YYYY-MM-DD" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    fecha = new Date().toISOString().split("T")[0];
  }
  return {
    numeroFactura: String(header.numeroFactura || "").trim(),
    proveedor: String(header.proveedor || "").trim(),
    cifProveedor: String(header.cifProveedor || "").trim(),
    fechaEmision: fecha,
    estadoPago: header.estadoPago || "pagado",
  };
}

async function callOpenAIVisionSingle({
  prompt,
  imageBase64,
  mimeType,
  apiKey,
}: {
  prompt: string;
  imageBase64: string;
  mimeType?: string;
  apiKey: string;
}) {
  const content: any[] = [
    { type: "text", text: prompt },
    {
      type: "image_url",
      image_url: {
        url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`,
        detail: "high",
      },
    },
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content }],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 2500,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[OpenAI Error]", res.status, errText);
    let errMsg = `Error de OpenAI (${res.status})`;
    try {
      const errJson = JSON.parse(errText);
      if (errJson?.error?.message) errMsg = errJson.error.message;
    } catch {}
    throw new Error(errMsg);
  }

  const data = await res.json();
  const rawText = data.choices?.[0]?.message?.content || "";
  const firstBrace = rawText.indexOf("{");
  const lastBrace = rawText.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    return {};
  }

  try {
    return JSON.parse(rawText.substring(firstBrace, lastBrace + 1));
  } catch {
    return {};
  }
}

export async function POST(req: Request) {
  const role = await getSessionRole();
  if (!role) return deny403();

  // Revisar API key configurada en el sistema
  const configRow = await prisma.configuracion.findUnique({ where: { clave: "agent_config" } });
  let config: any = {};
  if (configRow?.valor) {
    try { config = JSON.parse(configRow.valor); } catch {}
  }
  const apiKey = config.apiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "No hay ninguna API Key de OpenAI configurada. Introduce tu clave en Configuración > General." },
      { status: 400 }
    );
  }

  // Obtener catálogo de stock para cotejar
  const stockItems = await prisma.stockItem.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, unidad: true, costeUnitario: true },
  });
  const stockCatalog = stockItems.map((s) => `ID: ${s.id} | Nombre: ${s.nombre} | Unidad: ${s.unidad}`).join("\n");

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Petición no válida (FormData requerido)" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No se ha subido ningún archivo" }, { status: 400 });
  }

  const rawType = (file.type || "").toLowerCase().trim();
  const fileName = (file.name || "").toLowerCase().trim();
  const isPdf = rawType.includes("pdf") || fileName.endsWith(".pdf");
  const buffer = Buffer.from(await file.arrayBuffer());

  // Preparar stream de respuesta NDJSON (Newline Delimited JSON)
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  const sendEvent = async (data: any) => {
    try {
      await writer.write(encoder.encode(JSON.stringify(data) + "\n"));
    } catch (e) {
      console.warn("[Stream write warning]", e);
    }
  };

  // Procesamiento asíncrono progresivo página por página
  (async () => {
    try {
      if (isPdf) {
        const { getDocumentProxy, renderPageAsImage } = await import("unpdf");
        const sharpModule = await import("sharp");
        const sharp = sharpModule.default;

        const doc = await getDocumentProxy(new Uint8Array(buffer));
        const totalPages = Math.min(doc.numPages, 10); // Procesa hasta 10 páginas del PDF

        await sendEvent({
          type: "init",
          isPdf: true,
          totalPages,
          fileName: file.name,
        });

        // Recorrer cada una de las hojas de forma secuencial y progresiva
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          await sendEvent({
            type: "page_start",
            page: pageNum,
            totalPages,
            status: `Renderizando y analizando página ${pageNum} de ${totalPages}...`,
          });

          // 1. Renderizar la página actual a lienzo y luego a JPG con escala 2.0 (nitidez alta)
          const pageArrayBuffer = await renderPageAsImage(doc, pageNum, {
            canvasImport: () => import("@napi-rs/canvas"),
            scale: 2.0,
          });

          const jpgBuffer = await sharp(Buffer.from(pageArrayBuffer))
            .jpeg({ quality: 88 })
            .toBuffer();

          const base64Img = jpgBuffer.toString("base64");

          // 2. Construir el prompt específico para esta página
          let prompt = "";
          if (pageNum === 1) {
            prompt = `Analiza la PÁGINA 1 de ${totalPages} de esta factura o ticket de compra para el restaurante japonés 'Obento Japanese Food'.
REGLAS ESTRICTAS DE EXTRACCIÓN:
- PRODUCTOS REALES EXCLUSIVAMENTE: Extrae en la lista "items" SOLO alimentos, bebidas o suministros reales comprados (salmón, arroz, verduras, packaging, etc.).
- PROHIBIDO AÑADIR DESGLOSE DE IMPUESTOS: Las líneas del pie de página que dicen "Identific. IVA", "4%", "10%", "21%", "Base Imponible", "Cuota IVA", "Total Factura", etc., NO SON PRODUCTOS. PROHIBIDO añadirlos a "items".

Extrae con máxima precisión:
1. Objeto "header" con datos generales:
   - "numeroFactura": número o código de factura/albarán.
   - "proveedor": nombre comercial de la empresa proveedora.
   - "cifProveedor": CIF/NIF del proveedor si aparece.
   - "fechaEmision": fecha en formato YYYY-MM-DD.
2. Lista "items" con los productos reales que aparezcan listados en la tabla de esta Página 1.
   Para cada artículo:
   - "descripcion": nombre exacto del producto impreso.
   - "stockItemId": ID numérico del ingrediente correspondiente de nuestro catálogo si coincide, o cadena vacía "" si no coincide.
   - "cantidad": número de unidades o kg.
   - "unidad": "kg", "unidades", "litros", etc.
   - "precioUnitario": precio sin IVA por unidad/kg.
   - "ivaPct": porcentaje de IVA (ej: 10 o 21).
${totalPages === 1 ? '3. Objeto "totals" con "totalBase", "totalIva", "totalFactura" si aparecen.' : ""}

Catálogo de ingredientes del almacén:
${stockCatalog}

Responde ÚNICAMENTE con el bloque JSON:
{
  "header": { "numeroFactura": "...", "proveedor": "...", "cifProveedor": "...", "fechaEmision": "YYYY-MM-DD" },
  "items": [ ... ]${totalPages === 1 ? ', "totals": { "totalBase": 0, "totalIva": 0, "totalFactura": 0 }' : ""}
}`;
          } else {
            prompt = `Analiza la PÁGINA ${pageNum} de ${totalPages} de esta factura de compra para el restaurante japonés 'Obento Japanese Food'.
Esta es una hoja de continuación con más líneas de artículos de la misma factura.
REGLAS ESTRICTAS:
- PRODUCTOS REALES EXCLUSIVAMENTE: Extrae en la lista "items" SOLO productos de alimentación, bebidas o packaging.
- PROHIBIDO AÑADIR FILAS DE IVA: Las tablas o líneas de resumen fiscal del pie como "Identific. IVA", "Base Imponible", "Cuota IVA", "Total Factura" NO SON PRODUCTOS. NUNCA las pongas en "items".
${pageNum === totalPages ? '- TOTALES: Si en esta última página aparecen los totales acumulados finales de la factura, extráelos en "totals": { "totalBase": número, "totalIva": número, "totalFactura": número }.' : ""}

Extrae los artículos reales de esta Página ${pageNum} en la lista "items":
- "descripcion": nombre exacto del producto impreso.
- "stockItemId": ID numérico de nuestro catálogo si coincide, o "".
- "cantidad": número de unidades o kg.
- "unidad": "kg", "unidades", etc.
- "precioUnitario": precio sin IVA por unidad/kg.
- "ivaPct": porcentaje de IVA.

Catálogo de ingredientes del almacén:
${stockCatalog}

Responde ÚNICAMENTE con el bloque JSON:
{
  "items": [ ... ]${pageNum === totalPages ? ', "totals": { "totalBase": 0, "totalIva": 0, "totalFactura": 0 }' : ""}
}`;
          }

          // 3. Llamar a OpenAI Vision para esta página
          const pageResult = await callOpenAIVisionSingle({
            prompt,
            imageBase64: base64Img,
            mimeType: "image/jpeg",
            apiKey,
          });

          const pageItems = sanitizeStockItemMatch(pageResult.items || [], stockItems);
          const header = pageNum === 1 ? sanitizeHeader(pageResult.header) : undefined;
          const totals = pageResult.totals || undefined;

          // 4. Emitir en tiempo real los artículos recién descubiertos de esta página
          await sendEvent({
            type: "page_data",
            page: pageNum,
            totalPages,
            header,
            items: pageItems,
            totals,
          });
        }

        await sendEvent({
          type: "complete",
          totalPages,
          message: `Lectura completada con éxito. Se han analizado las ${totalPages} páginas del PDF.`,
        });
      } else {
        // Archivo de imagen directa (JPG, PNG, WEBP)
        let mimeType = "image/jpeg";
        if (rawType.includes("png") || fileName.endsWith(".png")) mimeType = "image/png";
        else if (rawType.includes("webp") || fileName.endsWith(".webp")) mimeType = "image/webp";

        await sendEvent({
          type: "init",
          isPdf: false,
          totalPages: 1,
          fileName: file.name,
        });

        await sendEvent({
          type: "page_start",
          page: 1,
          totalPages: 1,
          status: "Analizando imagen de factura con IA Vision...",
        });

        const prompt = `Analiza esta imagen de factura o ticket de compra para el restaurante japonés 'Obento Japanese Food'.
REGLAS ESTRICTAS DE EXTRACCIÓN:
- PRODUCTOS REALES EXCLUSIVAMENTE: Extrae a la lista "items" SOLO productos de alimentación, bebidas o packaging reales.
- NO AÑADIR FILAS DE IVA: Las tablas del pie de página con "Identific. IVA", "4%", "10%", "21%", "Base Imponible", "Cuota IVA", "Total Factura", etc. NO SON PRODUCTOS. PROHIBIDO añadirlos a "items".

Extrae con precisión:
1. Objeto "header" con "numeroFactura", "proveedor", "cifProveedor", "fechaEmision" (YYYY-MM-DD).
2. Lista "items" con los productos reales: "descripcion", "stockItemId", "cantidad", "unidad", "precioUnitario", "ivaPct".
3. Objeto "totals" con "totalBase", "totalIva", "totalFactura" si aparecen.

Catálogo de ingredientes:
${stockCatalog}

Responde ÚNICAMENTE con formato JSON:
{
  "header": { ... },
  "items": [ ... ],
  "totals": { "totalBase": 0, "totalIva": 0, "totalFactura": 0 }
}`;

        const result = await callOpenAIVisionSingle({
          prompt,
          imageBase64: buffer.toString("base64"),
          mimeType,
          apiKey,
        });

        const items = sanitizeStockItemMatch(result.items || [], stockItems);
        const header = sanitizeHeader(result.header);

        await sendEvent({
          type: "page_data",
          page: 1,
          totalPages: 1,
          header,
          items,
          totals: result.totals,
        });

        await sendEvent({
          type: "complete",
          totalPages: 1,
          message: "Lectura de factura completada.",
        });
      }
    } catch (err: any) {
      console.error("[Facturas scan stream error]", err);
      await sendEvent({
        type: "error",
        error: "Error durante el análisis: " + (err?.message || String(err)),
      });
    } finally {
      await writer.close();
    }
  })();

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}

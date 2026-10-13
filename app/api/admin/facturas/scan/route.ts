import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

export const maxDuration = 60; // Hasta 60s para procesamiento OCR/Vision

// Función para parsear texto OCR de factura española y extraer campos clave
function parseInvoiceText(text: string, existingStockItems: { id: number; nombre: string; unidad: string }[]) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  let numeroFactura = "";
  let proveedor = "";
  let cifProveedor = "";
  let fechaEmision = "";
  let totalFactura = 0;
  let totalBase = 0;
  let totalIva = 0;
  const items: Array<{
    descripcion: string;
    stockItemId: string;
    cantidad: number;
    unidad: string;
    precioUnitario: number;
    ivaPct: number;
  }> = [];

  // 1. Extraer CIF/NIF (Patrón B12345678, A12345678, 12345678A, etc.)
  const cifMatch = text.match(/\b([ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]|[0-9]{8}[A-Z])\b/i);
  if (cifMatch) {
    cifProveedor = cifMatch[1].toUpperCase();
  }

  // 2. Extraer Número de Factura
  const numMatch = text.match(/(?:factura|fra\.?|n[ºo]\.?\s*(?:factura)?)\s*[:#\-]?\s*([A-Za-z0-9\-\/]+)/i);
  if (numMatch && numMatch[1].length >= 2) {
    numeroFactura = numMatch[1].trim();
  } else {
    // Buscar patrón tipo F-2026-001 o FAC-123
    const patMatch = text.match(/\b([A-Z]{1,4}[0-9\-\/]{3,12})\b/);
    if (patMatch) numeroFactura = patMatch[1];
  }

  // 3. Extraer Fecha (DD/MM/YYYY o DD-MM-YYYY o YYYY-MM-DD)
  const dateMatch = text.match(/\b(0?[1-9]|[12][0-9]|3[01])[\/\-\.](0?[1-9]|1[012])[\/\-\.](20\d\d)\b/);
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, "0");
    const month = dateMatch[2].padStart(2, "0");
    const year = dateMatch[3];
    fechaEmision = `${year}-${month}-${day}`;
  } else {
    const isoMatch = text.match(/\b(20\d\d)[\/\-\.](0?[1-9]|1[012])[\/\-\.](0?[1-9]|[12][0-9]|3[01])\b/);
    if (isoMatch) {
      fechaEmision = `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
    }
  }

  // 4. Extraer Proveedor (generalmente en las primeras 5 líneas no vacías)
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const l = lines[i];
    if (
      !l.toLowerCase().includes("factura") &&
      !l.toLowerCase().includes("cif") &&
      !l.toLowerCase().includes("nif") &&
      !l.toLowerCase().includes("fecha") &&
      !l.toLowerCase().includes("albar") &&
      l.length > 3 &&
      l.length < 50
    ) {
      proveedor = l.replace(/[^\w\s\.\,\&S\.L\.S\.A\.]/gi, "").trim();
      break;
    }
  }

  // 5. Extraer Totales
  const totalMatch = text.match(/(?:total|importe\s*total|total\s*factura)\s*[:=]?\s*([0-9\.\,]+)\s*€?/i);
  if (totalMatch) {
    const num = parseFloat(totalMatch[1].replace(".", "").replace(",", "."));
    if (!isNaN(num) && num > 0) totalFactura = num;
  }

  const baseMatch = text.match(/(?:base\s*imponible|subtotal|base)\s*[:=]?\s*([0-9\.\,]+)\s*€?/i);
  if (baseMatch) {
    const num = parseFloat(baseMatch[1].replace(".", "").replace(",", "."));
    if (!isNaN(num) && num > 0) totalBase = num;
  }

  const ivaMatch = text.match(/(?:iva|cuota\s*iva)\s*(?:[0-9]{1,2}%|\s*[:=])?\s*([0-9\.\,]+)\s*€?/i);
  if (ivaMatch) {
    const num = parseFloat(ivaMatch[1].replace(".", "").replace(",", "."));
    if (!isNaN(num) && num > 0) totalIva = num;
  }

  // 6. Detectar líneas de artículos por coincidencia de palabras clave con ingredientes de stock
  for (const line of lines) {
    const lower = line.toLowerCase();
    for (const stock of existingStockItems) {
      const stockTerms = stock.nombre.toLowerCase().split(/\s+/).filter(t => t.length > 2);
      const isMatch = stockTerms.some(term => lower.includes(term));

      if (isMatch) {
        // Intentar parsear números en la línea (cantidades y precios)
        // Ejemplo: "Salmon Fresco Noruego 10 kg 12.50 125.00"
        const numbers = line.match(/([0-9]+(?:[\.\,][0-9]{1,2})?)/g);
        let qty = 1;
        let price = 0;

        if (numbers && numbers.length >= 2) {
          const parsedNums = numbers.map(n => parseFloat(n.replace(",", "."))).filter(n => n > 0);
          if (parsedNums.length >= 2) {
            qty = parsedNums[0];
            price = parsedNums[1];
          } else if (parsedNums.length === 1) {
            price = parsedNums[0];
          }
        }

        // Evitar duplicados de la misma línea
        if (!items.some(it => it.stockItemId === String(stock.id))) {
          items.push({
            descripcion: stock.nombre,
            stockItemId: String(stock.id),
            cantidad: qty > 0 ? qty : 1,
            unidad: stock.unidad,
            precioUnitario: price > 0 ? price : 0,
            ivaPct: 10,
          });
        }
      }
    }
  }

  // Si no se detectó ninguna línea asociada, crear al menos una sugerencia
  if (items.length === 0) {
    items.push({
      descripcion: "Compra según factura " + (numeroFactura || ""),
      stockItemId: "",
      cantidad: 1,
      unidad: "unidades",
      precioUnitario: totalBase > 0 ? totalBase : totalFactura,
      ivaPct: 10,
    });
  }

  return {
    numeroFactura: numeroFactura || `FAC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    proveedor: proveedor || "Proveedor Factura",
    cifProveedor: cifProveedor || "",
    fechaEmision: fechaEmision || new Date().toISOString().split("T")[0],
    totalFactura: totalFactura || (totalBase + totalIva) || 0,
    totalBase: totalBase || totalFactura || 0,
    totalIva: totalIva || 0,
    items,
  };
}

async function callOpenAIInvoice({
  prompt,
  imageBase64,
  mimeType,
  apiKey,
}: {
  prompt: string;
  imageBase64?: string;
  mimeType?: string;
  apiKey: string;
}) {
  const content: any[] = [{ type: "text", text: prompt }];
  if (imageBase64) {
    content.push({
      type: "image_url",
      image_url: {
        url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`,
        detail: "high",
      },
    });
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content }],
      temperature: 0.1,
      max_tokens: 1500,
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
    throw new Error("La IA no devolvió un JSON estructurado de la factura.");
  }

  return JSON.parse(rawText.substring(firstBrace, lastBrace + 1));
}

export async function POST(req: Request) {
  const role = await getSessionRole();
  if (!role) return deny403();

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se ha subido ningún archivo" }, { status: 400 });
    }

    const rawType = (file.type || "").toLowerCase().trim();
    const fileName = (file.name || "").toLowerCase().trim();
    const isPdf = rawType.includes("pdf") || fileName.endsWith(".pdf");

    const buffer = Buffer.from(await file.arrayBuffer());

    // Obtener catálogo de stock para cotejar
    const stockItems = await prisma.stockItem.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, unidad: true, costeUnitario: true },
    });
    const stockCatalog = stockItems.map(s => `ID: ${s.id} | Nombre: ${s.nombre} | Unidad: ${s.unidad}`).join("\n");

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

    // ─────────────────────────────────────────────────────────────────────────────
    // 1. PROCESAMIENTO DE ARCHIVOS PDF (Digitales y Escaneados)
    // ─────────────────────────────────────────────────────────────────────────────
    if (isPdf) {
      let pdfText = "";
      try {
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse({ data: buffer });
        const textResult = await parser.getText();
        await parser.destroy();
        pdfText = (textResult?.text || "").trim();
      } catch (pdfErr) {
        console.warn("[PDFParse text extraction error]", pdfErr);
      }

      // Si el PDF contiene texto seleccionable (la gran mayoría de facturas digitales)
      if (pdfText.length > 30) {
        const prompt = `Analiza el texto de esta factura de compra o ticket de proveedor para un restaurante japonés (Obento Japanese Food).
Extrae los datos en formato JSON EXACTO con las siguientes propiedades:
{
  "numeroFactura": "string con el número o albarán",
  "proveedor": "nombre comercial de la empresa proveedora",
  "cifProveedor": "CIF o NIF del proveedor si aparece",
  "fechaEmision": "YYYY-MM-DD",
  "estadoPago": "pagado",
  "items": [
    {
      "descripcion": "nombre del producto en la factura",
      "stockItemId": "ID numérico del ingrediente correspondiente de nuestro catálogo si coincide o se parece, o cadena vacía '' si no corresponde a stock",
      "cantidad": numero de unidades o kg,
      "unidad": "kg", "unidades", "litros", etc,
      "precioUnitario": numero (precio sin IVA por unidad/kg),
      "ivaPct": 10
    }
  ]
}

Catálogo de ingredientes de nuestro almacén para asociar:
${stockCatalog}

Texto extraído de la factura PDF:
${pdfText.slice(0, 15000)}

Responde ÚNICAMENTE con el bloque JSON, sin texto antes ni después.`;

        try {
          const factura = await callOpenAIInvoice({ prompt, apiKey });
          return NextResponse.json({ success: true, method: "pdf_text_ai", factura });
        } catch (aiErr: any) {
          return NextResponse.json({ error: aiErr.message || "Error procesando texto del PDF con IA" }, { status: 400 });
        }
      }

      // Si el PDF es un documento escaneado (sin capa de texto), renderizamos a imagen PNG
      try {
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse({ data: buffer });
        const screenshotResult = await parser.getScreenshot({ first: 1, scale: 1.5 });
        await parser.destroy();

        if (screenshotResult?.pages?.[0]?.data) {
          const pageImgBuffer = Buffer.from(screenshotResult.pages[0].data);
          const base64Img = pageImgBuffer.toString("base64");
          const prompt = `Analiza esta imagen de factura de compra o ticket de proveedor para un restaurante japonés (Obento Japanese Food).
Extrae los datos en formato JSON EXACTO con las siguientes propiedades:
{
  "numeroFactura": "string con el número o albarán",
  "proveedor": "nombre comercial de la empresa proveedora",
  "cifProveedor": "CIF o NIF del proveedor si aparece",
  "fechaEmision": "YYYY-MM-DD",
  "estadoPago": "pagado",
  "items": [
    {
      "descripcion": "nombre del producto en la factura",
      "stockItemId": "ID numérico del ingrediente correspondiente de nuestro catálogo si coincide o se parece, o cadena vacía '' si no corresponde a stock",
      "cantidad": numero de unidades o kg,
      "unidad": "kg", "unidades", "litros", etc,
      "precioUnitario": numero (precio sin IVA por unidad/kg),
      "ivaPct": 10
    }
  ]
}

Catálogo de ingredientes de nuestro almacén para asociar:
${stockCatalog}

Responde ÚNICAMENTE con el bloque JSON, sin texto antes ni después.`;

          const factura = await callOpenAIInvoice({
            prompt,
            imageBase64: base64Img,
            mimeType: "image/png",
            apiKey,
          });
          return NextResponse.json({ success: true, method: "pdf_vision_ai", factura });
        }
      } catch (renderErr: any) {
        console.error("[PDF render error]", renderErr);
      }

      return NextResponse.json(
        { error: "No se pudo extraer texto del PDF. Si es un escaneo antiguo, prueba a subir una foto directa (JPG/PNG)." },
        { status: 422 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. PROCESAMIENTO DE IMÁGENES (JPG, PNG, WEBP, FOTOS DIRECTAS)
    // ─────────────────────────────────────────────────────────────────────────────
    let mimeType = "image/jpeg";
    if (rawType.includes("png") || fileName.endsWith(".png")) {
      mimeType = "image/png";
    } else if (rawType.includes("webp") || fileName.endsWith(".webp")) {
      mimeType = "image/webp";
    } else if (rawType.includes("gif") || fileName.endsWith(".gif")) {
      mimeType = "image/gif";
    }

    const base64Img = buffer.toString("base64");
    const prompt = `Analiza esta imagen de factura de compra o ticket de proveedor para un restaurante japonés (Obento Japanese Food).
Extrae los datos en formato JSON EXACTO con las siguientes propiedades:
{
  "numeroFactura": "string con el número o albarán",
  "proveedor": "nombre comercial de la empresa proveedora",
  "cifProveedor": "CIF o NIF del proveedor si aparece",
  "fechaEmision": "YYYY-MM-DD",
  "estadoPago": "pagado",
  "items": [
    {
      "descripcion": "nombre del producto en la factura",
      "stockItemId": "ID numérico del ingrediente correspondiente de nuestro catálogo si coincide o se parece, o cadena vacía '' si no corresponde a stock",
      "cantidad": numero de unidades o kg,
      "unidad": "kg", "unidades", "litros", etc,
      "precioUnitario": numero (precio sin IVA por unidad/kg),
      "ivaPct": 10
    }
  ]
}

Catálogo de ingredientes de nuestro almacén para asociar:
${stockCatalog}

Responde ÚNICAMENTE con el bloque JSON, sin texto antes ni después.`;

    const factura = await callOpenAIInvoice({
      prompt,
      imageBase64: base64Img,
      mimeType,
      apiKey,
    });

    return NextResponse.json({
      success: true,
      method: "ai_vision",
      factura,
    });
  } catch (error: any) {
    console.error("[api/admin/facturas/scan error]", error);
    return NextResponse.json(
      { error: "Error procesando documento: " + (error?.message || String(error)) },
      { status: 500 }
    );
  }
}

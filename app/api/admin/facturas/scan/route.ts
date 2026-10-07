import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";
import { createWorker } from "tesseract.js";

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

export async function POST(req: Request) {
  const role = await getSessionRole();
  if (!role) return deny403();

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se ha subido ningún archivo" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Obtener ingredientes actuales de la base de datos para auto-relacionar
    const stockItems = await prisma.stockItem.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, unidad: true, costeUnitario: true },
    });

    // Revisar si hay API key configurada en la base de datos (OpenAI GPT-4o-mini Vision)
    const configRow = await prisma.configuracion.findUnique({ where: { clave: "agent_config" } });
    let config: any = {};
    if (configRow?.valor) {
      try { config = JSON.parse(configRow.valor); } catch {}
    }
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;

    // Si hay OpenAI Key con soporte de visión, usar GPT-4o-mini Vision para máxima precisión
    if (apiKey) {
      try {
        const base64Img = buffer.toString("base64");
        const mimeType = file.type || "image/jpeg";
        const stockCatalog = stockItems.map(s => `ID: ${s.id} | Nombre: ${s.nombre} | Unidad: ${s.unidad}`).join("\n");

        const prompt = `Analiza esta imagen de factura de compra o ticket de proveedor para un restaurante japonés (Obento Japanese Food).
Extrae los datos en formato JSON EXACTO con las siguientes propiedades:
{
  "numeroFactura": "string con el número o albarán",
  "proveedor": "nombre comercial de la empresa proveedora",
  "cifProveedor": "CIF o NIF del proveedor si aparece",
  "fechaEmision": "YYYY-MM-DD",
  "estadoPago": "pagado" o "pendiente",
  "items": [
    {
      "descripcion": "nombre del producto en la factura",
      "stockItemId": "ID numérico del ingrediente correspondiente de nuestro catálogo si coincide o se parece, o cadena vacía '' si no corresponde a stock",
      "cantidad": numero de unidades o kg,
      "unidad": "kg", "unidades", "litros", etc,
      "precioUnitario": numero (precio sin IVA por unidad/kg),
      "ivaPct": 10 o 21 o 4
    }
  ]
}

Catálogo de ingredientes de nuestro almacén para asociar:
${stockCatalog}

Responde ÚNICAMENTE con el bloque JSON, sin texto antes ni después.`;

        const resOpenAI = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${mimeType};base64,${base64Img}`,
                      detail: "high",
                    },
                  },
                ],
              },
            ],
            temperature: 0.1,
            max_tokens: 1500,
          }),
        });

        if (resOpenAI.ok) {
          const data = await resOpenAI.json();
          const rawText = data.choices?.[0]?.message?.content || "";
          const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleaned);

          return NextResponse.json({
            success: true,
            method: "ai_vision",
            factura: parsed,
          });
        }
      } catch (aiErr) {
        console.error("[OCR OpenAI Error, cayendo a motor local Tesseract]", aiErr);
      }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // MOTOR OCR LOCAL CON TESSERACT.JS (100% Autónomo sin necesidad de API Externa)
    // ─────────────────────────────────────────────────────────────────────────────
    const worker = await createWorker("spa"); // Lenguaje español
    const ret = await worker.recognize(buffer);
    await worker.terminate();

    const ocrText = ret.data.text || "";
    const parsedData = parseInvoiceText(ocrText, stockItems);

    return NextResponse.json({
      success: true,
      method: "ocr_tesseract",
      factura: parsedData,
      rawText: ocrText.slice(0, 500),
    });
  } catch (error: any) {
    console.error("[api/admin/facturas/scan error]", error);
    return NextResponse.json(
      { error: "Error procesando imagen de la factura: " + (error?.message || String(error)) },
      { status: 500 }
    );
  }
}

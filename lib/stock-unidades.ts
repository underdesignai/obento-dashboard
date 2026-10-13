// Normalización y conversión de unidades para almacén, escandallos, recetas y mermas

export type TipoUnidad = "peso" | "volumen" | "unidad" | "envase";

export const UNIDADES_DISPONIBLES = [
  // Peso
  { id: "g", label: "Gramos (g)", tipo: "peso", base: 1 },
  { id: "kg", label: "Kilogramos (kg)", tipo: "peso", base: 1000 },
  // Volumen
  { id: "ml", label: "Mililitros (ml)", tipo: "volumen", base: 1 },
  { id: "cl", label: "Centilitros (cl)", tipo: "volumen", base: 10 },
  { id: "l", label: "Litros (L)", tipo: "volumen", base: 1000 },
  // Unidades
  { id: "ud", label: "Unidades (ud)", tipo: "unidad", base: 1 },
  { id: "botella", label: "Botellas", tipo: "unidad", base: 1 },
  { id: "lata", label: "Latas", tipo: "unidad", base: 1 },
  // Envases comunes de compra
  { id: "bote", label: "Botes", tipo: "envase", base: 1 },
  { id: "saco", label: "Sacos", tipo: "envase", base: 1 },
  { id: "caja", label: "Cajas", tipo: "envase", base: 1 },
  { id: "paquete", label: "Paquetes", tipo: "envase", base: 1 },
] as const;

export const TIPOS_ENVASE_COMPRA = [
  { id: "bote", label: "Bote / Tarro", sugerenciaUnidad: "g" },
  { id: "saco", label: "Saco", sugerenciaUnidad: "kg" },
  { id: "caja", label: "Caja", sugerenciaUnidad: "ud" },
  { id: "paquete", label: "Paquete", sugerenciaUnidad: "g" },
  { id: "garrafa", label: "Garrafa / Botella", sugerenciaUnidad: "l" },
  { id: "unidad", label: "Unidad / Pieza suelta", sugerenciaUnidad: "ud" },
] as const;

/**
 * Normaliza nombres de unidad como "gramos", "kilogramos", "Kilos", "litros", etc.
 */
export function normalizarUnidad(u: string): string {
  if (!u) return "g";
  const clean = u.toLowerCase().trim().replace(/\.$/, "");
  if (clean === "gramos" || clean === "gramo" || clean === "grs" || clean === "gr" || clean === "g") return "g";
  if (clean === "kilogramos" || clean === "kilogramo" || clean === "kilos" || clean === "kilo" || clean === "kgs" || clean === "kg") return "kg";
  if (clean === "mililitros" || clean === "mililitro" || clean === "mls" || clean === "ml") return "ml";
  if (clean === "centilitros" || clean === "centilitro" || clean === "cls" || clean === "cl") return "cl";
  if (clean === "litros" || clean === "litro" || clean === "lts" || clean === "lt" || clean === "l") return "l";
  if (clean === "unidades" || clean === "unidad" || clean === "uds" || clean === "ud" || clean === "u" || clean === "pieza" || clean === "piezas") return "ud";
  if (clean === "botellas" || clean === "botella" || clean === "botellin" || clean === "botellines") return "botella";
  if (clean === "latas" || clean === "lata") return "lata";
  if (clean === "botes" || clean === "bote" || clean === "tarro" || clean === "tarros") return "bote";
  if (clean === "sacos" || clean === "saco") return "saco";
  if (clean === "cajas" || clean === "caja") return "caja";
  if (clean === "paquetes" || clean === "paquete" || clean === "paq") return "paquete";
  return clean;
}

/**
 * Convierte una cantidad de una unidad a otra si pertenecen a la misma familia (peso o volumen).
 * Retorna null si no son convertibles directamente (ej: convertir litros a kilogramos sin densidad).
 */
export function convertirUnidad(cantidad: number, unidadOrigen: string, unidadDestino: string): number | null {
  const o = normalizarUnidad(unidadOrigen);
  const d = normalizarUnidad(unidadDestino);

  if (o === d) return cantidad;

  // Conversiones de PESO (g <-> kg)
  if (o === "g" && d === "kg") return cantidad / 1000;
  if (o === "kg" && d === "g") return cantidad * 1000;

  // Conversiones de VOLUMEN (ml <-> cl <-> l)
  if (o === "ml" && d === "l") return cantidad / 1000;
  if (o === "ml" && d === "cl") return cantidad / 10;
  if (o === "cl" && d === "ml") return cantidad * 10;
  if (o === "cl" && d === "l") return cantidad / 100;
  if (o === "l" && d === "ml") return cantidad * 1000;
  if (o === "l" && d === "cl") return cantidad * 100;

  // Conversiones de UNIDADES / PIEZAS (1 a 1 entre formatos de conteo)
  const esUnidadO = ["ud", "botella", "lata"].includes(o);
  const esUnidadD = ["ud", "botella", "lata"].includes(d);
  if (esUnidadO && esUnidadD) return cantidad;

  return null;
}

/**
 * Calcula el coste real de un ingrediente usado en un plato o receta,
 * adaptando inteligentemente las unidades (ej: 20 g de un ingrediente cuyo stock está en kg o en g).
 */
export function calcularCosteIngrediente(
  cantidadReceta: number,
  unidadReceta: string,
  costeUnitarioStock: number,
  unidadStock: string
): number {
  if (!cantidadReceta || cantidadReceta <= 0 || !costeUnitarioStock || costeUnitarioStock <= 0) {
    return 0;
  }

  const uReceta = normalizarUnidad(unidadReceta);
  const uStock = normalizarUnidad(unidadStock);

  if (uReceta === uStock) {
    return Number((cantidadReceta * costeUnitarioStock).toFixed(4));
  }

  // Si la receta está en gramos y el stock en kg: coste = (gramos / 1000) * precio_kg
  if (uReceta === "g" && uStock === "kg") {
    return Number(((cantidadReceta / 1000) * costeUnitarioStock).toFixed(4));
  }

  // Si la receta está en kg y el stock en gramos: coste = (kg * 1000) * precio_g
  if (uReceta === "kg" && uStock === "g") {
    return Number(((cantidadReceta * 1000) * costeUnitarioStock).toFixed(4));
  }

  // Si la receta está en ml y el stock en litros: coste = (ml / 1000) * precio_l
  if (uReceta === "ml" && uStock === "l") {
    return Number(((cantidadReceta / 1000) * costeUnitarioStock).toFixed(4));
  }

  // Si la receta está en cl y el stock en litros: coste = (cl / 100) * precio_l
  if (uReceta === "cl" && uStock === "l") {
    return Number(((cantidadReceta / 100) * costeUnitarioStock).toFixed(4));
  }

  // Fallback seguro: multiplicación directa
  return Number((cantidadReceta * costeUnitarioStock).toFixed(4));
}

/**
 * Calcula la equivalencia de un lote/envase de compra (ej: 2 botes de 300 g a 5,50 €/bote):
 * Retorna:
 * - cantidadTotal: 600
 * - unidadBase: 'g'
 * - costeUnitarioBase: 0.0183 €/g
 * - descripcion: "2 botes × 300 g (Total: 600 g a 0.0183 €/g)"
 */
export function calcularConversionEnvase(params: {
  numEnvases: number;
  tipoEnvase: string;
  contenidoPorEnvase: number;
  unidadContenido: string;
  precioPorEnvase?: number;
  precioTotal?: number;
}): {
  cantidadTotal: number;
  unidadBase: string;
  costeUnitarioBase: number;
  costeTotal: number;
  descripcion: string;
} {
  const num = Math.max(0, Number(params.numEnvases) || 1);
  const contenido = Math.max(0, Number(params.contenidoPorEnvase) || 1);
  const unidad = normalizarUnidad(params.unidadContenido || "g");

  const cantidadTotal = Number((num * contenido).toFixed(3));

  let costeTotal = 0;
  if (params.precioTotal !== undefined && params.precioTotal !== null) {
    costeTotal = Number(params.precioTotal) || 0;
  } else if (params.precioPorEnvase !== undefined && params.precioPorEnvase !== null) {
    costeTotal = Number((num * Number(params.precioPorEnvase)).toFixed(2));
  }

  const costeUnitarioBase = cantidadTotal > 0 ? Number((costeTotal / cantidadTotal).toFixed(5)) : 0;

  const desc = `${num} ${params.tipoEnvase || "envase"}${num > 1 ? "s" : ""} × ${contenido} ${unidad} = ${cantidadTotal} ${unidad} (Coste: ${costeUnitarioBase} €/${unidad})`;

  return {
    cantidadTotal,
    unidadBase: unidad,
    costeUnitarioBase,
    costeTotal,
    descripcion: desc,
  };
}

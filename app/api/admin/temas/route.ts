import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { JWT_SECRET_BYTES } from "@/lib/auth";
import { cookies } from "next/headers";

async function isAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return false;
    const { payload } = await jwtVerify(token, JWT_SECRET_BYTES);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export type FestiveTheme = "normal" | "halloween" | "navidad" | "ano_nuevo" | "reyes";
export type Intensity = "subtle" | "medium" | "festive";

export interface ThemeConfig {
  theme: FestiveTheme;
  intensity: Intensity;
  active: boolean;
  cartCelebration: boolean;
  floatingBadges: boolean;
  seasonalSpecials: boolean;
  schedule: {
    halloween: { start: string; end: string; enabled: boolean };
    navidad: { start: string; end: string; enabled: boolean };
    ano_nuevo: { start: string; end: string; enabled: boolean };
    reyes: { start: string; end: string; enabled: boolean };
  };
}

const DEFAULT_THEME_CONFIG: ThemeConfig = {
  theme: "normal",
  intensity: "subtle",
  active: false,
  cartCelebration: true,
  floatingBadges: true,
  seasonalSpecials: false,
  schedule: {
    halloween: { start: "10-24", end: "11-02", enabled: false },
    navidad: { start: "12-15", end: "12-28", enabled: false },
    ano_nuevo: { start: "12-29", end: "01-02", enabled: false },
    reyes: { start: "01-03", end: "01-07", enabled: false },
  },
};

export async function GET() {
  try {
    const row = await prisma.configuracion.findUnique({
      where: { clave: "theme_config" },
    });

    if (!row || !row.valor) {
      return Response.json(DEFAULT_THEME_CONFIG);
    }

    try {
      const parsed = JSON.parse(row.valor);
      return Response.json({ ...DEFAULT_THEME_CONFIG, ...parsed });
    } catch {
      return Response.json(DEFAULT_THEME_CONFIG);
    }
  } catch (error) {
    console.error("Error reading theme_config:", error);
    return Response.json({ error: "Error interno al obtener tema" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const updatedConfig: ThemeConfig = {
      theme: body.theme || "normal",
      intensity: body.intensity || "subtle",
      active: typeof body.active === "boolean" ? body.active : false,
      cartCelebration: typeof body.cartCelebration === "boolean" ? body.cartCelebration : true,
      floatingBadges: typeof body.floatingBadges === "boolean" ? body.floatingBadges : true,
      seasonalSpecials: typeof body.seasonalSpecials === "boolean" ? body.seasonalSpecials : false,
      schedule: body.schedule || DEFAULT_THEME_CONFIG.schedule,
    };

    const valor = JSON.stringify(updatedConfig);

    await prisma.configuracion.upsert({
      where: { clave: "theme_config" },
      update: { valor },
      create: { clave: "theme_config", valor },
    });

    return Response.json({ ok: true, config: updatedConfig });
  } catch (error) {
    console.error("Error updating theme_config:", error);
    return Response.json({ error: "Error al guardar tema" }, { status: 500 });
  }
}

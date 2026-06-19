import { jwtVerify } from "jose";
import { cookies } from "next/headers";

type Role = "admin" | "editor" | "general";

export async function getSessionRole(): Promise<Role | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return null;
    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "secret");
    const { payload } = await jwtVerify(token, secret);
    return (payload.role as Role) ?? null;
  } catch {
    return null;
  }
}

export function deny403(): Response {
  return Response.json({ error: "No autorizado" }, { status: 403 });
}

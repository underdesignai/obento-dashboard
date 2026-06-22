import { jwtVerify } from "jose";
import { JWT_SECRET_BYTES } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return Response.json({ role: null }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET_BYTES);
    return Response.json({ role: payload.role, username: payload.username });
  } catch {
    return Response.json({ role: null }, { status: 401 });
  }
}

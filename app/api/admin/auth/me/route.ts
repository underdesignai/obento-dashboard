import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return Response.json({ role: null }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "secret");
    const { payload } = await jwtVerify(token, secret);
    return Response.json({ role: payload.role, username: payload.username });
  } catch {
    return Response.json({ role: null }, { status: 401 });
  }
}

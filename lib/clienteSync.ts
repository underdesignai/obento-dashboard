import { prisma } from "@/lib/prisma";

export const normPhone  = (t?: string | null) => t?.replace(/\s+/g, "").toLowerCase().trim() || null;
export const normEmail  = (e?: string | null) => e?.toLowerCase().trim() || null;
export const normNombre = (n: string) => n.toLowerCase().trim();

export async function upsertCliente(r: {
  nombre: string; email?: string | null; telefono?: string | null;
  fecha?: Date | string | null; tipo?: "reserva" | "pedido";
}): Promise<string> {
  const emailKey  = normEmail(r.email);
  const phoneKey  = normPhone(r.telefono);
  const nombreKey = normNombre(r.nombre);
  const fechaDate = r.fecha ? new Date(r.fecha) : null;
  const tipo      = r.tipo ?? "reserva";

  let existing = emailKey
    ? await prisma.cliente.findFirst({ where: { email: emailKey } })
    : null;
  if (!existing && phoneKey)
    existing = await prisma.cliente.findFirst({ where: { telefono: phoneKey } });
  if (!existing)
    existing = await prisma.cliente.findFirst({ where: { clientKey: nombreKey } });

  if (existing) {
    await prisma.cliente.update({
      where: { id: existing.id },
      data: {
        email:          existing.email    || emailKey  || undefined,
        telefono:       existing.telefono || phoneKey  || undefined,
        ultimaReserva:  fechaDate && (!existing.ultimaReserva || fechaDate > existing.ultimaReserva)
                          ? fechaDate : undefined,
        primeraReserva: fechaDate && (!existing.primeraReserva || fechaDate < existing.primeraReserva)
                          ? fechaDate : undefined,
        totalReservas:  tipo === "reserva" ? { increment: 1 } : undefined,
        totalPedidos:   tipo === "pedido"  ? { increment: 1 } : undefined,
      },
    });
    return existing.clientKey;
  }

  const clientKey = emailKey || phoneKey || nombreKey;
  await prisma.cliente.create({
    data: {
      clientKey,
      nombre:         r.nombre,
      email:          emailKey  || undefined,
      telefono:       phoneKey  || undefined,
      primeraReserva: fechaDate || undefined,
      ultimaReserva:  fechaDate || undefined,
      totalReservas:  tipo === "reserva" ? 1 : 0,
      totalPedidos:   tipo === "pedido"  ? 1 : 0,
    },
  });
  return clientKey;
}

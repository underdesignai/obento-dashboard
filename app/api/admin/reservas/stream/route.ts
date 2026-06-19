import emitter from "@/lib/reservas-emitter";

export const dynamic = "force-dynamic";

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const send = (data: string) => {
        if (closed) return;
        try { controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`)); }
        catch { closed = true; cleanup(); }
      };

      const onReserva = (reserva: unknown) => send(JSON.stringify(reserva));

      const ping = setInterval(() => {
        if (closed) { clearInterval(ping); return; }
        try { controller.enqueue(new TextEncoder().encode(": ping\n\n")); }
        catch { closed = true; cleanup(); }
      }, 30000);

      const cleanup = () => {
        closed = true;
        emitter.off("nueva-reserva", onReserva);
        clearInterval(ping);
      };

      emitter.on("nueva-reserva", onReserva);
    },
    cancel() { /* cleanup handled inside via closed flag */ },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

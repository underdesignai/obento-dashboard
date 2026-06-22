import { EventEmitter } from "events";

const globalForEmitter = globalThis as unknown as { reservasEmitter: EventEmitter };

const emitter = globalForEmitter.reservasEmitter ?? new EventEmitter();

if (process.env.NODE_ENV !== "production") globalForEmitter.reservasEmitter = emitter;

export default emitter;

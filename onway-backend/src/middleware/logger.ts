import type { MiddlewareHandler } from "hono";


 // Minimal request logger. Deliberately not a full structured-logging
 // setup (no pino/winston) — a 2-3 day assessment doesn't need one, and
 // console output is what Railway/Render capture by default.
 
export const requestLogger: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${c.req.method} ${c.req.path} ${c.res.status} ${ms}ms`);
};

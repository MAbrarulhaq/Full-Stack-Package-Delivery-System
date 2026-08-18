import { serve } from "@hono/node-server";
import app from "./app";
import { env } from "./config/env";

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Onway API listening on http://localhost:${info.port} (${env.NODE_ENV})`);
});

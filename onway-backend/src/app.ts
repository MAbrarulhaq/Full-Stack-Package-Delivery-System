import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestLogger } from "./middleware/logger";
import { errorHandler } from "./middleware/error-handler";
import { routes } from "./routes/index";
import { env } from "./config/env";

// Creates the Hono app without starting a server, making it easy to test.
export const app = new Hono();

// Allow requests from the local dev frontend, plus the deployed frontend
// (FRONTEND_URL) when it's configured. Kept as an explicit allow-list
// (never "*") since requests carry an Authorization bearer token.
const allowedOrigins = ["http://localhost:5173", env.FRONTEND_URL].filter(
  (origin): origin is string => Boolean(origin),
);

app.use(
  "*",
  cors({
    origin: allowedOrigins,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("*", requestLogger);

app.route("/", routes);

// Returns a standard response for unknown routes.
app.notFound((c) =>
  c.json(
    { success: false, error: { code: "NOT_FOUND", message: "Route not found" } },
    404,
  ),
);

// Handles all application and unexpected errors globally.
app.onError(errorHandler);

export default app;
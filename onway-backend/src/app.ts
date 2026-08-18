import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestLogger } from "./middleware/logger";
import { errorHandler } from "./middleware/error-handler";
import { routes } from "./routes/index";

/**
 * Builds the Hono app without starting an HTTP server — this is what
 * makes `app.request(...)` usable directly in tests (Step 3's manual
 * verification below, and any future integration test suite) without
 * needing a running process or open port.
 */
export const app = new Hono();

/**
 * Minimal CORS for the React frontend (Step 7), restricted to the known
 * dev origin only -- never "*". `credentials: true` is deliberately
 * omitted: authentication is a Bearer JWT in the Authorization header
 * (see src/middleware/auth.ts), not a cookie, so credentialed CORS isn't
 * needed here. Add the deployed frontend's origin to this list once it
 * exists (Step 8) -- out of scope for now.
 */
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("*", requestLogger);

app.route("/", routes);

app.notFound((c) =>
  c.json(
    { success: false, error: { code: "NOT_FOUND", message: "Route not found" } },
    404,
  ),
);

// Single global error handler — every thrown AppError (and anything
// unexpected) is turned into a consistent JSON response here. No route
// or controller in this app has its own try/catch.
app.onError(errorHandler);

export default app;

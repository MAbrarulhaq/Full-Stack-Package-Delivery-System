import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestLogger } from "./middleware/logger";
import { errorHandler } from "./middleware/error-handler";
import { routes } from "./routes/index";

// Creates the Hono app without starting a server, making it easy to test.
export const app = new Hono();

// Allow requests from the local React frontend.
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
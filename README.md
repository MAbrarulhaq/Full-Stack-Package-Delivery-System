# Onway — Package Delivery Tracker

A full-stack delivery tracking module built for the Onway technical assessment: create orders, move them through a fixed delivery lifecycle, assign couriers, and audit every status change — with role-based access for admins, staff, and couriers.

**Live app:** `<ADD LIVE FRONTEND URL>`
**Live API:** `<ADD LIVE BACKEND URL>`
**Repo:** `<ADD GITHUB REPO URL>`

---

## Stack

| Layer | Choice |
|---|---|
| Backend framework | **Hono.js** (required by the assessment) |
| Runtime | Node.js |
| Language | TypeScript |
| Database | **PostgreSQL** |
| ORM | Drizzle ORM |
| Validation | Zod, via `@hono/zod-validator` |
| Auth | JWT (bonus requirement) |
| Frontend | React 19 + Vite |
| Frontend data layer | TanStack Query |
| Styling | Tailwind CSS v4 + Radix UI primitives |
| Testing | Node's built-in `node:test` — 74 tests |

---

## Project structure

```
onway/
├── backend/onway-backend/     Hono API, Drizzle schema/migrations, tests
└── frontend/onway-frontend/   React dashboard (Vite)
```

The two apps are independently deployable and talk to each other only over HTTP, via `VITE_API_URL` on the frontend and CORS `origin` on the backend.

---

## Why PostgreSQL (relational vs. non-relational)

An order and its status history are a textbook one-to-many relationship with a **fixed, enumerable schema** — every order has the same fields, every history row has the same three columns (`order_id`, `status`, `timestamp`), and the relationship never varies in shape. There's no case here for a document store's flexible schema; it would just remove the guarantees a relational DB gives for free.

Concretely, Postgres was chosen because:

- **Foreign keys enforce the audit trail.** `order_status_history.order_id` references `orders.id`. A history row can never point at a non-existent order — that's a database-level guarantee, not something the application has to remember to check.
- **The state machine needs transactional atomicity.** Every status change updates `orders.status` *and* inserts a row into `order_status_history` in the same operation. Both writes happen inside one `db.transaction(...)` call — if either fails, both roll back, so the current status and the audit trail can never disagree.
- **A `CHECK` constraint enforces `package_weight > 0` at the database layer**, not just in Zod — so even a direct DB write can't violate it.
- **Composite indexes match the actual query patterns**: `(status, created_at DESC)` for the filtered/paginated order list, `(order_id, created_at)` for pulling one order's history in order, `(courier_id)` for "my orders."

A document database would have made the append-only history table an unenforced convention instead of a schema-level guarantee, and would have pushed referential integrity (order ↔ history ↔ courier) into application code.

---

## Data model

**`users`** — `id, name, email (unique), password_hash, role (admin | staff | courier), created_at, updated_at`

**`orders`** — `id, customer_name, pickup_address, dropoff_address, package_weight (numeric, >0), status, courier_id (FK → users, nullable), cancelled_at, created_at, updated_at`

**`order_status_history`** — `id, order_id (FK → orders), status, changed_by (FK → users, nullable), created_at`
Append-only. Rows are never updated or deleted — a full transition record for every order.

**State machine** (enforced in `src/domain/order-status.ts`, independent of Hono/Drizzle so it's unit-testable in isolation):

```
pending → picked_up → in_transit → out_for_delivery → delivered
   └──────────┴─────────────┴───────────────┴──────────→ cancelled
```

`delivered` and `cancelled` are terminal. `cancelled` is reachable from any non-terminal state — matching the assessment's requirement exactly. `DELETE /orders/:id` is implemented as this same cancellation path (a `cancelled_at` timestamp), never a hard delete.

---

## API

All responses use one envelope: `{ success: true, data }` (list endpoints add `pagination`) or `{ success: false, error: { code, message } }`.

| Method | Path | Role | Notes |
|---|---|---|---|
| POST | `/auth/register` | — | Signup; role is never client-selectable |
| POST | `/auth/login` | — | Returns `{ user, token }` |
| GET | `/auth/me` | any | Current user from JWT |
| POST | `/orders` | admin, staff | Strict schema — no `status`/`courier` fields accepted |
| GET | `/orders` | admin, staff | Pagination + `?status=` filter |
| GET | `/orders/my` | courier | Only the courier's own assigned orders |
| GET | `/orders/:id` | admin, staff, courier* | Order + full status history |
| PATCH | `/orders/:id/status` | admin, staff | Validated against the state machine; logs a history row |
| PATCH | `/orders/:id/assign` | admin, staff | Assigns/reassigns a courier |
| DELETE | `/orders/:id` | admin, staff | Soft-cancel |
| GET | `/users/couriers` | admin, staff | Populates the assign-courier dropdown |
| GET | `/users` | admin | Full user directory |
| PATCH | `/users/:id/role` | admin | Role management |

\* couriers can only fetch orders assigned to them; enforced in the service layer, not just the route.

---

## Why Hono.js was used the way it was

**Routing** — one `Hono()` sub-router per resource (`orders.routes.ts`, `auth.routes.ts`, `users.routes.ts`), composed with `app.route()` in `routes/index.ts` and mounted once in `app.ts`. Route files only wire together path → middleware chain → controller; there's no logic in them to keep them scannable as a permissions table (each file's header comment lists exactly who can hit each route). `/orders/my` is registered before `/orders/:id` deliberately, since Hono matches routes in registration order and `:id` would otherwise swallow `my` as a UUID-shaped-looking param.

**Validation** — `@hono/zod-validator`'s `zValidator` (wrapped in a small `validate()` helper) on every route that takes input, targeting `json`, `query`, or `param` per route. Schemas use `.strict()` where the API must reject unknown fields (e.g. `POST /orders` must reject a client trying to sneak in `status` or `courierId`), and `z.coerce.number()` for query-string pagination. This was picked over manual `if` chains specifically because the assessment calls that out — validation lives declaratively in the schema, not scattered through controllers.

**Middleware** — layered per-route rather than blanket-applied, since permissions differ per endpoint: `jwtAuth` (verifies the Bearer token, attaches the user to context) always runs before `requireRole(...roles)` (checks the attached user's role). A global `requestLogger` and `cors` are applied with `app.use("*", ...)`. This mirrors Hono's own middleware composition model instead of an Express-style single `app.use()` auth guard with manual role checks inside handlers.

**Error handling** — a single `app.onError(errorHandler)` at the app level. Domain errors (`OrderNotFoundError`, `InvalidTransitionError`, `ForbiddenError`, etc.) extend one `AppError` base carrying a `statusCode` and `code`; the handler maps known errors to their status/code/message and falls back to a generic `500` for anything unexpected, without leaking internals. Controllers and services never `try/catch` HTTP concerns — they just `throw`, matching Hono's `onError` pattern rather than per-route try/catch blocks.

**Layering** — routes → controllers (thin, HTTP-shape only) → services (transactions, business rules, the state machine) → repositories (the only files that touch Drizzle/SQL). `order.service.ts` is the only place that opens a `db.transaction(...)`, which is what keeps `orders.status` and `order_status_history` from ever drifting apart.

---

## Frontend

- **Role-aware dashboard**: admins/staff see `GET /orders` with status filters and pagination; couriers are routed to `GET /orders/my` (the backend itself 403s a courier on the general list, so the frontend branches on role rather than guessing).
- **Order list** — `OrdersTable` with color-coded `OrderStatusBadge`, `OrderFilters`, and `Pagination`, with explicit loading/error/empty states.
- **Create order form** — mirrors the backend's `createOrderSchema` constraints client-side (no `status`/`courier` fields — those aren't creatable, only assignable/transitionable afterward).
- **Order details** — `OrderStatusTimeline` (renders the full history), `UpdateStatusControl` (only offers transitions the state machine currently allows), `AssignCourierDialog`, `CancelOrderDialog`.
- **Auth token storage** — kept in `sessionStorage` (tab-scoped) behind a single `tokenStorage` module, rather than `localStorage`, so logging in as a different role in a second tab can't silently overwrite an active session in the first.
- **API layer** — one `apiRequest<T>()` wrapper (`src/api/client.ts`) that attaches the bearer token, parses the `{ success, data }` envelope, and throws a typed `ApiError`/`NetworkError` so every page handles failures the same way instead of each doing its own `fetch` + `try/catch`.

---

## Architecture decisions & tradeoffs

- **Numeric weight as a string over the wire.** Postgres `numeric` maps to a JS `string` in Drizzle to avoid floating-point rounding on money-adjacent values; the API accepts a number in the request body (`z.coerce.number()`) and stores/returns it as a string. Fine for this scope; a larger system might standardize on a shared decimal type across both ends.
- **Permissions enforced in code, not in the database.** `user_role` and `order_status` are Postgres enums, but *who* can do *what* is checked in Hono middleware/services, not with row-level security. Simpler to reason about and test at this size; RLS would be the next step if this became multi-tenant.
- **No refresh tokens.** JWTs are short/medium-lived (`JWT_EXPIRES_IN`) with no refresh flow — acceptable for an assessment, not for production, where re-authentication on expiry would need a real UX flow.
- **Soft-delete via `cancelled_at` rather than a boolean.** Keeps *when* it was cancelled without a second lookup into the history table, while the history table remains the source of truth for the full timeline.
- **Minimal logging.** `requestLogger` is a one-line `console.log` per request — deliberately not a full pino/winston setup, since platforms like Railway/Render capture stdout anyway and a 2–3 day assessment doesn't warrant a logging pipeline.

## What I'd improve with more time

- Refresh-token rotation and shorter-lived access tokens.
- Row-level or policy-based permission checks alongside the middleware ones, as a defense-in-depth layer.
- Optimistic UI updates on status transitions instead of waiting on refetch.
- WebSocket/SSE push for live status updates instead of polling/manual refresh.
- Rate limiting on `/auth/login` and `/auth/register`.

---

## Running locally

### Backend

```bash
cd backend/onway-backend
npm install
cp .env.example .env        # fill in DATABASE_URL and a real JWT_SECRET
npm run db:migrate          # applies drizzle/0000_init_schema.sql
npm run dev                 # http://localhost:3000
```

Run the test suite (uses `.env.test` against a **separate** database):

```bash
npm test
```

### Frontend

```bash
cd frontend/onway-frontend
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:3000
npm run dev                 # http://localhost:5173
```

---

## Environment variables

**Backend** (`backend/onway-backend/.env`)

| Variable | Example | Notes |
|---|---|---|
| `DATABASE_URL` | `postgres://user:pass@host:5432/onway` | Must be a valid Postgres connection string |
| `NODE_ENV` | `production` | `development` \| `test` \| `production` |
| `PORT` | `3000` | Most PaaS providers override this — see deployment notes |
| `JWT_SECRET` | *(32+ random hex chars)* | Min. 16 chars; **generate a fresh one for production** |
| `JWT_EXPIRES_IN` | `1d` | e.g. `1h`, `1d`, `7d` |

**Frontend** (`frontend/onway-frontend/.env`)

| Variable | Example |
|---|---|
| `VITE_API_URL` | `https://onway-api.up.railway.app` |


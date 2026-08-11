# VertexERP

A small ERP/CRM system for a wholesale/distribution company — customers, products, stock, sales challans, and follow-ups, built as a full-stack case study.

**Live app:** https://mini-erp-crm.vercel.app *(update if different)*
**Live API:** https://mini-erp-crm-backend-q28i.onrender.com/api
**Health check:** https://mini-erp-crm-backend-q28i.onrender.com/api/health

> Note: the backend is on Render's free tier and spins down after inactivity. The first request after idle time can take 30–60 seconds to respond.

---

## Tech Stack

**Backend**
- Node.js + TypeScript, Express 5
- PostgreSQL via Prisma ORM
- JWT authentication, bcrypt password hashing
- Zod for validation

**Frontend**
- React 19 + TypeScript, Vite
- Tailwind CSS
- Zustand for auth/session state
- Axios for API calls
- jsPDF for challan/invoice PDF export

**Deployment**
- Frontend: Vercel
- Backend: Render
- Database: Render PostgreSQL (or any managed Postgres — see setup below)

AWS deployment was treated as optional per the assignment brief; Vercel + Render was used instead so the full flow could be deployed without incurring cost.

---

## Test Login Credentials

Seeded via `backend/prisma/seed.ts`. All four roles are available:

| Role      | Email             | Password      |
|-----------|-------------------|---------------|
| Admin     | admin@erp.com     | Admin@123     |
| Sales     | sales@erp.com     | Sales@123     |
| Warehouse | warehouse@erp.com | Warehouse@123 |
| Accounts  | accounts@erp.com  | Accounts@123  |

---

## Project Structure

```
mini-erp-crm/
├── backend/          # Express + TypeScript API
│   ├── src/
│   │   ├── controllers/   # Route handlers (auth, customer, product, stock, challan, followup, dashboard)
│   │   ├── routes/        # Route definitions with role-based guards
│   │   ├── middleware/    # authenticate, authorize, error handler
│   │   ├── utils/         # jwt helper, prisma client
│   │   └── config/        # env loading
│   └── prisma/
│       ├── schema.prisma  # DB schema
│       ├── migrations/    # SQL migrations
│       └── seed.ts        # seeds the 4 test users
└── frontend/         # React + Vite SPA
    └── src/
        ├── pages/          # dashboard, customers, products, challans, followups, auth
        ├── components/     # layout (sidebar, topbar, app shell)
        ├── services/       # axios API client
        └── store/          # zustand auth store
```

---

## Architecture Overview

- **Auth**: Stateless JWT. `authenticate` middleware verifies the token on every protected route; `authorize(...roles)` middleware is applied per-route (not just per-controller) so each of the four roles (Admin, Sales, Warehouse, Accounts) only reaches the endpoints it should.
- **Customers**: Standard CRUD plus a `status` field (Lead / Active / Inactive) and `followUpDate`/`notes`. Follow-ups are a separate related table (`FollowUp`) so a customer can have a history of notes rather than a single note field.
- **Products & Stock**: Each product has `currentStock` and `minimumStock`. Every stock change (manual adjustment or challan confirmation) writes a `StockMovement` row (`IN`/`OUT`, quantity, reason, who did it, when) so stock history is fully auditable.
- **Sales Challans**: The core business flow.
  - A challan is created as `DRAFT` with **snapshotted** product data (name, SKU, unit price) copied onto `ChallanItem` at creation time, so later price/name changes on the product don't retroactively change historical challans.
  - Confirming a challan runs inside a single Prisma `$transaction`: it re-checks stock for every line item, decrements `currentStock` using a conditional `WHERE currentStock >= quantity` update (so a race condition can't push stock negative), writes an `OUT` stock movement per item, and only then flips the challan to `CONFIRMED`. If any item is short on stock, the whole transaction rolls back and the API returns a clear error naming the product and the available/required quantity.
  - Only `DRAFT` challans can be cancelled or confirmed; cancelling a draft never touches stock, since stock is only ever deducted on confirmation.
- **Dashboard**: Aggregates stats, recent challans, and low-stock products for a quick operational overview.

---

## API Overview

Base URL (local): `http://localhost:5000/api`
Base URL (prod): `https://mini-erp-crm-backend-q28i.onrender.com/api`

| Method | Endpoint | Roles |
|---|---|---|
| GET | `/health` | public |
| POST | `/auth/login` | public |
| POST | `/customers` | Admin, Sales |
| GET | `/customers` | Admin, Sales, Accounts |
| GET | `/customers/:id` | Admin, Sales, Accounts |
| PUT | `/customers/:id` | Admin, Sales |
| DELETE | `/customers/:id` | Admin |
| GET | `/customers/:id/followups` | Admin, Sales, Accounts |
| POST | `/customers/:id/followups` | Admin, Sales |
| PUT | `/followups/:followUpId` | Admin, Sales |
| DELETE | `/followups/:followUpId` | Admin |
| POST | `/products` | Admin, Warehouse |
| GET | `/products` | Admin, Sales, Warehouse, Accounts |
| GET | `/products/:id` | Admin, Sales, Warehouse, Accounts |
| PUT | `/products/:id` | Admin, Warehouse |
| DELETE | `/products/:id` | Admin |
| POST | `/products/:productId/movements` | Admin, Warehouse |
| GET | `/stock-movements` | Admin, Warehouse, Accounts |
| GET | `/stock/low` | Admin, Warehouse, Sales |
| POST | `/challans` | Admin, Sales |
| GET | `/challans` | Admin, Sales, Warehouse, Accounts |
| GET | `/challans/:id` | Admin, Sales, Warehouse, Accounts |
| PATCH | `/challans/:id/confirm` | Admin, Sales |
| PATCH | `/challans/:id/cancel` | Admin, Sales |
| GET | `/dashboard/stats` | Admin, Sales, Warehouse, Accounts |
| GET | `/dashboard/recent-challans` | Admin, Sales, Warehouse, Accounts |
| GET | `/dashboard/low-stock` | Admin, Sales, Warehouse |

All endpoints except `/health` and `/auth/login` require `Authorization: Bearer <token>`. `/customers` and `/challans` support `?search=` and `/customers`/`/challans` also support `?status=`.

---

## Local Setup

### Prerequisites
- Node.js 20+
- A PostgreSQL database (local install, Docker, or a free hosted instance like Neon/Supabase/Render Postgres)

### 1. Clone and install

```bash
git clone https://github.com/rclalithkumar/mini-erp-crm.git
cd mini-erp-crm

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

**`backend/.env`**
```
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db>
DIRECT_URL=postgresql://<user>:<password>@<host>:<port>/<db>
JWT_SECRET=<any long random string>
PORT=5000
```
`DATABASE_URL` is the connection Prisma uses at runtime (through a pooled connection if your provider supports one). `DIRECT_URL` is used for migrations and should point directly at the database, bypassing any connection pooler.

**`frontend/.env`**
```
VITE_API_URL=http://localhost:5000/api
```

### 3. Set up the database

```bash
cd backend
npx prisma migrate deploy   # applies existing migrations
npm run seed                # creates the 4 test users
```

### 4. Run the app

```bash
# terminal 1
cd backend
npm run dev        # http://localhost:5000

# terminal 2
cd frontend
npm run dev         # http://localhost:5173
```

Log in with any of the [test credentials](#test-login-credentials) above.

### Build for production

```bash
cd backend && npm run build && npm start
cd frontend && npm run build      # outputs to frontend/dist
```

---

## Deployment

**Backend (Render)**
1. New Web Service → connect the GitHub repo, root directory `backend`.
2. Build command: `npm install && npx prisma generate && npm run build`
3. Start command: `npm start`
4. Add env vars: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `PORT` (Render sets `PORT` automatically, but the app also reads a fallback).
5. Run `npx prisma migrate deploy` and `npm run seed` once via Render's shell (or a one-off job) after the first deploy to set up tables and seed users.

**Database**
Any managed Postgres works (Render Postgres, Neon, Supabase). Point `DATABASE_URL`/`DIRECT_URL` at it.

**Frontend (Vercel)**
1. Import the repo, set root directory to `frontend`.
2. Framework preset: Vite. Build command `npm run build`, output directory `dist`.
3. Env var: `VITE_API_URL=<your Render backend URL>/api`.
4. `vercel.json` in the frontend already rewrites all routes to `index.html` for SPA client-side routing.

---

## Assumptions

- Roles are fixed to the four specified in the brief (Admin, Sales, Warehouse, Accounts); no role management UI was built since it wasn't required.
- A challan can only be confirmed once and only from `DRAFT`; there's no "edit after confirm" flow — corrections after confirmation would need a new challan or a manual stock adjustment, which reflects how paper challans work in practice.
- Stock movements from manual adjustments (`/products/:productId/movements`) and from challan confirmation share the same `StockMovement` table so there's one unified audit trail.
- GST number is optional on customers, per spec; no format validation is enforced on it beyond being a string.

## Known Limitations

- No automated tests yet (`npm test` is a placeholder in `backend/package.json`).
- No S3/file upload support (product images) — listed as a bonus in the brief and not attempted.
- No Docker setup or CI/CD pipeline — deployment is manual via Render/Vercel dashboards.
- Free-tier Render backend cold-starts after inactivity (see note at the top).

# Booklynk EV
Live LINK- https://booklynkev.com/

**Invest. Ride. Earn. Scale.**
The Operating System for India's EV Economy.

Booklynk EV is a premium SaaS marketing site + lead-capture backend for an EV investment and fleet-operations platform. It is built as two fully independent applications — a React frontend and a Node.js/Express REST API — that communicate exclusively over HTTP.

```
evos/
├── evos-frontend/     React 19 + TypeScript + Vite + Tailwind + shadcn/ui
└── evos-backend/      Node.js + Express + TypeScript + MongoDB (Mongoose)
```

---

## 1. Tech Stack

### Frontend (`evos-frontend`)
- React 19 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui (Radix primitives)
- Framer Motion (animations)
- React Hook Form + Zod (forms & validation)
- Axios (API client)
- React Router (routing)
- Context API (theme + lead modal + payment modal state)
- Sonner (toast notifications)
- Razorpay Checkout (test mode) for investment payments

### Backend (`evos-backend`)
- Node.js + Express + TypeScript
- MongoDB Atlas + Mongoose
- Zod (request validation)
- Helmet, CORS, Compression, Morgan, express-rate-limit
- Razorpay Node SDK (order creation + HMAC signature verification)
- Repository → Service → Controller layered architecture

---

## 2. Prerequisites

- Node.js 18+
- npm 9+
- A MongoDB connection string (local `mongodb://127.0.0.1:27017` or [MongoDB Atlas](https://www.mongodb.com/atlas))

---

## 3. Installation & Local Setup

### Backend

```bash
cd evos-backend
cp .env.example .env     # then fill in MONGODB_URI
npm install
npm run dev               # http://localhost:5000
```

### Frontend

```bash
cd evos-frontend
cp .env.example .env     # defaults to http://localhost:5000/api
npm install
npm run dev               # http://localhost:5173
```

Open `http://localhost:5173` in your browser. The lead capture modal ("Book a Demo" / any stakeholder CTA) submits directly to the backend API.

---

## 4. Environment Variables

### `evos-backend/.env`

| Variable | Description | Default |
|---|---|---|
| `PORT` | API server port | `5000` |
| `MONGODB_URI` | MongoDB Atlas / local connection string | — (required) |
| `NODE_ENV` | `development` \| `production` \| `test` | `development` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | Rate-limit window (ms) | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `RAZORPAY_KEY_ID` | Razorpay **test mode** key ID | — (required) |
| `RAZORPAY_KEY_SECRET` | Razorpay **test mode** key secret — server-side only, never sent to the client | — (required) |

### `evos-frontend/.env`

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Base URL of the backend REST API | `http://localhost:5000/api` |
| `VITE_RAZORPAY_KEY_ID` | Razorpay **test mode** public key ID (safe to expose client-side) | — (required) |

> ⚠️ **Test mode only.** Both apps are wired to Razorpay's TEST environment. Never put live (`rzp_live_...`) credentials in either `.env` file. The key **secret** must only ever live in `evos-backend/.env` — it is never sent to or read by the frontend.

---

## 5. Run Commands

| Location | Command | Purpose |
|---|---|---|
| `evos-backend` | `npm run dev` | Start API with hot reload (nodemon + ts-node) |
| `evos-backend` | `npm run build` | Compile TypeScript to `dist/` |
| `evos-backend` | `npm start` | Run the compiled production build |
| `evos-backend` | `npm run lint` | ESLint check |
| `evos-frontend` | `npm run dev` | Start Vite dev server |
| `evos-frontend` | `npm run build` | Type-check + production build to `dist/` |
| `evos-frontend` | `npm run preview` | Preview the production build locally |
| `evos-frontend` | `npm run lint` | ESLint check |

---

## 6. Folder Structure

### Backend

```
evos-backend/
└── src/
    ├── config/          # env + MongoDB connection
    ├── controllers/      # HTTP layer — calls services only (lead, payment)
    ├── routes/            # Express routers (leads, payment, health)
    ├── models/            # Mongoose schemas (Lead, Payment)
    ├── repositories/      # MongoDB data access (lead, payment)
    ├── services/          # Business logic (lead, payment + Razorpay verification)
    ├── validators/        # Zod request schemas
    ├── middleware/         # error handling, validation, rate limiting
    ├── utils/              # ApiResponse, ApiError, logger, asyncHandler
    ├── interfaces/          # Shared TypeScript types
    ├── app.ts               # Express app assembly
    └── server.ts             # Entry point / graceful shutdown
```

**Request flow:** `route → validateRequest (Zod) → controller → service → repository → MongoDB`. Controllers never touch Mongoose directly.

### Frontend

```
evos-frontend/
└── src/
    ├── components/
    │   ├── ui/            # shadcn/ui primitives (button, dialog, select, ...)
    │   ├── layout/         # Navbar, Footer
    │   ├── sections/        # Hero, Investor/Rider/Business, InvestmentPlans, FAQ, CTA, ...
    │   ├── shared/           # SectionHeading, AnimatedCounter, ...
    │   ├── LeadCaptureModal.tsx
    │   └── PaymentModal.tsx  # plan checkout → Razorpay → success/failure states
    ├── context/            # ThemeContext, LeadModalContext, PaymentModalContext
    ├── lib/                 # api client, cn util, zod schemas, investment plan data
    ├── types/                # Razorpay Checkout window typings
    ├── pages/                # Home, NotFound
    ├── App.tsx
    └── main.tsx
```

---

## 7. API Documentation

Base URL: `VITE_API_URL` (default `http://localhost:5000/api`)

### `GET /api/health`
Health check.

```json
{
  "success": true,
  "message": "Booklynk EV API is healthy",
  "data": { "status": "ok", "database": "connected", "timestamp": "...", "uptime": 123.4 }
}
```

### `POST /api/leads`
Create a lead submission.

**Body**

```json
{
  "name": "Aarav Sharma",
  "email": "aarav@example.com",
  "phone": "9876543210",
  "city": "Bengaluru",
  "interest": "Investor",
  "budget": "₹2L - ₹5L",
  "message": "Interested in fleet investment."
}
```

- `name`, `email`, `phone`, `city`, `interest` are required.
- `phone` must be a valid 10-digit Indian mobile number (`^[6-9]\d{9}$`).
- `interest` must be one of `Investor | Rider | Business | Other`.
- `budget`, `message` are optional.

**Success — `201 Created`**

```json
{ "success": true, "message": "Lead captured successfully", "data": { "...lead document..." } }
```

**Validation failure — `400 Bad Request`**

```json
{ "success": false, "message": "Validation failed", "errors": ["body.phone: Enter a valid 10-digit Indian mobile number"] }
```

**Duplicate — `409 Conflict`** if a lead with the same email or phone already exists.

### `GET /api/leads`
List leads (paginated).

Query params: `page` (default `1`), `limit` (default `20`, max `100`), `interest` (optional filter).

```json
{
  "success": true,
  "message": "Leads retrieved successfully",
  "data": { "items": [ /* leads */ ], "total": 42, "page": 1, "limit": 20, "totalPages": 3 }
}
```

### `GET /api/leads/:id`
Fetch a single lead by ID. Returns `404` if not found.

### `POST /api/payment/create-order`
Creates a Razorpay order for one of the fixed investment plans (`Starter`, `Growth`, `Enterprise`). The investment amount is **never trusted from the client** — it is resolved server-side from the `plan` value.

**Body**

```json
{ "name": "Aarav Sharma", "email": "aarav@example.com", "phone": "9876543210", "plan": "Growth" }
```

**Success — `201 Created`**

```json
{
  "success": true,
  "message": "Razorpay order created successfully",
  "data": {
    "orderId": "order_xxxxxxxxxxxx",
    "amount": 35000000,
    "currency": "INR",
    "keyId": "rzp_test_xxxxxxxxxxxxxx",
    "name": "Aarav Sharma",
    "email": "aarav@example.com",
    "phone": "9876543210",
    "plan": "Growth",
    "investmentAmount": 350000
  }
}
```

A `payments` document is created immediately with `payment_status: "created"`. `amount` is in paise (smallest currency unit), as required by Razorpay Checkout.

### `POST /api/payment/verify`
Verifies the Razorpay Checkout response using an HMAC-SHA256 signature check against `RAZORPAY_KEY_SECRET` (constant-time comparison). On success, marks the payment `paid` and **automatically captures a lead** in `lead_submissions` (interest `Investor`, silently skipped if a lead with the same email/phone already exists).

**Body** (exactly what Razorpay Checkout's `handler` callback returns)

```json
{
  "razorpay_order_id": "order_xxxxxxxxxxxx",
  "razorpay_payment_id": "pay_xxxxxxxxxxxx",
  "razorpay_signature": "..."
}
```

**Success — `200 OK`** → payment document with `payment_status: "paid"`.
**Failure — `400 Bad Request`** if the signature doesn't match (payment marked `failed`), or **`404`** if the order ID is unknown.

### Standard Response Envelope

```jsonc
// success
{ "success": true, "message": "...", "data": {} }
// failure
{ "success": false, "message": "...", "errors": [] }
```

---

## 8. Database

- **Provider:** MongoDB Atlas (or local MongoDB)
- **Database:** `evos`

**Collection `lead_submissions`**
- Fields: `name`, `email`, `phone`, `city`, `interest`, `budget`, `message`, `createdAt`, `updatedAt`
- Indexes: `email`, `phone`, `createdAt`
- Populated by the Lead Capture Modal **and** automatically after a successful investment payment.

**Collection `payments`**
- Fields: `name`, `email`, `phone`, `plan`, `investmentAmount`, `razorpay_order_id`, `razorpay_payment_id`, `payment_status` (`created` \| `paid` \| `failed`), `createdAt`, `updatedAt`
- Indexes: `email`, `phone`, `razorpay_order_id` (unique)
- A row is written the moment an order is created (`create-order`), then updated to `paid`/`failed` after verification — so abandoned checkouts are also visible.

Mongoose schema timestamps (`createdAt`, `updatedAt`) are enabled automatically on both collections.

---

## 9. Deployment Guide

### Frontend → Vercel
1. Push `evos-frontend/` to a Git repository (or connect the monorepo and set the project root to `evos-frontend`).
2. In Vercel: **New Project** → select the repo → set **Root Directory** to `evos-frontend`.
3. Build command: `npm run build`, Output directory: `dist`.
4. Add environment variables `VITE_API_URL` (your deployed backend, e.g. `https://api.evos.in/api`) and `VITE_RAZORPAY_KEY_ID` (test key).
5. Deploy.

### Backend → Render / Railway
1. Push `evos-backend/` to a Git repository.
2. Create a new **Web Service**, root directory `evos-backend`.
3. Build command: `npm install && npm run build`. Start command: `npm start`.
4. Add environment variables: `PORT` (platform-provided), `MONGODB_URI`, `NODE_ENV=production`, `CORS_ORIGIN=https://your-frontend-domain.com`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
5. Deploy.

### Database → MongoDB Atlas
1. Create a free/shared cluster at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user and allow network access from your backend host (or `0.0.0.0/0` for simplicity during MVP).
3. Copy the connection string into `MONGODB_URI` (database name `evos`).

---

## 10. Future Improvements

- Admin dashboard to view/manage `lead_submissions` (`PUT /api/leads/:id`, `DELETE /api/leads/:id`)
- Authentication for admin/investor/rider dashboards
- Email/SMS notifications on new lead submission
- CMS-driven content for roadmap, FAQ, and features sections
- E2E test suite (Playwright) and API integration tests (Jest/Supertest)
- Real OG image asset (`/public/og-image.png`) for social sharing previews
- CI/CD pipeline (GitHub Actions) running lint, type-check, and build on every PR
- Razorpay webhooks (`payment.captured` / `payment.failed`) as a server-side source of truth in addition to client-driven verification
- Receipt PDF generation and email delivery ("Download Receipt" is currently a placeholder)
- Custom Fleet plan checkout (currently routes to the lead capture form via "Contact Sales" rather than Razorpay, per the fixed-plan-only pricing model)
- Swap in live Razorpay credentials only after a full KYC/activation review — this build is wired for **test mode only**

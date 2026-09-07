# Deploying the frontend to Vercel — 5 portal links

The frontend is one Next.js codebase (`frontend/`) with five role-scoped
route trees: `/super-admin`, `/admin`, `/investor`, `/rider`, `/business`
(see [admin.md](admin.md), [investor.md](investor.md), [rider.md](rider.md),
[business.md](business.md)). This guide deploys it as **5 separate Vercel
projects from that same repo**, each getting its own free `*.vercel.app`
URL and serving only its own role's routes — no custom domain required.

## How the restriction works

`frontend/src/proxy.ts` reads a `NEXT_PUBLIC_PORTAL` env var set
per-project (`super-admin` | `admin` | `investor` | `rider` | `business`).
On a portal-scoped deployment, any request outside that portal's own
prefix (e.g. hitting `/admin` on the investor deployment) gets Next's
normal 404 page — the route genuinely doesn't resolve there, it isn't
just hidden from navigation. `/`, `/login`, `/register`, and `/dashboard`
stay reachable on every portal (shared landing/auth pages).

**This is not a security boundary** — tokens live in `localStorage`, not
a cookie, so middleware can't see who's logged in (same reason
`ProtectedRoute` is documented as UX-only, see [admin.md](admin.md)). It
only decides *which routes exist* on a given deployment. The real
authorization boundary is unchanged: the backend re-derives role/
permissions from the database on every `/api/*` request, identically no
matter which portal's frontend called it.

When `NEXT_PUBLIC_PORTAL` is unset — local dev (`npm run dev`) and the
Docker Compose stack — this is a complete no-op and every route is
served from one app, exactly as before this existed.

## Prerequisites

- This repo pushed to GitHub (already done — see `git remote -v`).
- The backend already deployed somewhere with a public HTTPS URL (see
  [deployment.md](deployment.md) for Render). Vercel only hosts the
  frontend; it needs a live backend to call.
- A Vercel account, with the GitHub repo connected/importable.

## Step 1 — Create 5 Vercel projects

Repeat this 5 times, once per portal. In the Vercel dashboard: **Add New
→ Project → Import** the same GitHub repo each time (Vercel allows
importing one repo into multiple projects).

For each project:

| Setting | Value |
|---|---|
| Project name | e.g. `bookly-super-admin`, `bookly-admin`, `bookly-investor`, `bookly-rider`, `bookly-business` — pick your own if these are taken; the name becomes `<name>.vercel.app` |
| Root Directory | `frontend` |
| Framework Preset | Next.js (auto-detected) |
| Environment Variable | `NEXT_PUBLIC_API_BASE_URL` = your backend's public URL (e.g. `https://booklynk-ev-backend.onrender.com`) |
| Environment Variable | `NEXT_PUBLIC_PORTAL` = `super-admin` / `admin` / `investor` / `rider` / `business` — matching this project |

Deploy each. You'll end up with 5 URLs, e.g.:

- `https://bookly-super-admin.vercel.app`
- `https://bookly-admin.vercel.app`
- `https://bookly-investor.vercel.app`
- `https://bookly-rider.vercel.app`
- `https://bookly-business.vercel.app`

Both env vars are build-time (`NEXT_PUBLIC_*` is inlined into the client
bundle at build time in Next.js) — if you change either one later,
**redeploy** that project for it to take effect, not just save the setting.

## Step 2 — Point the backend's CORS at all 5

The backend only accepts browser requests from origins listed in
`CORS_ORIGINS` (comma-separated — see `app/core/config.py`). Update it on
Render (or wherever the backend runs) to include all 5 Vercel URLs:

```
CORS_ORIGINS=https://bookly-super-admin.vercel.app,https://bookly-admin.vercel.app,https://bookly-investor.vercel.app,https://bookly-rider.vercel.app,https://bookly-business.vercel.app
```

Redeploy the backend for the change to take effect. Until this is done,
every portal's login/API calls will fail with a CORS error in the browser
console — that's expected, not a bug, if you deploy the frontends first.

## Step 3 — Verify each portal

For each of the 5 URLs:

- `/` and `/login` load (shared pages, present on every portal).
- Logging in with an account of the matching role reaches that portal's
  dashboard (e.g. `/investor` on the investor deployment).
- Navigating to another portal's path directly (e.g. `/admin` on the
  investor deployment) returns **Page not found**, not a broken page or
  a hang — this is `proxy.ts` doing its job, confirming
  `NEXT_PUBLIC_PORTAL` was actually picked up at build time. If you
  instead see the real `/admin` panel, the env var didn't take — check
  it's set on that exact project and redeploy.
- `/dashboard` only shows a link to *this* portal's role, not the other
  four (see the `onThisPortal` filter in `app/dashboard/page.tsx`) — a
  user who logs into the wrong portal for their role sees a note telling
  them which portal to use instead, rather than a dead link.

## What this doesn't set up

- **Custom domains / subdomains.** These are plain `*.vercel.app` URLs.
  Attaching a real domain later (e.g. `investor.booklynkev.com`) is a
  Vercel project setting (Settings → Domains) — no code change needed,
  since `NEXT_PUBLIC_PORTAL` is what scopes the deployment, not the
  domain name.
- **Per-portal branding.** The `/` marketing homepage is identical on
  all 5 deployments; it isn't re-skinned per role.
- **Preview/branch deployments.** Vercel will still build a preview for
  every PR/branch on each of the 5 projects by default — harmless, just
  worth knowing you'll get 5x preview URLs per PR, not 1x.

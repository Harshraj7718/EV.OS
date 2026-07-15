# Booklynk EV Frontend

React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui SaaS marketing site for Booklynk EV — "Invest. Ride. Earn. Scale."

This is the frontend half of the Booklynk EV monorepo. It communicates with [`evos-backend`](../evos-backend) exclusively via REST (`VITE_API_URL`).

See the [root README](../README.md) for full project documentation, API reference, and deployment guide.

## Quick Start

```bash
cp .env.example .env
npm install
npm run dev
```

## Scripts

- `npm run dev` — start dev server (http://localhost:5173)
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint

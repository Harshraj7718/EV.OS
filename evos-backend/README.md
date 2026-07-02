# EV.OS Backend

Node.js + Express + TypeScript + MongoDB REST API powering lead capture for EV.OS.

This is the backend half of the EV.OS monorepo. It is a standalone REST API — it does not render any UI and is consumed only by [`evos-frontend`](../evos-frontend) (or any other client) over HTTP.

See the [root README](../README.md) for full project documentation, API reference, and deployment guide.

## Quick Start

```bash
cp .env.example .env   # set MONGODB_URI
npm install
npm run dev
```

## Scripts

- `npm run dev` — start with hot reload (http://localhost:5000)
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run the compiled production build
- `npm run lint` — run ESLint

## Architecture

`route → validateRequest (Zod) → controller → service → repository → MongoDB`

Controllers never access Mongoose directly — all business logic lives in the service layer, all data access lives in the repository layer.

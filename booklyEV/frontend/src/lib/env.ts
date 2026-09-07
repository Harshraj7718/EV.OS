/**
 * Public (browser-exposed) environment configuration.
 * Only NEXT_PUBLIC_* vars are readable client-side; keep secrets server-only.
 */
export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000",
  /**
   * Set per-deployment on a portal-scoped Vercel project (super-admin,
   * admin, investor, rider, business) — see docs/vercel-deployment.md.
   * Undefined locally/Docker, where the full app is served as one.
   */
  portal: process.env.NEXT_PUBLIC_PORTAL || undefined,
} as const;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // "standalone" packages a self-contained server for the Dockerfile /
  // Docker Compose build. Vercel must NOT get this: its own build
  // pipeline generates output-file-tracing artifacts (e.g.
  // next-server.js.nft.json) that "standalone" mode intentionally skips,
  // which fails Vercel's build with an ENOENT on that file. Vercel sets
  // the VERCEL env var automatically during every build, so this is
  // unset there and only applies to `docker build` (where VERCEL is
  // never set) — see docs/vercel-deployment.md.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
};

export default nextConfig;

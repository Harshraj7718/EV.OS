"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";

export function Header() {
  const { user, status } = useAuth();

  return (
    <header className="border-b border-brand-100">
      <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between gap-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-brand-900">
          Booklynk<span className="text-brand-500">EV</span>
        </Link>
        <span className="hidden md:block text-sm text-brand-700/70">
          One Platform. Three Stakeholders. Infinite Possibilities.
        </span>
        <nav className="flex items-center gap-4 text-sm">
          {status === "authenticated" && user ? (
            <Link href="/dashboard" className="font-medium text-brand-600 hover:text-brand-700">
              {user.name.split(" ")[0]}&apos;s dashboard
            </Link>
          ) : status === "unauthenticated" ? (
            <>
              <Link href="/login" className="text-brand-900/70 hover:text-brand-900">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-brand-600 px-4 py-1.5 font-medium text-white hover:bg-brand-700"
              >
                Register
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

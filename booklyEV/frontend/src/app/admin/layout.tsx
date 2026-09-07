"use client";

import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

// ADMIN's own scoped panel, split from SUPER_ADMIN's full one at
// /super-admin (see docs/admin.md) — matching the single-role pattern
// /investor, /rider, and /business already use. RBAC, Audit Logs, and
// Settings pages don't exist under this route tree at all; the backend
// enforces the real boundary on every /api/admin/* call independently
// of which frontend folder made it.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">
        <ProtectedRoute roles={["ADMIN"]}>
          <div className="mx-auto flex max-w-6xl gap-8 px-6 py-8">
            <AdminSidebar />
            <div className="min-w-0 flex-1 pb-16">{children}</div>
          </div>
        </ProtectedRoute>
      </main>
      <Footer />
    </>
  );
}

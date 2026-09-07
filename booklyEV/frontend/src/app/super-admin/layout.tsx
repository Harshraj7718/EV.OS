"use client";

import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SuperAdminSidebar } from "@/components/admin/SuperAdminSidebar";

// Every /super-admin/* page is gated here, once, to SUPER_ADMIN only —
// this panel and /admin (ADMIN's own scoped panel) are separate route
// trees on the frontend now, each single-role, matching the pattern
// /investor, /rider, and /business already use. See docs/admin.md.
// The backend API both panels call remains one shared /api/admin/*
// module, independently gated the same way it always was
// (require_role(SUPER_ADMIN) for SUPER_ADMIN-exclusive endpoints,
// require_admin_permission(code) for the ones ADMIN's grant covers) —
// that boundary doesn't depend on which frontend folder made the call.
export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">
        <ProtectedRoute roles={["SUPER_ADMIN"]}>
          <div className="mx-auto flex max-w-6xl gap-8 px-6 py-8">
            <SuperAdminSidebar />
            <div className="min-w-0 flex-1 pb-16">{children}</div>
          </div>
        </ProtectedRoute>
      </main>
      <Footer />
    </>
  );
}

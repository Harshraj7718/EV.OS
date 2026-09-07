"use client";

import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { BusinessSidebar } from "@/components/business/BusinessSidebar";

// Every /business/* page is gated here, once, to the BUSINESS role only —
// INVESTOR/RIDER/ADMIN/SUPER_ADMIN accounts never reach this panel
// client-side, and every /api/business/* call is independently role-gated
// server-side (require_role(RoleName.BUSINESS), see
// backend/app/modules/businesses/router.py), so this is a UX
// convenience, not the real security boundary — the real multi-tenant
// boundary is resource-ownership scoping in the backend service layer.
export default function BusinessLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">
        <ProtectedRoute roles={["BUSINESS"]}>
          <div className="mx-auto flex max-w-6xl gap-8 px-6 py-8">
            <BusinessSidebar />
            <div className="min-w-0 flex-1 pb-16">{children}</div>
          </div>
        </ProtectedRoute>
      </main>
      <Footer />
    </>
  );
}

"use client";

import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { InvestorSidebar } from "@/components/investor/InvestorSidebar";

// Every /investor/* page is gated here, once, to the INVESTOR role only —
// RIDER/BUSINESS/ADMIN/SUPER_ADMIN accounts never reach this panel client-side,
// and every /api/investor/* call is independently role-gated server-side
// (require_role(RoleName.INVESTOR), see backend/app/modules/investors/router.py),
// so this is a UX convenience, not the real security boundary.
export default function InvestorLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">
        <ProtectedRoute roles={["INVESTOR"]}>
          <div className="mx-auto flex max-w-6xl gap-8 px-6 py-8">
            <InvestorSidebar />
            <div className="min-w-0 flex-1 pb-16">{children}</div>
          </div>
        </ProtectedRoute>
      </main>
      <Footer />
    </>
  );
}

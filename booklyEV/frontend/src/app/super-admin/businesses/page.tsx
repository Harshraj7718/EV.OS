"use client";

import { StakeholderTable } from "@/components/admin/StakeholderTable";
import { adminApi } from "@/lib/admin/api";

export default function SuperAdminBusinessesPage() {
  return (
    <StakeholderTable
      title="Businesses"
      description="Users with the BUSINESS role. No separate business profile exists yet — this is a filtered view of Users."
      fetcher={adminApi.listBusinesses}
    />
  );
}

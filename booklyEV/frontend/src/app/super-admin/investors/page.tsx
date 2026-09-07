"use client";

import { StakeholderTable } from "@/components/admin/StakeholderTable";
import { adminApi } from "@/lib/admin/api";

export default function SuperAdminInvestorsPage() {
  return (
    <StakeholderTable
      title="Investors"
      description="Users with the INVESTOR role. No separate investor profile exists yet — this is a filtered view of Users."
      fetcher={adminApi.listInvestors}
    />
  );
}

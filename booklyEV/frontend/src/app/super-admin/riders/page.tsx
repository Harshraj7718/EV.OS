"use client";

import { StakeholderTable } from "@/components/admin/StakeholderTable";
import { adminApi } from "@/lib/admin/api";

export default function SuperAdminRidersPage() {
  return (
    <StakeholderTable
      title="Riders"
      description="Users with the RIDER role. No separate rider profile exists yet — this is a filtered view of Users."
      fetcher={adminApi.listRiders}
    />
  );
}

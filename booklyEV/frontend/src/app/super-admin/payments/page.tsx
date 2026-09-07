import { EmptyState } from "@/components/admin/EmptyState";

export default function SuperAdminPaymentsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Payments</h1>
      <p className="mt-1 text-sm text-brand-900/60">Platform-wide payment records.</p>
      <div className="mt-6">
        <EmptyState
          title="Not implemented yet"
          description="The payments domain module (model, migrations, API) hasn't been built. This section is here so the dashboard structure is complete — no payment data exists to show yet."
        />
      </div>
    </div>
  );
}

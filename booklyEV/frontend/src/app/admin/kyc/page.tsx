import { EmptyState } from "@/components/admin/EmptyState";

export default function AdminKycPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">KYC</h1>
      <p className="mt-1 text-sm text-brand-900/60">Review and verify identity submissions.</p>
      <div className="mt-6">
        <EmptyState
          title="Not implemented yet"
          description="The kyc.verify permission exists and is ready to enforce, but there's no self-service KYC submission flow yet, so there's nothing here to verify. This section is here so the dashboard structure is complete."
        />
      </div>
    </div>
  );
}

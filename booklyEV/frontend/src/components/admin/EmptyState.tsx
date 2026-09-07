interface EmptyStateProps {
  title: string;
  description: string;
}

/** Honest "not built yet" placeholder — used by dashboard sections that
 * don't have a backing domain module yet (vehicles, fleets, trips,
 * payments, kyc). No fake/sample data is ever shown here. */
export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-12 text-center">
      <h3 className="text-lg font-semibold text-brand-950">{title}</h3>
      <p className="mt-2 text-sm text-brand-900/60">{description}</p>
    </div>
  );
}

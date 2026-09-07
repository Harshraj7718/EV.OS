const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  INACTIVE: "bg-brand-50 text-brand-700",
  SUSPENDED: "bg-red-50 text-red-700",
  PENDING: "bg-amber-50 text-amber-700",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-brand-50 text-brand-700";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>{status}</span>;
}

export interface StakeholderCardProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function StakeholderCard({ eyebrow, title, description }: StakeholderCardProps) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-brand-300">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">
        {eyebrow}
      </p>
      <h3 className="mt-2 text-xl font-semibold text-brand-950">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-brand-900/70">{description}</p>
    </div>
  );
}

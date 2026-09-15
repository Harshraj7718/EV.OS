import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  paid: { badge: 'bg-evos-green/15 text-evos-green', dot: 'bg-evos-green' },
  verified: { badge: 'bg-evos-green/15 text-evos-green', dot: 'bg-evos-green' },
  created: { badge: 'bg-evos-blue/15 text-evos-blue', dot: 'bg-evos-blue' },
  pending_review: { badge: 'bg-amber-500/15 text-amber-400', dot: 'bg-amber-400' },
  failed: { badge: 'bg-destructive/15 text-destructive', dot: 'bg-destructive' },
  rejected: { badge: 'bg-destructive/15 text-destructive', dot: 'bg-destructive' },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? {
    badge: 'bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        style.badge
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} aria-hidden="true" />
      {status.replace('_', ' ')}
    </span>
  );
}

import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-evos-green/15 text-evos-green',
  verified: 'bg-evos-green/15 text-evos-green',
  created: 'bg-evos-blue/15 text-evos-blue',
  pending_review: 'bg-amber-500/15 text-amber-400',
  failed: 'bg-destructive/15 text-destructive',
  rejected: 'bg-destructive/15 text-destructive',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground'
      )}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

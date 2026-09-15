import { useState } from 'react';
import { Filter, Loader2, Users } from 'lucide-react';
import { usePaginatedFetch } from '@/hooks/usePaginatedFetch';
import { Pagination } from '@/components/Pagination';
import { Lead, LeadInterest } from '@/types';

const INTERESTS: LeadInterest[] = ['Investor', 'Rider', 'Business', 'Other'];

export function LeadsTab() {
  const [page, setPage] = useState(1);
  const [interest, setInterest] = useState<string>('');

  const { data, loading, error } = usePaginatedFetch<Lead>('/leads', page, { interest });

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-4 w-4" />
          </span>
          <h2 className="font-display text-lg font-semibold">Leads</h2>
        </div>
        <div className="relative">
          <Filter
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <select
            value={interest}
            onChange={(e) => {
              setInterest(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-input bg-background py-1.5 pl-8 pr-3 text-sm outline-none transition-colors focus:border-primary"
          >
            <option value="">All interests</option>
            {INTERESTS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="mx-5 mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {loading && (
        <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading leads&hellip;
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 font-medium">City</th>
                  <th className="px-5 py-3 font-medium">Interest</th>
                  <th className="px-5 py-3 font-medium">Budget</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((lead) => (
                  <tr key={lead._id} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3 font-medium">{lead.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{lead.email}</td>
                    <td className="px-5 py-3 text-muted-foreground">{lead.phone}</td>
                    <td className="px-5 py-3 text-muted-foreground">{lead.city}</td>
                    <td className="px-5 py-3">
                      <span className="inline-block rounded-full bg-evos-blue/15 px-2.5 py-0.5 text-xs font-medium text-evos-blue">
                        {lead.interest}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{lead.budget || '—'}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(lead.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-muted-foreground">
                      No leads found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

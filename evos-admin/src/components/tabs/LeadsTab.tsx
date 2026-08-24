import { useState } from 'react';
import { usePaginatedFetch } from '@/hooks/usePaginatedFetch';
import { Pagination } from '@/components/Pagination';
import { Lead, LeadInterest } from '@/types';

const INTERESTS: LeadInterest[] = ['Investor', 'Rider', 'Business', 'Other'];

export function LeadsTab() {
  const [page, setPage] = useState(1);
  const [interest, setInterest] = useState<string>('');

  const { data, loading, error } = usePaginatedFetch<Lead>('/leads', page, { interest });

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <h2 className="font-display text-lg font-semibold">Leads</h2>
        <select
          value={interest}
          onChange={(e) => {
            setInterest(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All interests</option>
          {INTERESTS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="p-4 text-sm text-destructive">{error}</p>}
      {loading && <p className="p-4 text-sm text-muted-foreground">Loading&hellip;</p>}

      {!loading && !error && data && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Email</th>
                  <th className="px-4 py-2.5 font-medium">Phone</th>
                  <th className="px-4 py-2.5 font-medium">City</th>
                  <th className="px-4 py-2.5 font-medium">Interest</th>
                  <th className="px-4 py-2.5 font-medium">Budget</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((lead) => (
                  <tr key={lead._id}>
                    <td className="px-4 py-2.5">{lead.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{lead.email}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{lead.phone}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{lead.city}</td>
                    <td className="px-4 py-2.5">{lead.interest}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{lead.budget || '—'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {new Date(lead.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
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

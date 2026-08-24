import { useState } from 'react';
import { usePaginatedFetch } from '@/hooks/usePaginatedFetch';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { Payment, PaymentStatus } from '@/types';

const STATUSES: PaymentStatus[] = ['created', 'paid', 'failed'];

export function PaymentsTab() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');

  const { data, loading, error } = usePaginatedFetch<Payment>('/payment', page, { status });

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <h2 className="font-display text-lg font-semibold">Payments</h2>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm capitalize"
        >
          <option value="">All statuses</option>
          {STATUSES.map((value) => (
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
                  <th className="px-4 py-2.5 font-medium">Plan</th>
                  <th className="px-4 py-2.5 font-medium">Amount</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Order ID</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((payment) => (
                  <tr key={payment._id}>
                    <td className="px-4 py-2.5">{payment.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{payment.email}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{payment.phone}</td>
                    <td className="px-4 py-2.5">{payment.plan}</td>
                    <td className="px-4 py-2.5">
                      ₹{payment.investmentAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={payment.payment_status} />
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                      {payment.razorpay_order_id}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {new Date(payment.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No payments found.
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

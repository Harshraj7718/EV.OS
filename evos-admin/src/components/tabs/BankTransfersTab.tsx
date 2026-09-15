import { useState } from 'react';
import { Download, Filter, Landmark, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePaginatedFetch } from '@/hooks/usePaginatedFetch';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { api, getErrorMessage } from '@/lib/api';
import { BankTransfer, BankTransferStatus } from '@/types';

const STATUSES: BankTransferStatus[] = ['pending_review', 'verified', 'rejected'];

export function BankTransfersTab() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data, loading, error } = usePaginatedFetch<BankTransfer>('/bank-transfer', page, {
    status,
  });

  const handleDownload = async (submission: BankTransfer) => {
    setDownloadingId(submission._id);
    try {
      const response = await api.get(`/bank-transfer/${submission._id}/invoice`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(response.data as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = submission.invoiceFileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Landmark className="h-4 w-4" />
          </span>
          <h2 className="font-display text-lg font-semibold">Bank Transfers</h2>
        </div>
        <div className="relative">
          <Filter
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-input bg-background py-1.5 pl-8 pr-3 text-sm capitalize outline-none transition-colors focus:border-primary"
          >
            <option value="">All statuses</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value.replace('_', ' ')}
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
          Loading bank transfers&hellip;
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
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((submission) => (
                  <tr key={submission._id} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3 font-medium">{submission.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{submission.email}</td>
                    <td className="px-5 py-3 text-muted-foreground">{submission.phone}</td>
                    <td className="px-5 py-3">{submission.plan}</td>
                    <td className="px-5 py-3 font-semibold text-evos-green">
                      ₹{submission.investmentAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={submission.status} />
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(submission.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => handleDownload(submission)}
                        disabled={downloadingId === submission._id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:enabled:border-primary/40 hover:enabled:bg-muted disabled:opacity-50"
                      >
                        {downloadingId === submission._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        Invoice
                      </button>
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center text-muted-foreground">
                      No bank transfer submissions found.
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

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
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
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <h2 className="font-display text-lg font-semibold">Bank Transfers</h2>
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
              {value.replace('_', ' ')}
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
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((submission) => (
                  <tr key={submission._id}>
                    <td className="px-4 py-2.5">{submission.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{submission.email}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{submission.phone}</td>
                    <td className="px-4 py-2.5">{submission.plan}</td>
                    <td className="px-4 py-2.5">
                      ₹{submission.investmentAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={submission.status} />
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {new Date(submission.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => handleDownload(submission)}
                        disabled={downloadingId === submission._id}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:enabled:bg-muted disabled:opacity-50"
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
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
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

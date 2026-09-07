"use client";

import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  emptyMessage?: string;
  getRowKey: (row: T) => string;
  renderActions?: (row: T) => ReactNode;
}

/** Reusable admin list table. Pairs with SearchInput/FilterSelect/Pagination
 * for the full search+filter+paginate+act-on-a-row pattern used across
 * Users/Investors/Riders/Businesses/Audit Logs. */
export function DataTable<T>({
  columns,
  rows,
  loading = false,
  emptyMessage = "No results.",
  getRowKey,
  renderActions,
}: DataTableProps<T>) {
  const colSpan = columns.length + (renderActions ? 1 : 0);

  return (
    <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-brand-100 text-left text-xs uppercase tracking-wide text-brand-900/50">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-medium">
                {col.header}
              </th>
            ))}
            {renderActions && <th className="px-4 py-3 font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={colSpan} className="px-4 py-8 text-center text-brand-900/50">
                Loading…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="px-4 py-8 text-center text-brand-900/50">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={getRowKey(row)}
                className="border-b border-brand-50 last:border-0 hover:bg-brand-50/50"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 align-middle">
                    {col.render(row)}
                  </td>
                ))}
                {renderActions && (
                  <td className="px-4 py-3 align-middle">{renderActions(row)}</td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

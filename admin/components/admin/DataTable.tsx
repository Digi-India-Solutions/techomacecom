import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  Search,
} from 'lucide-react';
import { EmptyState } from './EmptyState';
import { TableSkeleton } from './SkeletonLoader';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  align?: 'left' | 'right' | 'center';
  hiddenByDefault?: boolean;
  csvValue?: (row: T) => string | number | boolean | null | undefined;
  render: (row: T) => React.ReactNode;
  widthClass?: string;
}

export interface BulkAction<T> {
  key: string;
  label: string;
  variant?: 'default' | 'danger';
  onClick: (selectedRows: T[]) => void;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  loading?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchKeys?: (row: T) => string;
  filtersSlot?: React.ReactNode;
  selectable?: boolean;
  bulkActions?: BulkAction<T>[];
  exportFilename?: string;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  data,
  columns,
  getRowId,
  loading = false,
  searchPlaceholder = 'Search records...',
  searchValue,
  onSearchChange,
  searchKeys,
  filtersSlot,
  selectable = false,
  bulkActions = [],
  exportFilename,
  pageSizeOptions = [10, 25, 50],
  defaultPageSize = 10,
  emptyTitle = 'No matching records',
  emptyDescription = 'Try adjusting your search or filter criteria.',
  emptyAction,
  onRowClick,
}: DataTableProps<T>) {
  const [internalSearch, setInternalSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    columns.forEach((c) => {
      if (!c.hiddenByDefault) initial.add(c.key);
    });
    return initial;
  });

  const activeSearch = searchValue !== undefined ? searchValue : internalSearch;
  const setActiveSearch = (v: string) => {
    setPage(1);
    if (onSearchChange) onSearchChange(v);
    else setInternalSearch(v);
  };

  const filteredData = useMemo(() => {
    if (!activeSearch.trim() || !searchKeys) return data;
    const tokens = activeSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return data;
    return data.filter((row) => {
      const target = searchKeys(row).toLowerCase();
      return tokens.every((token) => target.includes(token));
    });
  }, [data, activeSearch, searchKeys]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const col = columns.find((c) => c.key === sortKey);
    if (!col || !col.sortValue) return filteredData;
    const getVal = col.sortValue;
    return [...filteredData].sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      return sortDir === 'asc'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
  }, [filteredData, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pagedData = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, safePage, pageSize]);

  const displayedColumns = columns.filter((c) => visibleCols.has(c.key));

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const pageRowIds = pagedData.map(getRowId);
  const allPageSelected =
    pageRowIds.length > 0 && pageRowIds.every((id) => selectedIds.has(id));

  const toggleSelectAllPage = () => {
    const next = new Set(selectedIds);
    if (allPageSelected) {
      pageRowIds.forEach((id) => next.delete(id));
    } else {
      pageRowIds.forEach((id) => next.add(id));
    }
    setSelectedIds(next);
  };

  const toggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectedRows = data.filter((row) => selectedIds.has(getRowId(row)));

  const handleExportCsv = () => {
    if (!exportFilename) return;
    const exportCols = displayedColumns.filter((c) => c.csvValue);
    const headers = exportCols.map((c) => c.header);
    const rows = sortedData.map((r) => exportCols.map((c) => c.csvValue!(r)));

    const escapeCell = (v: unknown) => {
      const s = v === null || v === undefined ? '' : String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const csv = [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <TableSkeleton rows={6} cols={Math.min(displayedColumns.length, 6)} />;
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#DCE6F2] bg-white p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6B82]" />
            <input
              type="text"
              value={activeSearch}
              onChange={(e) => setActiveSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] pl-9 pr-3 py-2 text-sm text-[#12263F] placeholder-[#5B6B82]/70 focus:border-[#1D5FAF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D5FAF]/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {filtersSlot}

            {/* Column visibility */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setColMenuOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs font-medium text-[#12263F] hover:bg-[#EAF2FC] transition-colors whitespace-nowrap shrink-0"
              >
                <Columns3 className="h-3.5 w-3.5 text-[#5B6B82]" />
                Columns
              </button>
              {colMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setColMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-30 mt-1.5 w-52 rounded-xl border border-[#DCE6F2] bg-white p-2 shadow-lg">
                    <p className="px-2 py-1 text-xs font-semibold text-[#5B6B82]">
                      Visible Columns
                    </p>
                    <div className="mt-1 max-h-60 overflow-y-auto space-y-0.5">
                      {columns.map((c) => (
                        <label
                          key={c.key}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-[#12263F] hover:bg-[#EAF2FC] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={visibleCols.has(c.key)}
                            onChange={() => {
                              const next = new Set(visibleCols);
                              if (next.has(c.key) && next.size > 1) next.delete(c.key);
                              else next.add(c.key);
                              setVisibleCols(next);
                            }}
                            className="rounded border-[#DCE6F2] text-[#1D5FAF] focus:ring-[#1D5FAF]"
                          />
                          <span className="truncate">{c.header}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {exportFilename && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs font-medium text-[#12263F] hover:bg-[#EAF2FC] transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="h-3.5 w-3.5 text-[#5B6B82]" />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Bulk selection bar */}
        {selectable && selectedRows.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#1D5FAF]/25 bg-[#EAF2FC] px-3.5 py-2">
            <span className="text-xs font-semibold text-[#12263F] tabular-nums">
              {selectedRows.length} {selectedRows.length === 1 ? 'item' : 'items'} selected
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {bulkActions.map((act) => (
                <button
                  key={act.key}
                  type="button"
                  onClick={() => {
                    act.onClick(selectedRows);
                    setSelectedIds(new Set());
                  }}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    act.variant === 'danger'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-white border border-[#DCE6F2] text-[#12263F] hover:bg-[#1D5FAF] hover:text-white hover:border-[#1D5FAF]'
                  }`}
                >
                  {act.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-xs font-medium text-[#5B6B82] hover:text-[#12263F] px-2 py-1"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      {pagedData.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      ) : (
        <div className="rounded-xl border border-[#DCE6F2] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#DCE6F2] bg-[#F6F9FD]">
                  {selectable && (
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleSelectAllPage}
                        aria-label="Select all rows on page"
                        className="rounded border-[#DCE6F2] text-[#1D5FAF] focus:ring-[#1D5FAF]"
                      />
                    </th>
                  )}
                  {displayedColumns.map((col) => {
                    const isSorted = sortKey === col.key;
                    return (
                      <th
                        key={col.key}
                        className={`px-4 py-3 text-xs font-semibold text-[#5B6B82] whitespace-nowrap ${
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                              ? 'text-center'
                              : 'text-left'
                        } ${col.widthClass || ''}`}
                      >
                        {col.sortable && col.sortValue ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(col.key)}
                            className="inline-flex items-center gap-1 hover:text-[#12263F] transition-colors"
                          >
                            <span>{col.header}</span>
                            {isSorted ? (
                              sortDir === 'asc' ? (
                                <ArrowUp className="h-3.5 w-3.5 text-[#1D5FAF]" />
                              ) : (
                                <ArrowDown className="h-3.5 w-3.5 text-[#1D5FAF]" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-50" />
                            )}
                          </button>
                        ) : (
                          col.header
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE6F2] text-sm">
                {pagedData.map((row) => {
                  const id = getRowId(row);
                  const isSelected = selectedIds.has(id);
                  return (
                    <tr
                      key={id}
                      onClick={() => onRowClick?.(row)}
                      className={`transition-colors ${
                        isSelected ? 'bg-[#EAF2FC]/70' : 'hover:bg-[#F6F9FD]'
                      } ${onRowClick ? 'cursor-pointer' : ''}`}
                    >
                      {selectable && (
                        <td
                          className="px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(id)}
                            aria-label="Select row"
                            className="rounded border-[#DCE6F2] text-[#1D5FAF] focus:ring-[#1D5FAF]"
                          />
                        </td>
                      )}
                      {displayedColumns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-4 py-3 align-middle ${
                            col.align === 'right'
                              ? 'text-right'
                              : col.align === 'center'
                                ? 'text-center'
                                : 'text-left'
                          }`}
                        >
                          {col.render(row)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DCE6F2] bg-[#F6F9FD] px-4 py-2.5 text-xs text-[#5B6B82]">
            <div className="flex items-center gap-2 tabular-nums">
              <span>
                Showing {(safePage - 1) * pageSize + 1}–
                {Math.min(safePage * pageSize, sortedData.length)} of {sortedData.length}
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                aria-label="Rows per page"
                className="rounded-md border border-[#DCE6F2] bg-white px-2 py-1 text-xs text-[#12263F]"
              >
                {pageSizeOptions.map((s) => (
                  <option key={s} value={s}>
                    {s} / page
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="inline-flex items-center gap-1 rounded-md border border-[#DCE6F2] bg-white px-2.5 py-1 text-xs font-medium text-[#12263F] hover:bg-[#EAF2FC] disabled:opacity-45 disabled:hover:bg-white"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>
              <span className="px-2 tabular-nums font-medium text-[#12263F]">
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="inline-flex items-center gap-1 rounded-md border border-[#DCE6F2] bg-white px-2.5 py-1 text-xs font-medium text-[#12263F] hover:bg-[#EAF2FC] disabled:opacity-45 disabled:hover:bg-white"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

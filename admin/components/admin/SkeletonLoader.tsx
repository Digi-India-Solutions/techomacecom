import React from 'react';

export function TableSkeleton({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-[#DCE6F2] bg-white overflow-hidden">
      <div className="border-b border-[#DCE6F2] bg-[#F6F9FD] px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3.5 flex-1 rounded bg-[#DCE6F2]/70 animate-pulse" />
        ))}
      </div>
      <div className="divide-y divide-[#DCE6F2]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-4 py-3.5 flex items-center gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-4 flex-1 rounded bg-[#EAF2FC] animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function KpiGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[#DCE6F2] bg-white p-4 space-y-3"
        >
          <div className="h-3 w-28 rounded bg-[#EAF2FC] animate-pulse" />
          <div className="h-7 w-32 rounded bg-[#DCE6F2]/80 animate-pulse" />
          <div className="h-3 w-24 rounded bg-[#EAF2FC] animate-pulse" />
        </div>
      ))}
    </div>
  );
}

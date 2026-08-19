import React from 'react';

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
          <div className="h-3 w-24 bg-slate-200 rounded"></div>
          <div className="h-7 w-36 bg-slate-200 rounded"></div>
          <div className="h-2.5 w-28 bg-slate-100 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function TableRowSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="animate-pulse divide-y divide-slate-200">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="p-4 flex items-center justify-between gap-4 bg-white">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-4 bg-slate-200 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="h-64 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm animate-pulse flex flex-col justify-between">
      <div className="h-4 w-40 bg-slate-200 rounded"></div>
      <div className="flex items-end justify-between gap-2 h-40 pt-4">
        {[40, 65, 30, 80, 55, 90, 70, 45, 60, 75].map((h, i) => (
          <div key={i} style={{ height: `${h}%` }} className="w-full bg-slate-200 rounded-t"></div>
        ))}
      </div>
    </div>
  );
}

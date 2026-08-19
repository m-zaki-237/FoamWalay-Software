import React from 'react';

export default function LoadingState({ message = 'Loading data...', type = 'table' }) {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-800/60 border border-slate-700/50"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
      <div className="inline-block w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-semibold text-slate-400">{message}</p>
    </div>
  );
}

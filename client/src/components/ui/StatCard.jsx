import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'emerald' }) {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100'
  };

  const iconBgMap = {
    emerald: 'bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-100 text-blue-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700'
  };

  return (
    <div className={`p-5 rounded-2xl border bg-white shadow-sm flex items-center justify-between transition-colors hover:border-slate-300 ${colorMap[color] || colorMap.emerald}`}>
      <div className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">{value}</h3>
        {subtitle && (
          <p className="text-xs text-slate-600 font-medium">{subtitle}</p>
        )}
      </div>
      {Icon && (
        <div className={`p-3 rounded-xl ${iconBgMap[color] || iconBgMap.emerald}`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
}

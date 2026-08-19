import React from 'react';

export default function Select({
  label,
  value,
  onChange,
  options = [],
  required = false,
  error,
  className = ''
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-3.5 py-2 bg-white border ${
          error ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-600'
        } rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-1 transition-colors ${className}`}
      >
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value} disabled={opt.disabled} className="text-slate-900 bg-white">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
}

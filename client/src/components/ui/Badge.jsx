import React from 'react';

export default function Badge({ children, variant = 'neutral', size = 'md' }) {
  const variants = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs'
  };

  return (
    <span className={`inline-flex items-center font-bold rounded-lg border uppercase tracking-wider ${variants[variant] || variants.neutral} ${sizes[size] || sizes.md}`}>
      {children}
    </span>
  );
}

export function StockBadge({ stock, minStock = 0 }) {
  if (stock <= 0) {
    return <Badge variant="danger">Out of Stock</Badge>;
  }
  if (stock <= minStock) {
    return <Badge variant="warning">Low Stock</Badge>;
  }
  return <Badge variant="success">In Stock</Badge>;
}

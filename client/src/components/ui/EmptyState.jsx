import React from 'react';
import Button from './Button';
import { PackageOpen } from 'lucide-react';

export default function EmptyState({
  title = 'No Data Available',
  description = 'There are no items to display at this moment.',
  actionText,
  onAction,
  icon: Icon = PackageOpen
}) {
  return (
    <div className="p-12 text-center flex flex-col items-center justify-center space-y-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="p-4 rounded-2xl bg-slate-100 text-slate-700">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>
      <div className="max-w-sm space-y-1">
        <h4 className="text-base font-bold text-slate-900 font-heading">{title}</h4>
        <p className="text-xs text-slate-600 font-medium leading-relaxed">{description}</p>
      </div>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}

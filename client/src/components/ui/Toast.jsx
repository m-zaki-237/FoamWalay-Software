import React from 'react';
import { useToastStore } from '../../stores/toastStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
          info: <Info className="w-5 h-5 text-blue-600 shrink-0" />
        };

        const borders = {
          success: 'border-emerald-200 bg-white text-slate-800',
          error: 'border-rose-200 bg-white text-slate-800',
          info: 'border-blue-200 bg-white text-slate-800'
        };

        return (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 rounded-xl border ${borders[t.type] || borders.info} shadow-xl flex items-center justify-between gap-3 animate-fadeIn text-xs font-medium`}
          >
            <div className="flex items-center gap-2.5">
              {icons[t.type] || icons.info}
              <span>{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

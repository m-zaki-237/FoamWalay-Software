import React from 'react';
import Button from './Button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({ message = 'An error occurred while loading data.', onRetry }) {
  return (
    <div className="p-8 text-center flex flex-col items-center justify-center space-y-3 bg-rose-50 border border-rose-200 rounded-2xl">
      <div className="p-3 rounded-xl bg-rose-100 text-rose-600">
        <AlertCircle className="w-6 h-6" />
      </div>
      <p className="text-xs font-semibold text-rose-800 max-w-md">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={onRetry}>
          Retry Loading
        </Button>
      )}
    </div>
  );
}

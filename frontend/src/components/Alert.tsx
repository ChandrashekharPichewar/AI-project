import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface AlertProps {
  type: 'error' | 'success';
  message: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const isError = type === 'error';

  return (
    <div
      className={`flex items-start justify-between p-3.5 rounded-lg border text-sm transition-all animate-fadeIn ${
        isError
          ? 'bg-rose-50 border-rose-200 text-rose-800'
          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
      }`}
    >
      <div className="flex items-center gap-2.5">
        {isError ? (
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        )}
        <span className="font-medium">{message}</span>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          type="button"
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

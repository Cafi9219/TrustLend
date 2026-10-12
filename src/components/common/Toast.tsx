import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id?: string;
  type?: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  type = 'success',
  title,
  message,
  onClose,
  duration = 4500,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeConfig = {
    success: {
      bg: 'bg-emerald-900/90 text-white border-emerald-700',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />,
    },
    error: {
      bg: 'bg-rose-900/90 text-white border-rose-700',
      icon: <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />,
    },
    info: {
      bg: 'bg-slate-900/95 text-white border-slate-700',
      icon: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
    },
  };

  const current = typeConfig[type];

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md max-w-md animate-fade-in ${current.bg}`}>
      {current.icon}
      <div className="flex-1 text-sm">
        <h4 className="font-semibold">{title}</h4>
        {message && <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">{message}</p>}
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-white transition-colors p-1"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

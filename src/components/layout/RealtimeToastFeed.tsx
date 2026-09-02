import React, { useState, useEffect } from 'react';
import { db, RealtimeDispatchEvent } from '../../lib/db';
import { Radio, X, CheckCircle2, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';

export const RealtimeToastFeed: React.FC = () => {
  const [toasts, setToasts] = useState<RealtimeDispatchEvent[]>([]);
  const { lang } = useLanguage();

  useEffect(() => {
    const unsubscribe = db.subscribeToRealtime((event) => {
      setToasts((prev) => [event, ...prev.slice(0, 4)]);
      // Auto-remove toast after 6 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== event.id));
      }, 6000);
    });

    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto p-3.5 rounded-2xl bg-slate-900/95 dark:bg-slate-950/95 text-white border border-purple-500/40 shadow-xl shadow-purple-950/30 backdrop-blur-xl animate-in slide-in-from-bottom-3 duration-200 flex items-start gap-3"
        >
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                Supabase Realtime
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(toast.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>

            <div className="text-xs font-semibold text-slate-100 mt-1 flex items-center gap-1.5 truncate">
              <span>{toast.eventType}</span>
              <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-purple-300 truncate">{toast.target}</span>
            </div>

            <div className="text-[11px] text-slate-300 mt-0.5 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">
                {lang === 'fr'
                  ? 'Portail synchronisé instantanément'
                  : 'Portal updated instantly via Realtime'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

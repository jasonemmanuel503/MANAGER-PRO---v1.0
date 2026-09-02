import React, { useState } from 'react';
import { X, AlertCircle, Send, CheckCircle2 } from 'lucide-react';
import { db } from '../../lib/db';
import { useLanguage } from '../../lib/i18n';
import { InfoTooltip } from '../common/InfoTooltip';

interface TeacherDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  recordType: 'attendance' | 'logbook' | 'payroll';
  recordId: string;
  recordTitle?: string;
  onSuccess?: () => void;
}

export const TeacherDisputeModal: React.FC<TeacherDisputeModalProps> = ({
  isOpen,
  onClose,
  teacherId,
  recordType,
  recordId,
  recordTitle,
  onSuccess,
}) => {
  const { t, lang } = useLanguage();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError(lang === 'fr' ? 'Veuillez saisir un motif.' : 'Please provide a clear reason.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      db.createDispute({
        teacher_id: teacherId,
        related_record_type: recordType,
        related_record_id: recordId,
        reason: reason.trim(),
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setReason('');
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch {
      setError(lang === 'fr' ? 'Erreur lors de la soumission.' : 'Failed to submit dispute.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="teacher-dispute-modal"
        className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl shadow-purple-950/40 text-slate-100"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                {t('dispute_modal_title')}
                <InfoTooltip text={t('info_locked_payroll')} />
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {recordType.toUpperCase()} #{recordId.substring(0, 8)}
                {recordTitle ? ` • ${recordTitle}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white">{t('dispute_submitted')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="dispute-reason-input" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span>{t('dispute_reason')}</span>
                <InfoTooltip text={t('info_locked_payroll')} />
              </label>
              <textarea
                id="dispute-reason-input"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  lang === 'fr'
                    ? 'Ex: Leçon décalée d\'un créneau avec accord du VP; ou effectif à rectifier...'
                    : 'E.g., Lesson was rescheduled per VP approval; or need clarification on deduction...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                id="dispute-submit-btn"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-purple-900/30 inline-flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? t('loading') : t('submit_dispute')}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

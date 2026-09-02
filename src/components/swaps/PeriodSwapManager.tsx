import React, { useState, useEffect, useMemo } from 'react';
import { PeriodSwap, TimetableSlot, Subject, Teacher, Account, UserRole } from '../../types';
import { db } from '../../lib/db';
import { useLanguage } from '../../lib/i18n';
import { InfoTooltip } from '../common/InfoTooltip';
import { SkeletonLoader } from '../common/SkeletonLoader';
import {
  Repeat,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
  Clock,
  Sparkles,
  DollarSign,
  FileCheck2,
  Radio,
  Plus,
  ArrowRight,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

interface PeriodSwapManagerProps {
  schoolId: string;
  levelId: string;
  currentRole: UserRole;
  currentAccountId: string;
}

export const PeriodSwapManager: React.FC<PeriodSwapManagerProps> = ({
  schoolId,
  levelId,
  currentRole,
  currentAccountId,
}) => {
  const { t, lang } = useLanguage();

  const [swaps, setSwaps] = useState<PeriodSwap[]>([]);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Array<Teacher & { account: Account }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Request Simulation Modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [swapReason, setSwapReason] = useState<string>('Medical leave / Convalescence');
  const [requestError, setRequestError] = useState<string | null>(null);

  // Per-swap selected substitute override
  const [substituteOverrides, setSubstituteOverrides] = useState<Record<string, string>>({});

  // Feedback banner
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Role permissions: VP and DM approve period swaps
  const canApprove =
    currentRole === 'VP' ||
    currentRole === 'DM' ||
    currentRole === 'Principal' ||
    currentRole === 'Founder';

  const loadData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setSwaps(db.getPeriodSwapsForPartition(schoolId, levelId));
      setSlots(db.getTimetableSlotsForPartition(schoolId, levelId));
      setSubjects(db.getSubjectsForPartition(schoolId, levelId));
      setTeachers(db.getTeachersForPartition(schoolId, levelId));
      setIsLoading(false);
    }, 200);
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribeToRealtime((event) => {
      if (event.table === 'period_swaps' || event.table === 'timetable_slots') {
        setSwaps(db.getPeriodSwapsForPartition(schoolId, levelId));
        setSlots(db.getTimetableSlotsForPartition(schoolId, levelId));
      }
    });
    return unsub;
  }, [schoolId, levelId]);

  // Find qualified suggestions when selecting a slot in the simulation modal
  const simulatedSlot = slots.find((s) => s.id === selectedSlotId);
  const slotSuggestions = useMemo(() => {
    if (!simulatedSlot) return [];
    return db.getTeacherSuggestionsForSlot({
      schoolId,
      levelId,
      subjectId: simulatedSlot.subject_id,
      day: simulatedSlot.day,
      startTime: simulatedSlot.start_time,
      duration: simulatedSlot.duration,
      ignoreSlotId: simulatedSlot.id,
    });
  }, [simulatedSlot, schoolId, levelId]);

  const handleOpenSimulateModal = () => {
    if (slots.length === 0) {
      alert('No timetable slots available to swap.');
      return;
    }
    setSelectedSlotId(slots[0]?.id || '');
    setSwapReason('Medical emergency / Convalescence');
    setRequestError(null);
    setIsRequestModalOpen(true);
  };

  const handleCreateSwapRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedSlot) return;

    // Pick top suggestion or first free teacher
    const suggestedTeacher = slotSuggestions.find(
      (s) => s.teacher.id !== simulatedSlot.teacher_id && !s.hasTimeConflict
    );

    try {
      db.requestPeriodSwap({
        school_id: schoolId,
        level_id: levelId,
        timetable_slot_id: simulatedSlot.id,
        requested_by_teacher_id: simulatedSlot.teacher_id,
        suggested_replacement_id: suggestedTeacher ? suggestedTeacher.teacher.id : undefined,
        reason: swapReason,
      });

      setIsRequestModalOpen(false);
      loadData();
      setActionSuccess(
        lang === 'fr'
          ? 'Demande de remplacement soumise avec suggestions IA'
          : 'Period swap request submitted with AI candidate suggestions'
      );
      setTimeout(() => setActionSuccess(null), 4500);
    } catch (err: unknown) {
      setRequestError(err instanceof Error ? err.message : 'Request failed');
    }
  };

  const handleApprove = (swap: PeriodSwap) => {
    // Check if VP/DM picked a specific substitute override
    const finalSubstituteId =
      substituteOverrides[swap.id] ||
      swap.suggested_replacement_id ||
      teachers.find((t) => t.id !== swap.requested_by_teacher_id)?.id;

    if (!finalSubstituteId) {
      alert('Please designate a substitute teacher.');
      return;
    }

    try {
      db.approvePeriodSwap({
        swap_id: swap.id,
        assigned_replacement_id: finalSubstituteId,
        approved_by_account_id: currentAccountId,
      });
      loadData();
      setActionSuccess(
        lang === 'fr'
          ? 'Remplacement approuvé et notifié en temps réel via Supabase'
          : 'Substitute assigned & dispatched in Realtime to teacher portal'
      );
      setTimeout(() => setActionSuccess(null), 4500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Approval failed');
    }
  };

  const handleReject = (swapId: string) => {
    const note = prompt('Optional rejection note:');
    try {
      db.rejectPeriodSwap({
        swap_id: swapId,
        rejected_by_account_id: currentAccountId,
        note: note || undefined,
      });
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Rejection failed');
    }
  };

  const pendingSwaps = swaps.filter((s) => s.status === 'pending');
  const resolvedSwaps = swaps.filter((s) => s.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl shadow-black/20">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-purple-950/40">
              <Repeat className="w-5 h-5" />
            </div>
            <div className="flex items-center">
              <h1 className="text-xl font-black text-white tracking-tight">
                {t('period_swaps_title')}
              </h1>
              <InfoTooltip content={t('info_swap_workflow')} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenSimulateModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('simulate_swap_request')}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2.5 backdrop-blur-md animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Workload & Payroll Attribution Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-purple-500/15 backdrop-blur-md flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <span>{t('pending_swaps')}</span>
              <InfoTooltip content={t('info_pending_swaps')} />
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {pendingSwaps.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/40 border border-purple-500/15 backdrop-blur-md flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <span>{t('approved_covers')}</span>
              <InfoTooltip content={t('info_approved_covers')} />
            </div>
            <div className="text-2xl font-black text-cyan-400 mt-1">
              {resolvedSwaps.filter((s) => s.status === 'approved').length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/40 border border-purple-500/15 backdrop-blur-md flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <span>{t('payroll_load_sync')}</span>
              <InfoTooltip content={t('info_payroll_load')} />
            </div>
            <div className="text-xs font-mono font-bold text-emerald-400 mt-1.5 flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Realtime Synced</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Section 1: Pending Swap Approvals (VP / DM Action Station) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-300">
              {t('pending_swaps')}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono font-bold">
              {pendingSwaps.length}
            </span>
          </div>
          {!canApprove && (
            <span className="text-xs text-slate-400 font-mono">
              [Review only — VP / DM approval required]
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/10">
            <SkeletonLoader lines={4} />
          </div>
        ) : pendingSwaps.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/30 border border-white/5 text-center text-xs text-slate-400">
            {lang === 'fr'
              ? 'Aucune demande de remplacement en attente'
              : 'No pending period swap requests at this time'}
          </div>
        ) : (
          <div className="space-y-3">
            {pendingSwaps.map((swap) => {
              const slot = slots.find((s) => s.id === swap.timetable_slot_id);
              const subject = slot ? subjects.find((sub) => sub.id === slot.subject_id) : null;
              const originalTeacher = teachers.find((t) => t.id === swap.requested_by_teacher_id);
              const suggestedTeacher = teachers.find((t) => t.id === swap.suggested_replacement_id);
              const selectedSubstituteId =
                substituteOverrides[swap.id] || swap.suggested_replacement_id || '';

              return (
                <div
                  key={swap.id}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-purple-500/25 hover:border-purple-500/40 backdrop-blur-xl shadow-xl shadow-black/20 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-black">
                          {slot?.day || 'Day'} • {slot?.start_time || '00:00'} ({slot?.duration || 50} min)
                        </span>
                        <span className="text-sm font-extrabold text-white">
                          {subject?.name || 'Subject'}
                        </span>
                        <span className="text-xs font-mono font-bold text-cyan-400">
                          [{slot?.class_name}]
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 flex items-center gap-2 pt-1">
                        <span className="text-rose-400 flex items-center gap-1">
                          <UserX className="w-3.5 h-3.5" />
                          <span>
                            {t('original_teacher')}: {originalTeacher?.account.full_name}
                          </span>
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400 italic">
                          &ldquo;{swap.reason}&rdquo;
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-slate-500 self-end sm:self-auto">
                      ID: {swap.id}
                    </div>
                  </div>

                  {/* Replacement Candidate Selection */}
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t('suggested_substitute')}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-200">
                        {suggestedTeacher ? (
                          <span>
                            {suggestedTeacher.account.full_name} ({suggestedTeacher.department || 'General'})
                          </span>
                        ) : (
                          <span className="text-slate-500">None suggested automatically</span>
                        )}
                      </div>
                    </div>

                    {/* Choose / Override Substitute */}
                    {canApprove && (
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedSubstituteId}
                          onChange={(e) =>
                            setSubstituteOverrides((prev) => ({
                              ...prev,
                              [swap.id]: e.target.value,
                            }))
                          }
                          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-semibold focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                        >
                          <option value="">-- Choose Cover Teacher --</option>
                          {teachers
                            .filter((t) => t.id !== swap.requested_by_teacher_id)
                            .map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.account.full_name} ({t.department || 'General'})
                              </option>
                            ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => handleApprove(swap)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-900/30 cursor-pointer transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t('approve_and_dispatch')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReject(swap.id)}
                          className="p-2 rounded-xl bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-400 border border-rose-900/40 cursor-pointer transition-colors"
                          title={t('reject')}
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Audit Log & Resolved Covers */}
      <div className="space-y-3 pt-4 border-t border-purple-500/15">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-300">
              {t('audit_log_title')}
            </h2>
            <InfoTooltip content={t('info_audit_log')} />
          </div>
          <span className="text-xs font-mono text-cyan-400">
            {resolvedSwaps.length} {lang === 'fr' ? 'entrées' : 'records'}
          </span>
        </div>

        {resolvedSwaps.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/20 border border-white/5 text-center text-xs text-slate-500">
            {lang === 'fr'
              ? 'Aucun historique de remplacement enregistré'
              : 'No resolved swap records logged'}
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-900/40 border border-purple-500/15 overflow-hidden backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-white/5 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">{t('status')}</th>
                    <th className="p-3.5">{t('class_label')} & {t('subject')}</th>
                    <th className="p-3.5">{t('original_teacher')}</th>
                    <th className="p-3.5">{t('assigned_substitute')}</th>
                    <th className="p-3.5">{t('payroll_load_sync')}</th>
                    <th className="p-3.5">{t('timestamp')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {resolvedSwaps.map((swap) => {
                    const slot = slots.find((s) => s.id === swap.timetable_slot_id);
                    const subject = slot ? subjects.find((sub) => sub.id === slot.subject_id) : null;
                    const originalTeacher = teachers.find((t) => t.id === swap.requested_by_teacher_id);
                    const assignedSubstitute = teachers.find(
                      (t) => t.id === swap.assigned_replacement_id
                    );

                    return (
                      <tr key={swap.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5">
                          {swap.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3" />
                              Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-[10px]">
                              <XCircle className="w-3 h-3" />
                              Rejected
                            </span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <div className="font-extrabold text-white">
                            {subject?.name || 'Subject'}
                          </div>
                          <div className="text-[10px] text-cyan-400 font-mono">
                            {slot?.class_name} • {slot?.day} {slot?.start_time}
                          </div>
                        </td>

                        <td className="p-3.5 text-slate-300">
                          <div>{originalTeacher?.account.full_name}</div>
                          <div className="text-[10px] text-emerald-400 font-mono">
                            [Exempt -0h]
                          </div>
                        </td>

                        <td className="p-3.5 text-slate-200">
                          {assignedSubstitute ? (
                            <div>
                              <div className="font-bold">
                                {assignedSubstitute.account.full_name}
                              </div>
                              <div className="text-[10px] text-cyan-400 font-mono">
                                [Credited +1 period]
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-bold">
                            <FileCheck2 className="w-3.5 h-3.5" />
                            Payroll Adjusted
                          </span>
                        </td>

                        <td className="p-3.5 text-slate-400 font-mono text-[10px]">
                          {new Date(swap.created_at).toLocaleDateString()}{' '}
                          {new Date(swap.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Simulation Request Modal */}
      {isRequestModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in-50 duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-purple-500/30 p-6 shadow-2xl shadow-purple-950/50 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white">
                  <Repeat className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-white">
                  {t('simulate_swap_request')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {requestError && (
              <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{requestError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSwapRequest} className="space-y-4">
              {/* Select Slot */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  {t('timetable_slot')}
                </label>
                <select
                  required
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-semibold focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                >
                  {slots.map((slot) => {
                    const sub = subjects.find((s) => s.id === slot.subject_id);
                    const tch = teachers.find((t) => t.id === slot.teacher_id);
                    return (
                      <option key={slot.id} value={slot.id}>
                        {slot.day} {slot.start_time} • {sub?.name} ({slot.class_name}) — {tch?.account.full_name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Unavailability Reason */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  {t('reason')}
                </label>
                <input
                  type="text"
                  required
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  placeholder="e.g. Official exam supervision, Sick leave, Bereavement"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white placeholder-slate-500 text-xs font-semibold focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              {/* Realtime Candidate Preview */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Candidate Suggestions
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Qualified & free this slot
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  {slotSuggestions
                    .filter((s) => !s.hasTimeConflict && s.teacher.id !== simulatedSlot?.teacher_id)
                    .slice(0, 2)
                    .map((s) => (
                      <div
                        key={s.teacher.id}
                        className="p-2 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-between"
                      >
                        <span className="font-bold text-white">
                          {s.teacher.account.full_name}
                        </span>
                        <span className="text-[10px] text-cyan-400 font-mono">
                          {s.matchReasonEn}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-xs font-semibold cursor-pointer transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs font-bold cursor-pointer transition-all shadow-md shadow-purple-900/30"
                >
                  {t('submit_request')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

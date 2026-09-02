import React, { useState } from 'react';
import {
  Teacher,
  Account,
  School,
  Level,
  TimetableSlot,
  Subject,
  PeriodSwap,
  Payslip,
} from '../../types';
import { db } from '../../lib/db';
import { useLanguage } from '../../lib/i18n';
import { InfoTooltip } from '../common/InfoTooltip';
import {
  Calendar,
  Clock,
  BookOpen,
  ArrowRight,
  Download,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Award,
  Sparkles,
  Wifi,
  WifiOff,
  PlusCircle,
  X,
  UserCheck,
} from 'lucide-react';

interface TeacherHomeProps {
  teacher: Teacher & { account: Account };
  school: School;
  level: Level;
  onNavigateTab: (tab: any) => void;
  onLogLesson: (slot?: TimetableSlot & { subject: Subject }) => void;
  isOffline: boolean;
  pendingSyncCount: number;
}

export const TeacherHome: React.FC<TeacherHomeProps> = ({
  teacher,
  school,
  level,
  onNavigateTab,
  onLogLesson,
  isOffline,
  pendingSyncCount,
}) => {
  const { t, lang } = useLanguage();
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [selectedSwapSlot, setSelectedSwapSlot] = useState<(TimetableSlot & { subject: Subject }) | null>(null);
  const [swapReason, setSwapReason] = useState('');
  const [swapReplacementId, setSwapReplacementId] = useState('');
  const [swapSubmitting, setSwapSubmitting] = useState(false);
  const [swapSuccessMsg, setSwapSuccessMsg] = useState<string | null>(null);

  // Slots for this teacher
  const teacherSlots = db.getTeacherSlots(teacher.id, school.id, level.id);
  const eligibleColleagues = db
    .getTeachersForPartition(school.id, level.id)
    .filter((colleague) => colleague.id !== teacher.id);

  // Latest payslip
  const payslips = db.getPayslipsForTeacher(teacher.id);
  const latestPayslip = payslips[0];

  // Monthly summary metrics
  const monthlySummary = db.getTeacherMonthlySummary(teacher.id, '2026-03');

  // Determine current day schedule
  // Today in simulation: let's map current day or Monday if weekend
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = daysOfWeek[new Date().getDay()] || 'Monday';
  const effectiveDay = todayName === 'Sunday' || todayName === 'Saturday' ? 'Monday' : todayName;

  const todaySlots = teacherSlots
    .filter((s) => s.day_of_week === effectiveDay)
    .sort((a, b) => a.period_number - b.period_number);

  // Identify current / next period (first slot of today, or slot matching period 1/2)
  const activeSlot = todaySlots[0] || teacherSlots[0];

  const handleRequestSwapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSwapSlot) return;

    setSwapSubmitting(true);
    try {
      db.requestPeriodSwap({
        school_id: school.id,
        level_id: level.id,
        timetable_slot_id: selectedSwapSlot.id,
        requested_by_teacher_id: teacher.id,
        suggested_replacement_id: swapReplacementId || null,
        reason: swapReason || 'Personal / Academic leave',
      });

      setSwapSuccessMsg(t('swap_request_sent'));
      setTimeout(() => {
        setSwapSuccessMsg(null);
        setSelectedSwapSlot(null);
        setSwapReason('');
        setSwapReplacementId('');
      }, 1500);
    } catch {
      // ignore
    } finally {
      setSwapSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-xl shadow-purple-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {school.name}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {level.name}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{t('welcome_back')}, {teacher.full_name.split(' ')[0]}</span>
            <span className="text-lg">👋</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            {effectiveDay} • {t('academic_year')} 2025–2026
          </p>
        </div>

        {/* Status Chips: Offline & Next Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              isOffline
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}
          >
            {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span className="flex items-center gap-1">
              {isOffline ? `${t('offline_indicator')} (${pendingSyncCount} ${t('offline_sync_chip')})` : t('online_synced')}
              <InfoTooltip text={t('info_offline_banner')} />
            </span>
          </div>

          <button
            type="button"
            id="home-quick-log-btn"
            onClick={() => onLogLesson(activeSlot)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-purple-900/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t('new_logbook_entry')}</span>
          </button>
        </div>
      </div>

      {/* Dismissible Install Banner */}
      {showInstallBanner && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-cyan-950/40 border border-purple-500/30 flex items-center justify-between gap-4 text-xs shadow-lg shadow-purple-950/30 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 text-cyan-300 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>{t('install_banner_title')}</span>
                <InfoTooltip text={t('info_offline_banner')} />
              </div>
              <p className="text-slate-300 text-[11px] mt-0.5">{t('install_banner_msg')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              id="install-app-action-btn"
              onClick={() => {
                alert(lang === 'fr' ? 'Application configurée pour l\'installation écran d\'accueil (PWA).' : 'App ready for Home Screen install.');
                setShowInstallBanner(false);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              {t('install_action')}
            </button>
            <button
              type="button"
              onClick={() => setShowInstallBanner(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Salary Status Banner */}
      {latestPayslip && latestPayslip.status === 'dispatched' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-purple-950/40 border border-emerald-500/40 flex items-center justify-between gap-4 text-xs shadow-md shadow-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>{t('salary_banner_title')}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {latestPayslip.total.toLocaleString()} FCFA
                </span>
              </div>
              <p className="text-slate-300 text-[11px] mt-0.5">
                {latestPayslip.month_label} • {t('salary_banner_msg')}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="salary-banner-view-btn"
            onClick={() => onNavigateTab('payslip')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <span>{t('view_payslip')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Today's Schedule & Active Period */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <h2 className="text-base font-bold text-white flex items-center gap-1.5">
              <span>{t('todays_schedule')}</span>
              <InfoTooltip text={t('info_timetable_teacher')} />
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('timetable')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            <span>{t('my_timetable')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todaySlots.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs">
            {t('no_slots_found')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todaySlots.map((slot, index) => {
              const isCurrent = slot.id === activeSlot?.id;
              return (
                <div
                  key={slot.id}
                  className={`p-5 rounded-2xl transition-all duration-200 flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 border-2 border-purple-500/80 shadow-lg shadow-purple-950/40 ring-2 ring-purple-500/20'
                      : 'bg-slate-900/80 border border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Top Row: Period badge & Time */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                            isCurrent
                              ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {t('period_label')} {slot.period_number}
                        </span>
                        {isCurrent && (
                          <span className="flex items-center gap-1 text-[10px] font-extrabold text-cyan-400 animate-pulse uppercase tracking-wider">
                            ● {t('current_period')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{slot.start_time} – {slot.end_time}</span>
                      </div>
                    </div>

                    {/* Class & Subject */}
                    <div className="mb-3">
                      <h3 className="text-base font-extrabold text-white">
                        {slot.subject.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="font-semibold text-purple-300">{slot.class_name}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">{slot.room || 'Main Block'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      id={`flag-unavailable-slot-${slot.id}`}
                      onClick={() => setSelectedSwapSlot(slot)}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20 transition-colors cursor-pointer"
                    >
                      {t('flag_unavailable')}
                    </button>

                    <button
                      type="button"
                      id={`log-lesson-slot-${slot.id}`}
                      onClick={() => onLogLesson(slot)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-md shadow-purple-900/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{t('log_this_lesson')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Monthly Summary Module */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-xl shadow-purple-950/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold text-white flex items-center gap-1.5">
              <span>{t('monthly_summary')}</span>
              <InfoTooltip text={t('info_locked_payroll')} />
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400 font-medium">March 2026</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">{t('periods_covered')}</span>
            <div className="text-2xl font-black text-white">
              {monthlySummary.coveredPeriods}
              <span className="text-xs text-slate-500 font-normal ml-1">/ {monthlySummary.expectedPeriods}</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium mt-1 block">
              ● Verified via E-Signature
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">{t('coverage_progress')}</span>
            <div className="text-2xl font-black text-cyan-400">
              {monthlySummary.percentage}%
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-cyan-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${monthlySummary.percentage}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Contract Weekly Load</span>
            <div className="text-2xl font-black text-purple-400">
              {monthlySummary.weeklyScheduledPeriods}
              <span className="text-xs text-slate-500 font-normal ml-1">periods/week</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-1 block">
              Permanent DIPES II
            </span>
          </div>
        </div>
      </div>

      {/* Flag Unavailable Modal */}
      {selectedSwapSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl shadow-purple-950/40 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">{t('flag_unavailable')}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSwapSlot(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {swapSuccessMsg ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-semibold text-white">{swapSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleRequestSwapSubmit} className="mt-4 space-y-4">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                  <div className="font-bold text-white">{selectedSwapSlot.subject.name}</div>
                  <div className="text-slate-400 mt-0.5">
                    {selectedSwapSlot.class_name} • {t('period_label')} {selectedSwapSlot.period_number} ({selectedSwapSlot.start_time}–{selectedSwapSlot.end_time})
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('reason_unavailability')}
                  </label>
                  <input
                    type="text"
                    required
                    value={swapReason}
                    onChange={(e) => setSwapReason(e.target.value)}
                    placeholder="E.g., Medical appointment or colloquium..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('suggest_replacement_optional')}
                  </label>
                  <select
                    value={swapReplacementId}
                    onChange={(e) => setSwapReplacementId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  >
                    <option value="">-- No suggestion (Admin will assign) --</option>
                    {eligibleColleagues.map((colleague) => (
                      <option key={colleague.id} value={colleague.id}>
                        {colleague.full_name} ({colleague.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSwapSlot(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-800"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={swapSubmitting}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-xs font-bold shadow-xs disabled:opacity-50"
                  >
                    {swapSubmitting ? t('loading') : t('submit_request')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

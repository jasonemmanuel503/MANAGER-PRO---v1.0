import React, { useState } from 'react';
import {
  Teacher,
  Account,
  School,
  Level,
  TimetableSlot,
  Subject,
} from '../../types';
import { db } from '../../lib/db';
import { useLanguage } from '../../lib/i18n';
import { InfoTooltip } from '../common/InfoTooltip';
import {
  Calendar,
  Clock,
  LayoutGrid,
  List,
  AlertTriangle,
  X,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

interface TeacherTimetableProps {
  teacher: Teacher & { account: Account };
  school: School;
  level: Level;
  onLogLesson: (slot: TimetableSlot & { subject: Subject }) => void;
}

const DAYS_OF_WEEK = [
  { key: 'Monday', labelKey: 'monday' },
  { key: 'Tuesday', labelKey: 'tuesday' },
  { key: 'Wednesday', labelKey: 'wednesday' },
  { key: 'Thursday', labelKey: 'thursday' },
  { key: 'Friday', labelKey: 'friday' },
] as const;

const PERIODS = [1, 2, 3, 4, 5, 6, 7];

export const TeacherTimetable: React.FC<TeacherTimetableProps> = ({
  teacher,
  school,
  level,
  onLogLesson,
}) => {
  const { t, lang } = useLanguage();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDay, setSelectedDay] = useState<string>('Monday');

  // Swap modal state
  const [selectedSwapSlot, setSelectedSwapSlot] = useState<(TimetableSlot & { subject: Subject }) | null>(null);
  const [swapReason, setSwapReason] = useState('');
  const [swapReplacementId, setSwapReplacementId] = useState('');
  const [swapSubmitting, setSwapSubmitting] = useState(false);
  const [swapSuccessMsg, setSwapSuccessMsg] = useState<string | null>(null);

  const teacherSlots = db.getTeacherSlots(teacher.id, school.id, level.id);
  const eligibleColleagues = db
    .getTeachersForPartition(school.id, level.id)
    .filter((colleague) => colleague.id !== teacher.id);

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
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-xl shadow-purple-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            <span>{t('my_timetable')}</span>
            <InfoTooltip text={t('info_timetable_teacher')} />
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {school.name} • {level.name} • {teacherSlots.length} {t('load_hours')}
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              id="timetable-grid-view-btn"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              id="timetable-list-view-btn"
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-xl shadow-purple-950/20 overflow-x-auto">
          <div className="min-w-[760px]">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-3 text-left text-xs font-bold text-slate-400 border-b border-slate-800 w-24">
                    {t('day')}
                  </th>
                  {PERIODS.map((periodNum) => (
                    <th
                      key={periodNum}
                      className="p-3 text-center text-xs font-bold text-slate-400 border-b border-slate-800"
                    >
                      <div>{t('period_label')} {periodNum}</div>
                      <span className="text-[10px] text-slate-500 font-mono font-normal">
                        {periodNum === 1 ? '08:00' : periodNum === 2 ? '08:50' : periodNum === 3 ? '09:40' : periodNum === 4 ? '10:50' : periodNum === 5 ? '11:40' : periodNum === 6 ? '12:30' : '13:20'}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS_OF_WEEK.map((day) => (
                  <tr key={day.key} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="p-3 text-xs font-bold text-slate-200">
                      {t(day.labelKey as any)}
                    </td>
                    {PERIODS.map((periodNum) => {
                      const slot = teacherSlots.find(
                        (s) => s.day_of_week === day.key && s.period_number === periodNum
                      );
                      return (
                        <td key={periodNum} className="p-2 align-top h-24 w-28">
                          {slot ? (
                            <div className="h-full p-2.5 rounded-xl bg-gradient-to-br from-purple-950/50 to-slate-900 border border-purple-500/30 flex flex-col justify-between group hover:border-purple-400 transition-all shadow-xs">
                              <div>
                                <span className="text-[11px] font-bold text-white block leading-tight truncate">
                                  {slot.subject.name}
                                </span>
                                <span className="text-[10px] text-cyan-400 font-semibold block mt-0.5 truncate">
                                  {slot.class_name}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono block">
                                  {slot.room || 'Room A'}
                                </span>
                              </div>

                              <div className="pt-1.5 flex items-center justify-between gap-1 opacity-90 group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => setSelectedSwapSlot(slot)}
                                  title={t('flag_unavailable')}
                                  className="text-[9px] text-amber-400 hover:text-amber-300 transition-colors font-medium cursor-pointer"
                                >
                                  Swap
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onLogLesson(slot)}
                                  title={t('log_this_lesson')}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-purple-600/80 hover:bg-purple-500 text-white font-bold transition-colors cursor-pointer"
                                >
                                  Log
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full rounded-xl border border-dashed border-slate-800/40 flex items-center justify-center text-[10px] text-slate-700">
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {/* Day Selector Pills */}
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.key}
                type="button"
                onClick={() => setSelectedDay(day.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedDay === day.key
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-md shadow-purple-900/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {t(day.labelKey as any)}
              </button>
            ))}
          </div>

          {/* Slots for selected day */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teacherSlots
              .filter((s) => s.day_of_week === selectedDay)
              .sort((a, b) => a.period_number - b.period_number)
              .map((slot) => (
                <div
                  key={slot.id}
                  className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-800 text-purple-300 border border-purple-500/20">
                        {t('period_label')} {slot.period_number}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{slot.start_time} – {slot.end_time}</span>
                      </div>
                    </div>
                    <h3 className="text-base font-extrabold text-white mt-1">
                      {slot.subject.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="font-semibold text-cyan-400">{slot.class_name}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{slot.room || 'Main Block'}</span>
                    </div>
                  </div>

                  <div className="pt-3 mt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSwapSlot(slot)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20 transition-colors cursor-pointer"
                    >
                      {t('flag_unavailable')}
                    </button>
                    <button
                      type="button"
                      onClick={() => onLogLesson(slot)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>{t('log_this_lesson')}</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

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
                    {selectedSwapSlot.class_name} • {selectedSwapSlot.day_of_week} {t('period_label')} {selectedSwapSlot.period_number}
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
                    placeholder="E.g., Medical leave, urgent personal event..."
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
                    <option value="">-- No suggestion (Administration assigns) --</option>
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

import React, { useState, useEffect, useMemo } from 'react';
import { TimetableSlot, Subject, Teacher, Account, UserRole } from '../../types';
import { db, PRESET_COLORS } from '../../lib/db';
import { useLanguage } from '../../lib/i18n';
import { InfoTooltip } from '../common/InfoTooltip';
import { SkeletonLoader } from '../common/SkeletonLoader';
import {
  CalendarDays,
  Plus,
  Filter,
  Palette,
  AlertTriangle,
  Radio,
  Clock,
  User,
  GraduationCap,
  Sparkles,
  Trash2,
  Edit3,
  X,
  Check,
  Zap,
} from 'lucide-react';

interface VisualTimetableBuilderProps {
  schoolId: string;
  levelId: string;
  currentRole: UserRole;
  currentAccountId: string;
}

type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Daily periods configuration
const PERIOD_TIMES = [
  { start: '08:00', duration: 50, label: 'P1' },
  { start: '08:50', duration: 50, label: 'P2' },
  { start: '10:00', duration: 50, label: 'P3' },
  { start: '10:50', duration: 50, label: 'P4' },
  { start: '11:40', duration: 50, label: 'P5' },
  { start: '13:20', duration: 50, label: 'P6' },
  { start: '14:10', duration: 50, label: 'P7' },
];

export const VisualTimetableBuilder: React.FC<VisualTimetableBuilderProps> = ({
  schoolId,
  levelId,
  currentRole,
}) => {
  const { t, lang } = useLanguage();

  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Array<Teacher & { account: Account }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & display mode
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('all');
  const [colorMode, setColorMode] = useState<'subject' | 'teacher'>('subject');

  // Drag and Drop state
  const [draggedSlotId, setDraggedSlotId] = useState<string | null>(null);

  // Modal / Drawer state for creating / editing a slot
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);

  // Form State
  const [formSubjectId, setFormSubjectId] = useState<string>('');
  const [formClassName, setFormClassName] = useState<string>('Form 5 Science');
  const [formDay, setFormDay] = useState<DayOfWeek>('Monday');
  const [formStartTime, setFormStartTime] = useState<string>('08:00');
  const [formDuration, setFormDuration] = useState<number>(50);
  const [formTeacherId, setFormTeacherId] = useState<string>('');
  const [formColor, setFormColor] = useState<string>(PRESET_COLORS[0]);
  const [formError, setFormError] = useState<string | null>(null);

  // Realtime notification feedback
  const [lastDispatchedSlot, setLastDispatchedSlot] = useState<{
    teacherName: string;
    className: string;
  } | null>(null);

  // Role authorization: VP builds the timetable (also Founder & Principal have master rights)
  const canBuildTimetable =
    currentRole === 'VP' ||
    currentRole === 'Principal' ||
    currentRole === 'Founder';

  const loadData = () => {
    setIsLoading(true);
    setTimeout(() => {
      const currentSlots = db.getTimetableSlotsForPartition(schoolId, levelId);
      const currentSubjects = db.getSubjectsForPartition(schoolId, levelId);
      const currentTeachers = db.getTeachersForPartition(schoolId, levelId);

      setSlots(currentSlots);
      setSubjects(currentSubjects);
      setTeachers(currentTeachers);
      setIsLoading(false);
    }, 200);
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribeToRealtime((event) => {
      if (event.table === 'timetable_slots') {
        setSlots(db.getTimetableSlotsForPartition(schoolId, levelId));
      }
    });
    return unsub;
  }, [schoolId, levelId]);

  // Distinct classes list for filter
  const distinctClasses = useMemo(() => {
    const list = new Set<string>();
    slots.forEach((s) => list.add(s.class_name));
    return Array.from(list).sort();
  }, [slots]);

  // Teacher color palette generator (hash-based persistent color per teacher)
  const teacherColorMap = useMemo(() => {
    const map = new Map<string, string>();
    teachers.forEach((t, i) => {
      map.set(t.id, PRESET_COLORS[i % PRESET_COLORS.length]);
    });
    return map;
  }, [teachers]);

  // Dynamic AI-Assisted Conflict Detection
  const currentConflicts = useMemo(() => {
    if (!formSubjectId || !formClassName || !formTeacherId) {
      return { hasConflict: false, conflicts: [] };
    }
    return db.detectTimetableConflicts(
      {
        school_id: schoolId,
        level_id: levelId,
        subject_id: formSubjectId,
        class_name: formClassName,
        day: formDay,
        start_time: formStartTime,
        duration: formDuration,
        teacher_id: formTeacherId,
      },
      editingSlot ? editingSlot.id : undefined
    );
  }, [
    schoolId,
    levelId,
    formSubjectId,
    formClassName,
    formDay,
    formStartTime,
    formDuration,
    formTeacherId,
    editingSlot,
  ]);

  // Dynamic AI-Assisted Teacher Suggestions
  const teacherSuggestions = useMemo(() => {
    if (!formSubjectId) return [];
    return db.getTeacherSuggestionsForSlot({
      schoolId,
      levelId,
      subjectId: formSubjectId,
      day: formDay,
      startTime: formStartTime,
      duration: formDuration,
      ignoreSlotId: editingSlot ? editingSlot.id : undefined,
    });
  }, [
    schoolId,
    levelId,
    formSubjectId,
    formDay,
    formStartTime,
    formDuration,
    editingSlot,
  ]);

  // Open slot creation for a specific day and time
  const handleOpenAddSlot = (day: DayOfWeek = 'Monday', startTime = '08:00') => {
    setEditingSlot(null);
    setFormSubjectId(subjects[0]?.id || '');
    setFormClassName(distinctClasses[0] || 'Form 5 Science');
    setFormDay(day);
    setFormStartTime(startTime);
    setFormDuration(50);
    setFormTeacherId(teachers[0]?.id || '');
    setFormColor(PRESET_COLORS[0]);
    setFormError(null);
    setIsSlotModalOpen(true);
  };

  const handleOpenEditSlot = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setFormSubjectId(slot.subject_id);
    setFormClassName(slot.class_name);
    setFormDay(slot.day as DayOfWeek);
    setFormStartTime(slot.start_time);
    setFormDuration(slot.duration);
    setFormTeacherId(slot.teacher_id);
    setFormColor(slot.color || PRESET_COLORS[0]);
    setFormError(null);
    setIsSlotModalOpen(true);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (currentConflicts.hasConflict) {
      setFormError(
        lang === 'fr'
          ? currentConflicts.conflicts[0].messageFr
          : currentConflicts.conflicts[0].messageEn
      );
      return;
    }

    try {
      let saved: TimetableSlot;
      if (editingSlot) {
        saved = db.updateTimetableSlot(editingSlot.id, {
          subject_id: formSubjectId,
          class_name: formClassName,
          day: formDay,
          start_time: formStartTime,
          duration: formDuration,
          teacher_id: formTeacherId,
          color: formColor,
        });
      } else {
        saved = db.createTimetableSlot({
          school_id: schoolId,
          level_id: levelId,
          subject_id: formSubjectId,
          class_name: formClassName,
          day: formDay,
          start_time: formStartTime,
          duration: formDuration,
          teacher_id: formTeacherId,
          color: formColor,
        });
      }

      const assignedTeacher = teachers.find((t) => t.id === saved.teacher_id);
      setLastDispatchedSlot({
        teacherName: assignedTeacher?.account.full_name || 'Teacher',
        className: saved.class_name,
      });
      setTimeout(() => setLastDispatchedSlot(null), 5000);

      setIsSlotModalOpen(false);
      loadData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save slot');
    }
  };

  const handleDeleteSlot = (id: string) => {
    if (!window.confirm('Delete this timetable period?')) return;
    try {
      db.deleteTimetableSlot(id);
      setIsSlotModalOpen(false);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  // Drag and Drop handlers for the visual grid
  const handleDragStart = (e: React.DragEvent, slotId: string) => {
    e.dataTransfer.setData('text/plain', slotId);
    setDraggedSlotId(slotId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnCell = (day: DayOfWeek, startTime: string) => {
    if (!draggedSlotId || !canBuildTimetable) return;

    const targetSlot = slots.find((s) => s.id === draggedSlotId);
    if (!targetSlot) return;

    // Check conflicts before moving
    const conflictCheck = db.detectTimetableConflicts(
      {
        school_id: targetSlot.school_id,
        level_id: targetSlot.level_id,
        subject_id: targetSlot.subject_id,
        class_name: targetSlot.class_name,
        day,
        start_time: startTime,
        duration: targetSlot.duration,
        teacher_id: targetSlot.teacher_id,
      },
      targetSlot.id
    );

    if (conflictCheck.hasConflict) {
      alert(
        lang === 'fr'
          ? `Impossible de déplacer le cours : ${conflictCheck.conflicts[0].messageFr}`
          : `Cannot move slot: ${conflictCheck.conflicts[0].messageEn}`
      );
      setDraggedSlotId(null);
      return;
    }

    try {
      db.updateTimetableSlot(targetSlot.id, {
        day,
        start_time: startTime,
      });

      const teacher = teachers.find((t) => t.id === targetSlot.teacher_id);
      setLastDispatchedSlot({
        teacherName: teacher?.account.full_name || 'Teacher',
        className: targetSlot.class_name,
      });
      setTimeout(() => setLastDispatchedSlot(null), 5000);

      loadData();
    } catch (err: unknown) {
      console.error(err);
    }
    setDraggedSlotId(null);
  };

  // Filtered slots for display
  const filteredSlots = slots.filter((slot) => {
    if (selectedClassFilter !== 'all' && slot.class_name !== selectedClassFilter) {
      return false;
    }
    if (
      selectedTeacherFilter !== 'all' &&
      slot.teacher_id !== selectedTeacherFilter
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl shadow-black/20">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-purple-950/40">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="flex items-center">
              <h1 className="text-xl font-black text-white tracking-tight">
                {t('timetable_title')}
              </h1>
              <InfoTooltip content={t('info_timetable_builder')} />
            </div>
          </div>
        </div>

        {/* Toolbar controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Color Mode Switcher */}
          <div className="p-1 rounded-xl bg-slate-950/80 border border-white/10 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setColorMode('subject')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                colorMode === 'subject'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5 inline mr-1" />
              <span>{t('color_by_subject')}</span>
            </button>
            <button
              type="button"
              onClick={() => setColorMode('teacher')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                colorMode === 'teacher'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5 inline mr-1" />
              <span>{t('color_by_teacher')}</span>
            </button>
            <InfoTooltip content={t('info_color_mode')} />
          </div>

          {/* Class Filter */}
          <div className="relative">
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs font-semibold focus:outline-hidden focus:border-cyan-400 cursor-pointer"
            >
              <option value="all">{t('all_classes')}</option>
              {distinctClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Teacher Filter */}
          <div className="relative">
            <select
              value={selectedTeacherFilter}
              onChange={(e) => setSelectedTeacherFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs font-semibold focus:outline-hidden focus:border-cyan-400 cursor-pointer"
            >
              <option value="all">{t('all_teachers')}</option>
              {teachers.map((tch) => (
                <option key={tch.id} value={tch.id}>
                  {tch.account.full_name} ({tch.teacher_code})
                </option>
              ))}
            </select>
          </div>

          {canBuildTimetable && (
            <button
              type="button"
              onClick={() => handleOpenAddSlot()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('new_slot')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Realtime Dispatch Alert Banner */}
      {lastDispatchedSlot && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/70 to-cyan-950/70 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center justify-between backdrop-blur-md animate-in fade-in-50">
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
            <span>
              {t('realtime_dispatched')}:{' '}
              <strong className="text-white">
                {lastDispatchedSlot.teacherName}
              </strong>{' '}
              ({lastDispatchedSlot.className})
            </span>
          </div>
          <InfoTooltip content={t('info_realtime_dispatch')} />
        </div>
      )}

      {/* Main Visual Grid Table */}
      {isLoading ? (
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/10">
          <SkeletonLoader lines={8} />
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900/40 border border-purple-500/20 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/40">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[960px]">
              {/* Table Header: Days of the week */}
              <thead>
                <tr className="border-b border-purple-500/20 bg-slate-950/60">
                  <th className="p-4 text-xs font-extrabold uppercase tracking-wider text-slate-400 w-28 border-r border-white/5">
                    {t('time')}
                  </th>
                  {DAYS.map((day) => (
                    <th
                      key={day}
                      className="p-4 text-xs font-extrabold uppercase tracking-wider text-slate-200 border-r border-white/5 last:border-r-0 text-center"
                    >
                      {t(day.toLowerCase() as keyof typeof t)}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body: Day x Time Grid */}
              <tbody className="divide-y divide-white/5">
                {PERIOD_TIMES.map((period) => (
                  <tr
                    key={period.start}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Time Label Column */}
                    <td className="p-3 border-r border-white/5 bg-slate-950/40 align-top">
                      <div className="font-mono text-xs font-black text-cyan-400">
                        {period.start}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {period.label} • {period.duration} {t('minutes')}
                      </div>
                    </td>

                    {/* Day Columns */}
                    {DAYS.map((day) => {
                      // Find slots on this day matching this start time
                      const cellSlots = filteredSlots.filter(
                        (s) => s.day === day && s.start_time === period.start
                      );

                      return (
                        <td
                          key={day}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDropOnCell(day, period.start)}
                          onClick={() => {
                            if (cellSlots.length === 0 && canBuildTimetable) {
                              handleOpenAddSlot(day, period.start);
                            }
                          }}
                          className={`p-2 border-r border-white/5 last:border-r-0 align-top transition-all min-h-[90px] ${
                            cellSlots.length === 0 && canBuildTimetable
                              ? 'cursor-pointer hover:bg-purple-900/10'
                              : ''
                          }`}
                        >
                          {cellSlots.length === 0 ? (
                            <div className="h-16 rounded-xl border border-dashed border-white/5 flex items-center justify-center text-slate-600 text-[10px] hover:border-purple-500/30 hover:text-slate-400 transition-colors">
                              {canBuildTimetable ? '+' : ''}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {cellSlots.map((slot) => {
                                const subject = subjects.find(
                                  (s) => s.id === slot.subject_id
                                );
                                const teacher = teachers.find(
                                  (t) => t.id === slot.teacher_id
                                );

                                const blockColor =
                                  colorMode === 'teacher'
                                    ? teacherColorMap.get(slot.teacher_id) ||
                                      slot.color
                                    : slot.color || '#7c3aed';

                                return (
                                  <div
                                    key={slot.id}
                                    draggable={canBuildTimetable}
                                    onDragStart={(e) =>
                                      handleDragStart(e, slot.id)
                                    }
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (canBuildTimetable) {
                                        handleOpenEditSlot(slot);
                                      }
                                    }}
                                    style={{
                                      borderLeftColor: blockColor,
                                      borderLeftWidth: '4px',
                                    }}
                                    className={`p-2.5 rounded-xl bg-slate-950/90 border border-white/10 hover:border-cyan-400/50 transition-all shadow-md shadow-black/30 group ${
                                      canBuildTimetable
                                        ? 'cursor-grab active:cursor-grabbing hover:scale-[1.02]'
                                        : ''
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-1">
                                      <span className="text-xs font-black text-white truncate block">
                                        {subject?.name || 'Subject'}
                                      </span>
                                      <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5"
                                        style={{ backgroundColor: blockColor }}
                                      />
                                    </div>

                                    <div className="text-[11px] font-bold text-cyan-400 truncate mt-1">
                                      {slot.class_name}
                                    </div>

                                    <div className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                                      <User className="w-2.5 h-2.5 shrink-0" />
                                      <span className="truncate">
                                        {teacher?.account.full_name || 'Teacher'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
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
      )}

      {/* Visual Timetable Slot Creator / Editor Modal */}
      {isSlotModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in-50 duration-150 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-purple-500/30 p-6 shadow-2xl shadow-purple-950/50 space-y-5 animate-in zoom-in-95 duration-150 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-white">
                  {editingSlot ? t('edit_slot') : t('new_slot')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSlotModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error banner */}
            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            {/* AI Conflict Detection Alert */}
            {currentConflicts.hasConflict && (
              <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs space-y-1.5 animate-in fade-in-50">
                <div className="flex items-center gap-2 font-bold text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{t('conflicts_detected')}</span>
                  <InfoTooltip content={t('info_conflict_detection')} />
                </div>
                {currentConflicts.conflicts.map((c, i) => (
                  <div key={i} className="pl-6 text-[11px] font-mono text-rose-300">
                    • {lang === 'fr' ? c.messageFr : c.messageEn}
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSaveSlot} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Subject Picker */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    {t('subject')}
                  </label>
                  <select
                    required
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-semibold focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Class Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    {t('class_label')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formClassName}
                    onChange={(e) => setFormClassName(e.target.value)}
                    placeholder="e.g. Form 5 Science, Grade 4, Terminale C"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white placeholder-slate-500 text-xs font-semibold focus:outline-hidden focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Day, Time & Duration */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    {t('day')}
                  </label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value as DayOfWeek)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-semibold focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {t(d.toLowerCase() as keyof typeof t)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    {t('time')}
                  </label>
                  <select
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-semibold focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                  >
                    {PERIOD_TIMES.map((p) => (
                      <option key={p.start} value={p.start}>
                        {p.start} ({p.label})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    {t('duration')} ({t('minutes')})
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={180}
                    step={5}
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-semibold focus:outline-hidden focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Specific Teacher Assigned (Explicit, never inferred) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t('teacher')}
                  </label>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    Explicit selection required
                  </span>
                </div>
                <select
                  required
                  value={formTeacherId}
                  onChange={(e) => setFormTeacherId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-semibold focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                >
                  <option value="" disabled>
                    -- Select Teacher --
                  </option>
                  {teachers.map((tch) => (
                    <option key={tch.id} value={tch.id}>
                      {tch.account.full_name} ({tch.teacher_code}) — {tch.department || 'General'}
                    </option>
                  ))}
                </select>
              </div>

              {/* AI-Assisted Teacher Suggestion Layer */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-purple-500/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-cyan-400">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t('suggested_teachers')}</span>
                    <InfoTooltip content={t('info_teacher_suggestions')} />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Based on profile + weekly load
                  </span>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {teacherSuggestions.slice(0, 3).map((sugg) => {
                    const isSelected = formTeacherId === sugg.teacher.id;

                    return (
                      <div
                        key={sugg.teacher.id}
                        onClick={() => {
                          if (!sugg.hasTimeConflict) {
                            setFormTeacherId(sugg.teacher.id);
                          }
                        }}
                        className={`p-2 rounded-lg border transition-all flex items-center justify-between gap-2 text-xs ${
                          isSelected
                            ? 'bg-purple-900/30 border-cyan-400 text-white'
                            : sugg.hasTimeConflict
                            ? 'bg-slate-900/40 border-rose-900/30 text-slate-500 opacity-60 cursor-not-allowed'
                            : 'bg-slate-900/60 border-white/5 text-slate-300 hover:border-purple-500/40 cursor-pointer'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold truncate flex items-center gap-1.5">
                            <span>{sugg.teacher.account.full_name}</span>
                            <span className="text-[10px] font-mono text-cyan-400">
                              [{sugg.weeklyLoad} {t('load_hours')}]
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {lang === 'fr' ? sugg.matchReasonFr : sugg.matchReasonEn}
                          </div>
                        </div>

                        {isSelected ? (
                          <span className="px-2 py-0.5 rounded-md bg-cyan-400 text-slate-950 font-black text-[10px] shrink-0">
                            Selected
                          </span>
                        ) : sugg.hasTimeConflict ? (
                          <span className="text-[10px] text-rose-400 shrink-0">
                            Conflict
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 text-[10px] font-bold shrink-0 cursor-pointer"
                          >
                            Assign
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Color Customization */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  {t('color')}
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-lg transition-transform cursor-pointer flex items-center justify-center ${
                        formColor === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      {formColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                {editingSlot ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteSlot(editingSlot.id)}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 border border-rose-900/40 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('delete')}</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSlotModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs font-bold cursor-pointer transition-all shadow-md shadow-purple-900/30"
                  >
                    {t('save')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

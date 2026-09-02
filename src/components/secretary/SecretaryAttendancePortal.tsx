import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  UserCheck,
  Search,
  Filter,
  Building2,
  LogOut,
  Globe,
  Sun,
  Moon,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Users,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { AuthSession, TimetableSlot, AttendanceRecord, Teacher, Subject } from '../../types';
import { db } from '../../lib/db';
import { useLanguage } from '../../lib/i18n';
import { InfoTooltip } from '../common/InfoTooltip';
import { LevelSwitcher } from '../auth/LevelSwitcher';

interface SecretaryAttendancePortalProps {
  session: AuthSession;
  onUpdateSession: (newSession: AuthSession) => void;
  onLogout: () => void;
  onSwitchRoleView?: (role: string) => void;
}

export const SecretaryAttendancePortal: React.FC<SecretaryAttendancePortalProps> = ({
  session,
  onUpdateSession,
  onLogout,
  onSwitchRoleView,
}) => {
  const { lang, setLanguage, t } = useLanguage();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Date state: Defaults to today (or 2026-09-02 for active term testing)
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-02');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unmarked' | 'on_time' | 'late' | 'cancelled_unpaid'>('all');
  const [activePeriodFilter, setActivePeriodFilter] = useState<'all' | 'morning' | 'afternoon'>('all');

  // Attendance marking modal state
  const [activeSlotToMark, setActiveSlotToMark] = useState<TimetableSlot | null>(null);
  const [markingArrivalTime, setMarkingArrivalTime] = useState<string>('08:00');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Data state
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // Calculate day of the week from selectedDate
  const dayOfWeek = useMemo(() => {
    try {
      const [year, month, day] = selectedDate.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[d.getDay()] || 'Wednesday';
    } catch {
      return 'Wednesday';
    }
  }, [selectedDate]);

  // Load partition data
  const loadData = useCallback(() => {
    const schoolId = session.currentSchool.id;
    const levelId = session.currentLevel.id;

    const tList = db.getTeachersForSchoolLevel(schoolId, levelId);
    const sList = db.getSubjectsForSchoolLevel(schoolId, levelId);
    const slotList = db.getTimetableSlotsForDay(schoolId, levelId, dayOfWeek);
    const attList = db.getAttendanceRecords({ schoolId, levelId, date: selectedDate });

    setTeachers(tList);
    setSubjects(sList);
    setSlots(slotList);
    setAttendanceRecords(attList);
  }, [session.currentSchool.id, session.currentLevel.id, dayOfWeek, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime subscription
  useEffect(() => {
    const unsub = db.subscribeToRealtime((event) => {
      if (event.table === 'attendance_records' || event.table === 'timetable_slots') {
        loadData();
      }
    });
    return () => {
      unsub();
    };
  }, [loadData]);

  // Teacher lookup map
  const teacherMap = useMemo(() => {
    const map = new Map<string, Teacher>();
    teachers.forEach((t) => map.set(t.id, t));
    return map;
  }, [teachers]);

  // Subject lookup map
  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  // Attendance lookup by slot id
  const attendanceBySlotId = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendanceRecords.forEach((att) => {
      map.set(att.timetable_slot_id, att);
    });
    return map;
  }, [attendanceRecords]);

  // Filtered slots list
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      const teacher = teacherMap.get(slot.teacher_id);
      const subject = subjectMap.get(slot.subject_id);
      const att = attendanceBySlotId.get(slot.id);

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const teacherName = teacher?.full_name?.toLowerCase() || '';
        const subjectName = subject?.name?.toLowerCase() || '';
        const className = slot.class_name.toLowerCase();
        if (!teacherName.includes(q) && !subjectName.includes(q) && !className.includes(q)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'unmarked') {
          if (att) return false;
        } else {
          if (!att || att.status !== statusFilter) return false;
        }
      }

      // Period of day filter
      if (activePeriodFilter !== 'all') {
        const startHour = parseInt(slot.start_time.split(':')[0], 10);
        if (activePeriodFilter === 'morning' && startHour >= 12) return false;
        if (activePeriodFilter === 'afternoon' && startHour < 12) return false;
      }

      return true;
    });
  }, [slots, teacherMap, subjectMap, attendanceBySlotId, searchQuery, statusFilter, activePeriodFilter]);

  // Daily statistics
  const stats = useMemo(() => {
    const totalSlots = slots.length;
    let onTimeCount = 0;
    let lateCount = 0;
    let cancelledCount = 0;

    slots.forEach((s) => {
      const att = attendanceBySlotId.get(s.id);
      if (att) {
        if (att.status === 'on_time') onTimeCount++;
        else if (att.status === 'late') lateCount++;
        else if (att.status === 'cancelled_unpaid') cancelledCount++;
      }
    });

    const markedCount = onTimeCount + lateCount + cancelledCount;
    const unmarkedCount = Math.max(0, totalSlots - markedCount);

    return {
      totalSlots,
      onTimeCount,
      lateCount,
      cancelledCount,
      markedCount,
      unmarkedCount,
    };
  }, [slots, attendanceBySlotId]);

  // Helper to open marking modal for a slot
  const handleOpenMarkModal = (slot: TimetableSlot) => {
    setActiveSlotToMark(slot);
    const existing = attendanceBySlotId.get(slot.id);
    if (existing && existing.marked_present_at) {
      // Extract HH:MM
      if (existing.marked_present_at.includes('T')) {
        const timePart = existing.marked_present_at.split('T')[1]?.slice(0, 5) || slot.start_time;
        setMarkingArrivalTime(timePart);
      } else {
        setMarkingArrivalTime(existing.marked_present_at.slice(0, 5));
      }
    } else {
      // Default to scheduled start time
      setMarkingArrivalTime(slot.start_time);
    }
  };

  // Calculate live preview of lateness in modal
  const livePreview = useMemo(() => {
    if (!activeSlotToMark) return null;
    const [schedH, schedM] = activeSlotToMark.start_time.split(':').map(Number);
    const [arrH, arrM] = markingArrivalTime.split(':').map(Number);
    const schedMinutes = (schedH || 0) * 60 + (schedM || 0);
    const arrMinutes = (arrH || 0) * 60 + (arrM || 0);
    const lateMinutes = Math.max(0, arrMinutes - schedMinutes);

    let status: 'on_time' | 'late' | 'cancelled_unpaid' = 'on_time';
    if (lateMinutes > 15) {
      status = 'cancelled_unpaid';
    } else if (lateMinutes > 0) {
      status = 'late';
    } else {
      status = 'on_time';
    }

    return {
      schedMinutes,
      arrMinutes,
      lateMinutes,
      status,
    };
  }, [activeSlotToMark, markingArrivalTime]);

  // Execute marking
  const handleConfirmMarkAttendance = () => {
    if (!activeSlotToMark) return;

    // ISO timestamp for date + arrival time
    const arrivalIso = `${selectedDate}T${markingArrivalTime}:00Z`;

    db.markTeacherAttendance({
      timetable_slot_id: activeSlotToMark.id,
      teacher_id: activeSlotToMark.teacher_id,
      date: selectedDate,
      marked_present_at: arrivalIso,
      secretary_id: session.account.id,
    });

    setActionSuccessMsg(t('attendance_saved_success'));
    setTimeout(() => setActionSuccessMsg(null), 3500);
    setActiveSlotToMark(null);
    loadData();
  };

  // Reset attendance for a slot
  const handleResetAttendance = (slotId: string) => {
    const rec = attendanceBySlotId.get(slotId);
    if (rec) {
      db.resetTeacherAttendance(rec.id);
      loadData();
    }
  };

  return (
    <div
      id="secretary-attendance-portal"
      className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-purple-500/30 font-sans"
    >
      {/* Top Header */}
      <header
        id="secretary-header"
        className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-purple-500/20 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-2xl shadow-black/40"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-purple-900/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Clock className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  {session.currentSchool.name}
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {t('secretary_station')}
                </span>
                <InfoTooltip content={t('info_secretary_role_scope')} />
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {t('welcome_back')}, <span className="text-slate-200 font-semibold">{session.account.full_name}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Multi-Level Switcher */}
          <LevelSwitcher session={session} onUpdateSession={onUpdateSession} />

          {/* Quick Role Switcher for Test / Evaluator */}
          {onSwitchRoleView && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-900/90 border border-purple-500/20 p-1 rounded-xl text-xs">
              <button
                type="button"
                id="quick-switch-dm-btn"
                onClick={() => onSwitchRoleView('DM')}
                className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-purple-500/20 transition-all font-medium flex items-center gap-1"
                title="Preview Discipline Master View"
              >
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>DM View</span>
              </button>
              <button
                type="button"
                id="quick-switch-teacher-btn"
                onClick={() => onSwitchRoleView('Teacher')}
                className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-cyan-500/20 transition-all font-medium flex items-center gap-1"
                title="Preview Teacher Portal"
              >
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Teacher</span>
              </button>
            </div>
          )}

          {/* Language Toggle */}
          <button
            type="button"
            id="secretary-lang-btn"
            onClick={() => setLanguage(lang === 'en' ? 'fr' : 'en')}
            className="h-9 px-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-purple-400" />
            <span className="uppercase">{lang}</span>
          </button>

          {/* Logout */}
          <button
            type="button"
            id="secretary-logout-btn"
            onClick={onLogout}
            className="h-9 px-3 rounded-xl bg-slate-900 border border-rose-500/20 text-rose-300 hover:bg-rose-500/10 hover:border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t('sign_out')}</span>
          </button>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main id="secretary-main-container" className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Success Toast */}
        {actionSuccessMsg && (
          <div
            id="secretary-success-toast"
            className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2.5 animate-in fade-in-50 duration-200"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Top Control Strip: Date Picker + Quick Day Switcher */}
        <section
          id="secretary-date-strip"
          className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-purple-500/20 p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{t('attendance_marking')}</span>
                <InfoTooltip content={t('info_secretary_attendance')} />
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">
                {dayOfWeek} • {selectedDate}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick date presets */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/60 p-1 rounded-xl text-xs">
              <button
                type="button"
                id="date-today-btn"
                onClick={() => setSelectedDate('2026-09-02')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedDate === '2026-09-02'
                    ? 'bg-linear-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Today (Wed 2 Sep)
              </button>
              <button
                type="button"
                id="date-yesterday-btn"
                onClick={() => setSelectedDate('2026-09-01')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedDate === '2026-09-01'
                    ? 'bg-linear-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tue 1 Sep
              </button>
              <button
                type="button"
                id="date-prev-btn"
                onClick={() => setSelectedDate('2026-08-31')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedDate === '2026-08-31'
                    ? 'bg-linear-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mon 31 Aug
              </button>
            </div>

            {/* Native Date Input */}
            <div className="relative">
              <input
                type="date"
                id="secretary-date-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-900 border border-purple-500/30 text-white text-xs rounded-xl px-3 py-2 font-medium focus:outline-hidden focus:border-purple-400 cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* Daily Summary Statistics */}
        <section id="secretary-stats-grid" className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-lg flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <span>{t('all_periods')}</span>
              </div>
              <div className="text-2xl font-bold text-white mt-1">{stats.totalSlots}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-emerald-500/20 p-4 shadow-lg flex items-center justify-between">
            <div>
              <div className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <span>{t('on_time')}</span>
              </div>
              <div className="text-2xl font-bold text-emerald-300 mt-1">{stats.onTimeCount}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-amber-500/20 p-4 shadow-lg flex items-center justify-between">
            <div>
              <div className="text-xs text-amber-400 font-medium flex items-center gap-1">
                <span>{t('late')} (&le;15m)</span>
              </div>
              <div className="text-2xl font-bold text-amber-300 mt-1">{stats.lateCount}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-rose-500/20 p-4 shadow-lg flex items-center justify-between">
            <div>
              <div className="text-xs text-rose-400 font-medium flex items-center gap-1">
                <span>{t('cancelled_unpaid')}</span>
                <InfoTooltip content={t('info_lateness_rule')} />
              </div>
              <div className="text-2xl font-bold text-rose-400 mt-1">{stats.cancelledCount}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <section
          id="secretary-filter-bar"
          className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-purple-500/20 p-3.5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3"
        >
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              id="secretary-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_teacher_or_class')}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-purple-500/50"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <button
              type="button"
              id="filter-all-btn"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {t('all_periods')}
            </button>
            <button
              type="button"
              id="filter-unmarked-btn"
              onClick={() => setStatusFilter('unmarked')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'unmarked'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {t('unmarked')} ({stats.unmarkedCount})
            </button>
            <button
              type="button"
              id="filter-ontime-btn"
              onClick={() => setStatusFilter('on_time')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'on_time'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-900 text-emerald-400 hover:text-white border border-slate-800'
              }`}
            >
              {t('on_time')} ({stats.onTimeCount})
            </button>
            <button
              type="button"
              id="filter-late-btn"
              onClick={() => setStatusFilter('late')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'late'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-900 text-amber-400 hover:text-white border border-slate-800'
              }`}
            >
              {t('late')} ({stats.lateCount})
            </button>
            <button
              type="button"
              id="filter-cancelled-btn"
              onClick={() => setStatusFilter('cancelled_unpaid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'cancelled_unpaid'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-900 text-rose-400 hover:text-white border border-slate-800'
              }`}
            >
              {t('cancelled_unpaid')} ({stats.cancelledCount})
            </button>
          </div>
        </section>

        {/* Timetable Period Schedule Cards */}
        <section id="secretary-slots-list" className="space-y-3">
          {filteredSlots.length === 0 ? (
            <div
              id="no-slots-box"
              className="bg-slate-950/40 rounded-2xl border border-slate-800/80 p-12 text-center text-slate-500 text-xs"
            >
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p>{t('no_slots_found')}</p>
            </div>
          ) : (
            filteredSlots.map((slot) => {
              const teacher = teacherMap.get(slot.teacher_id);
              const subject = subjectMap.get(slot.subject_id);
              const attendance = attendanceBySlotId.get(slot.id);

              return (
                <div
                  key={slot.id}
                  id={`slot-card-${slot.id}`}
                  className="bg-slate-950/70 backdrop-blur-md rounded-2xl border border-purple-500/15 p-4 md:p-5 shadow-xl hover:border-purple-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Time & Period identification */}
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700/80 flex flex-col items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-white leading-tight">{slot.start_time}</span>
                      <span className="text-[10px] text-slate-400 font-medium mt-0.5">{slot.duration}m</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {subject?.name || 'Curriculum Subject'}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          {slot.class_name}
                        </span>
                      </div>

                      {/* Teacher Info */}
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <div className="w-5 h-5 rounded-full bg-slate-800 border border-purple-500/30 flex items-center justify-center text-[10px] font-bold text-purple-300">
                          {teacher?.full_name?.charAt(0) || 'T'}
                        </div>
                        <span className="font-medium text-slate-200">{teacher?.full_name || 'Assigned Teacher'}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({teacher?.teacher_code || 'SBC'})</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Attendance Status Badge */}
                  <div className="flex items-center gap-3">
                    {attendance ? (
                      <div className="flex items-center gap-2.5">
                        {attendance.status === 'on_time' && (
                          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{t('on_time')} (0m)</span>
                          </div>
                        )}
                        {attendance.status === 'late' && (
                          <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            <span>{t('late')} (+{attendance.late_minutes}m)</span>
                          </div>
                        )}
                        {attendance.status === 'cancelled_unpaid' && (
                          <div className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>{t('cancelled_unpaid')} (+{attendance.late_minutes}m)</span>
                            <InfoTooltip content={t('info_lateness_rule')} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-medium">
                        {t('unmarked')}
                      </span>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    {attendance ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          id={`edit-att-btn-${slot.id}`}
                          onClick={() => handleOpenMarkModal(slot)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-purple-500/40 text-xs font-semibold transition-colors"
                        >
                          {t('edit')}
                        </button>
                        <button
                          type="button"
                          id={`reset-att-btn-${slot.id}`}
                          onClick={() => handleResetAttendance(slot.id)}
                          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 text-xs transition-colors"
                          title={t('reset_attendance')}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        id={`mark-present-btn-${slot.id}`}
                        onClick={() => handleOpenMarkModal(slot)}
                        className="px-4 py-2 rounded-xl bg-linear-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-purple-900/30 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{t('mark_present')}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>

      {/* Attendance Marking Modal */}
      {activeSlotToMark && (
        <div
          id="mark-attendance-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in-50 duration-150"
        >
          <div
            id="mark-attendance-modal"
            className="w-full max-w-md bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl p-6 space-y-5"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{t('mark_teacher_present')}</span>
                  <InfoTooltip content={t('info_secretary_attendance')} />
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {teacherMap.get(activeSlotToMark.teacher_id)?.full_name} • {activeSlotToMark.class_name}
                </p>
              </div>
              <button
                type="button"
                id="close-mark-modal-btn"
                onClick={() => setActiveSlotToMark(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                &times;
              </button>
            </div>

            {/* Scheduled Time (Read-only, pulled automatically from timetable) */}
            <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">{t('scheduled_start')}</span>
                <span className="font-mono font-bold text-cyan-400 text-sm">
                  {activeSlotToMark.start_time}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">{t('subject')}</span>
                <span className="font-semibold text-white">
                  {subjectMap.get(activeSlotToMark.subject_id)?.name}
                </span>
              </div>
            </div>

            {/* Captured Arrival Time Input */}
            <div className="space-y-1.5">
              <label htmlFor="arrival-time-input" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <span>{t('arrival_time')}</span>
                <InfoTooltip content="Captured gate arrival time. Compare against scheduled start to measure punctuality." />
              </label>
              <input
                type="time"
                id="arrival-time-input"
                value={markingArrivalTime}
                onChange={(e) => setMarkingArrivalTime(e.target.value)}
                className="w-full bg-slate-950 border border-purple-500/40 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm focus:outline-hidden focus:border-purple-400"
              />
            </div>

            {/* Quick Presets for testing lateness & auto-cancelled (>15m) rule */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-400">Quick arrival simulation:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="preset-ontime-btn"
                  onClick={() => setMarkingArrivalTime(activeSlotToMark.start_time)}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold hover:bg-emerald-500/25 transition-colors"
                >
                  On Time
                </button>
                <button
                  type="button"
                  id="preset-late-btn"
                  onClick={() => {
                    const [h, m] = activeSlotToMark.start_time.split(':').map(Number);
                    const newM = (m + 8).toString().padStart(2, '0');
                    setMarkingArrivalTime(`${h.toString().padStart(2, '0')}:${newM}`);
                  }}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold hover:bg-amber-500/25 transition-colors"
                >
                  +8m Late
                </button>
                <button
                  type="button"
                  id="preset-cancelled-btn"
                  onClick={() => {
                    const [h, m] = activeSlotToMark.start_time.split(':').map(Number);
                    const newM = (m + 22).toString().padStart(2, '0');
                    setMarkingArrivalTime(`${h.toString().padStart(2, '0')}:${newM}`);
                  }}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold hover:bg-rose-500/30 transition-colors"
                >
                  +22m (&gt;15m)
                </button>
              </div>
            </div>

            {/* Live Calculation Output Card */}
            {livePreview && (
              <div
                id="live-lateness-preview"
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  livePreview.status === 'cancelled_unpaid'
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                    : livePreview.status === 'late'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                    : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>{t('status')}:</span>
                  <span className="uppercase tracking-wider">
                    {livePreview.status === 'cancelled_unpaid'
                      ? t('cancelled_unpaid')
                      : livePreview.status === 'late'
                      ? t('late')
                      : t('on_time')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>{t('lateness_minutes')}:</span>
                  <span className="font-mono font-bold">+{livePreview.lateMinutes} mins</span>
                </div>
                {livePreview.status === 'cancelled_unpaid' && (
                  <div className="text-[11px] font-semibold text-rose-300 pt-1 border-t border-rose-500/20 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('auto_flagged_cancelled')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                id="cancel-mark-btn"
                onClick={() => setActiveSlotToMark(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                id="confirm-mark-btn"
                onClick={handleConfirmMarkAttendance}
                className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white text-xs font-bold shadow-lg shadow-purple-900/30 hover:opacity-90"
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

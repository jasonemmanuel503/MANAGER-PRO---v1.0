import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Shield,
  Target,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  ArrowUpRight,
  Send,
  UserCheck,
  Search,
  Filter,
  Check,
  X,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Award,
  Sparkles,
  DollarSign,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  AuthSession,
  Teacher,
  Subject,
  ExpectedTarget,
  Dispute,
  PeriodSwap,
  AttendanceRecord,
  PayrollPeriod,
} from '../../types';
import { db } from '../../lib/db';
import { useLanguage } from '../../lib/i18n';
import { InfoTooltip } from '../common/InfoTooltip';

interface DisciplineMasterDashboardProps {
  session: AuthSession;
}

export const DisciplineMasterDashboard: React.FC<DisciplineMasterDashboardProps> = ({ session }) => {
  const { lang, t } = useLanguage();
  const schoolId = session.currentSchool.id;
  const levelId = session.currentLevel.id;

  // Active view tab inside DM workspace
  const [activeTab, setActiveTab] = useState<'oversight' | 'targets' | 'disputes' | 'swaps'>('oversight');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [searchQuery, setSearchQuery] = useState('');
  const [contractFilter, setContractFilter] = useState<'all' | 'permanent' | 'part_time'>('all');

  // Expanded teacher cards in oversight
  const [expandedTeacherId, setExpandedTeacherId] = useState<string | null>(null);

  // Target modal state
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targetTeacherId, setTargetTeacherId] = useState<string>('');
  const [targetSubjectId, setTargetSubjectId] = useState<string>('');
  const [targetClassName, setTargetClassName] = useState<string>('Form 5 Science');
  const [targetTerm, setTargetTerm] = useState<string>('Term 2');
  const [targetPeriods, setTargetPeriods] = useState<number>(20);
  const [targetTopics, setTargetTopics] = useState<number>(6);

  // Dispute resolution modal state
  const [activeDispute, setActiveDispute] = useState<Dispute | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string>('');
  const [adjustAttendanceStatus, setAdjustAttendanceStatus] = useState<'on_time' | 'late' | 'cancelled_unpaid'>('on_time');

  // Toast feedback
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Data states
  const [oversightData, setOversightData] = useState<ReturnType<typeof db.getTeacherDMOversight>>([]);
  const [allDisputes, setAllDisputes] = useState<Dispute[]>([]);
  const [periodSwaps, setPeriodSwaps] = useState<PeriodSwap[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [payrollPeriod, setPayrollPeriod] = useState<PayrollPeriod | undefined>(undefined);

  // Load data
  const loadData = useCallback(() => {
    const data = db.getTeacherDMOversight(schoolId, levelId, selectedMonth);
    const disp = db.getAllDisputes();
    const swaps = db.getPeriodSwaps();
    const tList = db.getTeachersForSchoolLevel(schoolId, levelId);
    const sList = db.getSubjectsForSchoolLevel(schoolId, levelId);
    const period = db.getPayrollPeriodForMonth(schoolId, levelId, selectedMonth);

    setOversightData(data);
    setAllDisputes(disp);
    setPeriodSwaps(swaps);
    setTeachers(tList);
    setSubjects(sList);
    setPayrollPeriod(period);

    if (tList.length > 0 && !targetTeacherId) {
      setTargetTeacherId(tList[0].id);
    }
    if (sList.length > 0 && !targetSubjectId) {
      setTargetSubjectId(sList[0].id);
    }
  }, [schoolId, levelId, selectedMonth, targetTeacherId, targetSubjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime subscription
  useEffect(() => {
    const unsub = db.subscribeToRealtime((event) => {
      if (
        event.table === 'attendance_records' ||
        event.table === 'logbook_entries' ||
        event.table === 'expected_targets' ||
        event.table === 'disputes' ||
        event.table === 'period_swaps' ||
        event.table === 'payroll_periods'
      ) {
        loadData();
      }
    });
    return () => {
      unsub();
    };
  }, [loadData]);

  // Filtered oversight data
  const filteredOversight = useMemo(() => {
    return oversightData.filter((item) => {
      if (contractFilter !== 'all' && item.teacher.contract_type !== contractFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = item.teacher.full_name?.toLowerCase() || '';
        const code = item.teacher.teacher_code?.toLowerCase() || '';
        const dept = item.teacher.department?.toLowerCase() || '';
        if (!name.includes(q) && !code.includes(q) && !dept.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [oversightData, contractFilter, searchQuery]);

  // Handle Save Expected Target
  const handleSaveTarget = () => {
    if (!targetTeacherId || !targetSubjectId) return;

    db.setExpectedTarget({
      teacher_id: targetTeacherId,
      subject_id: targetSubjectId,
      class_name: targetClassName,
      term: targetTerm,
      expected_periods: targetPeriods,
      expected_topics: targetTopics,
    });

    setFeedbackMsg(t('target_saved_success'));
    setTimeout(() => setFeedbackMsg(null), 3500);
    setIsTargetModalOpen(false);
    loadData();
  };

  // Handle Resolve Dispute
  const handleExecuteDisputeResolution = (status: 'resolved' | 'dismissed') => {
    if (!activeDispute) return;

    db.resolveDispute({
      disputeId: activeDispute.id,
      status,
      resolution_note: resolutionNote || (status === 'resolved' ? 'Pardoned by Discipline Master' : 'Dismissed after review'),
      resolved_by: session.account.id,
      adjustAttendanceStatus: status === 'resolved' ? adjustAttendanceStatus : undefined,
    });

    setFeedbackMsg(status === 'resolved' ? t('dispute_resolved_success') : 'Dispute dismissed.');
    setTimeout(() => setFeedbackMsg(null), 3500);
    setActiveDispute(null);
    setResolutionNote('');
    loadData();
  };

  // Handle Approve Swap
  const handleApproveSwap = (swapId: string) => {
    const swap = periodSwaps.find((s) => s.id === swapId);
    const replacementId =
      swap?.assigned_replacement_id ||
      swap?.suggested_replacement_id ||
      teachers[0]?.id;

    if (!replacementId) return;

    db.approvePeriodSwap({
      swap_id: swapId,
      assigned_replacement_id: replacementId,
      approved_by_account_id: session.account.id,
      note: 'Approved by Discipline Master',
    });
    setFeedbackMsg('Period swap approved.');
    setTimeout(() => setFeedbackMsg(null), 3000);
    loadData();
  };

  // Handle Reject Swap
  const handleRejectSwap = (swapId: string) => {
    db.rejectPeriodSwap({
      swap_id: swapId,
      rejected_by_account_id: session.account.id,
      note: 'Declined by Discipline Master due to timetable constraints.',
    });
    setFeedbackMsg('Period swap rejected.');
    setTimeout(() => setFeedbackMsg(null), 3000);
    loadData();
  };

  // Handle Approve & Forward Month to Principal/VP
  const handleApproveAndForwardMonth = () => {
    db.dmApproveAndForwardMonth({
      schoolId,
      levelId,
      month: selectedMonth,
      approvedBy: session.account.id,
      notes: `Approved pedagogical targets and hours for ${selectedMonth} by ${session.account.full_name}`,
    });

    setFeedbackMsg(t('approval_forwarded_success'));
    setTimeout(() => setFeedbackMsg(null), 4000);
    loadData();
  };

  // Pending disputes count
  const pendingDisputesCount = useMemo(() => {
    return allDisputes.filter((d) => d.status === 'pending').length;
  }, [allDisputes]);

  // Pending swaps count
  const pendingSwapsCount = useMemo(() => {
    return periodSwaps.filter((s) => s.status === 'requested').length;
  }, [periodSwaps]);

  return (
    <div id="discipline-master-dashboard" className="space-y-6">
      {/* Toast Notification */}
      {feedbackMsg && (
        <div
          id="dm-feedback-toast"
          className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2.5 shadow-lg animate-in fade-in-50 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Top Controls Header */}
      <section
        id="dm-header-controls"
        className="bg-slate-950/70 backdrop-blur-md rounded-2xl border border-purple-500/20 p-4 md:p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-linear-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-purple-900/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">{t('dm_oversight')}</h2>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {t('pedagogy_and_hours')}
              </span>
              <InfoTooltip content={t('info_dm_oversight')} />
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {session.currentSchool.name} • {session.currentLevel.name}
            </p>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-2.5 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            <select
              id="dm-month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="2026-09" className="bg-slate-900 text-white">September 2026</option>
              <option value="2026-03" className="bg-slate-900 text-white">March 2026</option>
              <option value="2026-02" className="bg-slate-900 text-white">February 2026</option>
            </select>
          </div>

          {/* Set Target Button */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              id="open-target-modal-btn"
              onClick={() => setIsTargetModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-purple-500/30 text-purple-300 hover:text-white hover:bg-purple-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Target className="w-3.5 h-3.5 text-purple-400" />
              <span>{t('set_expected_targets')}</span>
            </button>
            <InfoTooltip content={t('info_target_bars')} />
          </div>

          {/* Forward to Principal/VP Approval Button */}
          {payrollPeriod?.status === 'dm_approved' || payrollPeriod?.status === 'principal_approved' ? (
            <div
              id="dm-approved-indicator"
              className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {payrollPeriod.status === 'principal_approved'
                  ? 'Principal Approved'
                  : t('status_dm_approved')}
              </span>
              <InfoTooltip content={t('info_approval_workflow')} />
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                id="approve-forward-month-btn"
                onClick={handleApproveAndForwardMonth}
                className="px-4 py-2 rounded-xl bg-linear-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-purple-900/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t('approve_and_forward')}</span>
              </button>
              <InfoTooltip content={t('info_approval_workflow')} />
            </div>
          )}
        </div>
      </section>

      {/* Navigation Sub-Tabs */}
      <div id="dm-subtabs-nav" className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          id="subtab-oversight"
          onClick={() => setActiveTab('oversight')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'oversight'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>{t('dm_oversight')}</span>
        </button>

        <button
          type="button"
          id="subtab-targets"
          onClick={() => setActiveTab('targets')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'targets'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>{t('set_expected_targets')}</span>
        </button>

        <button
          type="button"
          id="subtab-disputes"
          onClick={() => setActiveTab('disputes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'disputes'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{t('disputes_and_appeals')}</span>
          {pendingDisputesCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              {pendingDisputesCount}
            </span>
          )}
        </button>

        <button
          type="button"
          id="subtab-swaps"
          onClick={() => setActiveTab('swaps')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'swaps'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{t('swap_approvals')}</span>
          {pendingSwapsCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
              {pendingSwapsCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: TEACHER OVERSIGHT (Logbooks + Two Separate Progress Bars + Hours + Computed Salary) */}
      {activeTab === 'oversight' && (
        <div id="tab-content-oversight" className="space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-800">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                id="dm-teacher-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_teacher_or_class')}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-purple-500/50"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                id="dm-contract-all-btn"
                onClick={() => setContractFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  contractFilter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                All Contracts
              </button>
              <button
                type="button"
                id="dm-contract-perm-btn"
                onClick={() => setContractFilter('permanent')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  contractFilter === 'permanent'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {t('permanent')}
              </button>
              <button
                type="button"
                id="dm-contract-pt-btn"
                onClick={() => setContractFilter('part_time')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  contractFilter === 'part_time'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {t('part_time')}
              </button>
            </div>
          </div>

          {/* Teacher Oversight Cards */}
          <div className="space-y-4">
            {filteredOversight.length === 0 ? (
              <div className="bg-slate-950/40 rounded-2xl border border-slate-800 p-8 text-center text-slate-500 text-xs">
                No teachers found matching current filter.
              </div>
            ) : (
              filteredOversight.map((item) => {
                const { teacher, targets, attendanceStats, runningMonthlyHours, computedSalary } = item;
                const isExpanded = expandedTeacherId === teacher.id;

                return (
                  <div
                    key={teacher.id}
                    id={`teacher-oversight-card-${teacher.id}`}
                    className="bg-slate-950/70 backdrop-blur-md rounded-2xl border border-purple-500/20 p-4 md:p-5 shadow-xl hover:border-purple-500/40 transition-all space-y-4"
                  >
                    {/* Top Row: Teacher Profile Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-purple-500/30 flex items-center justify-center font-bold text-white text-base overflow-hidden">
                          {teacher.photo_url ? (
                            <img
                              src={teacher.photo_url}
                              alt={teacher.full_name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            teacher.full_name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-white">{teacher.full_name}</h3>
                            <span className="text-[10px] font-mono text-purple-300 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30">
                              {teacher.teacher_code}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase ${
                                teacher.contract_type === 'permanent'
                                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              }`}
                            >
                              {teacher.contract_type === 'permanent' ? t('permanent') : t('part_time')}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 font-medium mt-0.5">
                            {teacher.department || 'Academic Department'} • Logbook Entries: {item.logbookCount}
                          </div>
                        </div>
                      </div>

                      {/* Summary Metrics Pill */}
                      <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl text-xs">
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">{t('monthly_hours')}</div>
                          <div className="text-base font-bold text-cyan-400 font-mono">
                            {runningMonthlyHours} hrs
                          </div>
                        </div>
                        <div className="w-px h-7 bg-slate-800" />
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <span>{t('punctuality_rate')}</span>
                            <InfoTooltip content="Percentage of scheduled periods attended on time. Late arrivals or cancelled periods lower this rate." />
                          </div>
                          <div
                            className={`text-base font-bold font-mono ${
                              attendanceStats.punctualityRate >= 90
                                ? 'text-emerald-400'
                                : attendanceStats.punctualityRate >= 75
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {attendanceStats.punctualityRate}%
                          </div>
                        </div>
                        <div className="w-px h-7 bg-slate-800" />
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">{t('computed_salary')}</div>
                          <div className="text-base font-bold text-purple-300 font-mono">
                            {computedSalary.grossSalary.toLocaleString()} XAF
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Attendance Punctuality Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-400">{t('on_time')}:</span>
                        <span className="font-bold text-emerald-400 font-mono">{attendanceStats.onTime}</span>
                      </div>
                      <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-400">{t('late')} (&le;15m):</span>
                        <span className="font-bold text-amber-400 font-mono">{attendanceStats.late}</span>
                      </div>
                      <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          <span>{t('cancelled_unpaid')}:</span>
                          <InfoTooltip content={t('info_lateness_rule')} />
                        </span>
                        <span className="font-bold text-rose-400 font-mono">{attendanceStats.cancelledUnpaid}</span>
                      </div>
                      <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-400">Valid Hours:</span>
                        <span className="font-bold text-cyan-400 font-mono">{attendanceStats.validAttended} hrs</span>
                      </div>
                    </div>

                    {/* Pedagogical Targets: TWO SEPARATE PROGRESS BARS */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-purple-400" />
                          <span>Pedagogical Progress (Two Separate Metrics)</span>
                          <InfoTooltip content={t('info_target_bars')} />
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setTargetTeacherId(teacher.id);
                            setIsTargetModalOpen(true);
                          }}
                          className="text-[11px] font-semibold text-purple-400 hover:text-purple-300"
                        >
                          + Configure Target
                        </button>
                      </div>

                      {targets.length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-500 text-center">
                          No pedagogical targets configured yet for this teacher.{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setTargetTeacherId(teacher.id);
                              setIsTargetModalOpen(true);
                            }}
                            className="text-purple-400 underline font-semibold"
                          >
                            Set targets now
                          </button>
                        </div>
                      ) : (
                        targets.map((tgtObj) => (
                          <div
                            key={tgtObj.target.id}
                            id={`target-item-${tgtObj.target.id}`}
                            className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800 space-y-3"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white">{tgtObj.subjectName}</span>
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                  {tgtObj.target.class_name}
                                </span>
                                <span className="text-[10px] text-slate-400">({tgtObj.target.term})</span>
                              </div>
                            </div>

                            {/* BAR 1: PERIODS COVERED VS EXPECTED */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-medium text-cyan-300 flex items-center gap-1">
                                  <span>{t('periods_progress')}:</span>
                                  <InfoTooltip content="Total syllabus class periods delivered against expected term load." />
                                </span>
                                <span className="font-mono text-slate-300">
                                  <strong className="text-cyan-400">{tgtObj.coveredPeriods}</strong> /{' '}
                                  {tgtObj.expectedPeriods} periods ({tgtObj.periodsPercentage}%)
                                </span>
                              </div>
                              <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-cyan-500/30 p-0.5">
                                <div
                                  className="h-full rounded-full bg-linear-to-r from-cyan-500 to-indigo-500 transition-all duration-500"
                                  style={{ width: `${tgtObj.periodsPercentage}%` }}
                                />
                              </div>
                            </div>

                            {/* BAR 2: TOPICS COVERED VS EXPECTED */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-medium text-purple-300 flex items-center gap-1">
                                  <span>{t('topics_progress')}:</span>
                                  <InfoTooltip content="Distinct curriculum modules or chapters taught against official syllabus." />
                                </span>
                                <span className="font-mono text-slate-300">
                                  <strong className="text-purple-400">{tgtObj.coveredTopics}</strong> /{' '}
                                  {tgtObj.expectedTopics} topics ({tgtObj.topicsPercentage}%)
                                </span>
                              </div>
                              <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-purple-500/30 p-0.5">
                                <div
                                  className="h-full rounded-full bg-linear-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                  style={{ width: `${tgtObj.topicsPercentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Bottom: Computed Salary Breakdown Toggle */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="text-slate-400">
                        {teacher.contract_type === 'permanent' ? (
                          <span>
                            Base: {computedSalary.baseSalary.toLocaleString()} XAF + {computedSalary.extraHours} extra hrs &times;{' '}
                            {computedSalary.hourlyRate.toLocaleString()} XAF
                          </span>
                        ) : (
                          <span>
                            {runningMonthlyHours} hrs &times; {computedSalary.hourlyRate.toLocaleString()} XAF/hr
                          </span>
                        )}
                      </div>
                      <div className="text-purple-300 font-bold">
                        Gross Pay: {computedSalary.grossSalary.toLocaleString()} XAF
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TARGET MANAGEMENT */}
      {activeTab === 'targets' && (
        <div id="tab-content-targets" className="space-y-4">
          <div className="flex items-center justify-between bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">{t('set_expected_targets')}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure syllabus period quotas and distinct curriculum topics expected per teacher.
              </p>
            </div>
            <button
              type="button"
              id="new-target-btn"
              onClick={() => setIsTargetModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold hover:opacity-90 transition-opacity"
            >
              + Add Target Quota
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {db.getExpectedTargets({ schoolId, levelId }).map((target) => {
              const teacher = teachers.find((t) => t.id === target.teacher_id);
              const subject = subjects.find((s) => s.id === target.subject_id);

              return (
                <div
                  key={target.id}
                  id={`target-card-${target.id}`}
                  className="bg-slate-950/70 rounded-2xl border border-purple-500/20 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">{teacher?.full_name}</div>
                      <div className="text-xs text-purple-400 font-medium">
                        {subject?.name} • {target.class_name}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                      {target.term}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Expected Periods</div>
                      <div className="text-base font-bold text-cyan-400 font-mono mt-0.5">
                        {target.expected_periods}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Expected Topics</div>
                      <div className="text-base font-bold text-purple-400 font-mono mt-0.5">
                        {target.expected_topics}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DISPUTES & APPEALS RESOLUTION */}
      {activeTab === 'disputes' && (
        <div id="tab-content-disputes" className="space-y-4">
          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{t('disputes_and_appeals')}</h3>
                <InfoTooltip content={t('info_dispute_resolution')} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Review teacher appeals for lateness flags or cancelled hours. Pardoning an attendance record clears deductions.
              </p>
            </div>
            <div className="text-xs font-bold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-3 py-1.5 rounded-xl">
              {pendingDisputesCount} Pending
            </div>
          </div>

          <div className="space-y-3">
            {allDisputes.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800">
                No disputes filed yet.
              </div>
            ) : (
              allDisputes.map((dispute) => {
                const teacher = teachers.find((t) => t.id === dispute.teacher_id);

                return (
                  <div
                    key={dispute.id}
                    id={`dispute-card-${dispute.id}`}
                    className="bg-slate-950/70 backdrop-blur-md rounded-2xl border border-purple-500/20 p-4 space-y-3"
                  >
                    <div className="flex items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{teacher?.full_name || dispute.teacher_id}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              dispute.status === 'resolved'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : dispute.status === 'dismissed'
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {dispute.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Filed on {new Date(dispute.created_at).toLocaleDateString()} • Type: {dispute.related_record_type}
                        </div>
                      </div>

                      {dispute.status === 'pending' && (
                        <button
                          type="button"
                          id={`resolve-dispute-btn-${dispute.id}`}
                          onClick={() => {
                            setActiveDispute(dispute);
                            setResolutionNote('');
                            setAdjustAttendanceStatus('on_time');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-linear-to-r from-purple-600 to-cyan-600 text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          Resolve Appeal
                        </button>
                      )}
                    </div>

                    {/* Teacher Reason */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Appeal Reason / Statement:
                      </div>
                      <p className="italic text-slate-200">{dispute.reason}</p>
                    </div>

                    {/* Resolution Note if resolved */}
                    {dispute.resolution_note && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                        <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                          DM Resolution Note:
                        </div>
                        <p>{dispute.resolution_note}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SWAP APPROVALS */}
      {activeTab === 'swaps' && (
        <div id="tab-content-swaps" className="space-y-4">
          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">{t('swap_approvals')}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review peer period swap requests submitted by teachers.
              </p>
            </div>
            <div className="text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-xl">
              {pendingSwapsCount} Requested
            </div>
          </div>

          <div className="space-y-3">
            {periodSwaps.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800">
                No swap requests on file.
              </div>
            ) : (
              periodSwaps.map((swap) => {
                const requester = teachers.find((t) => t.id === swap.requester_teacher_id);
                const targetTeacher = teachers.find((t) => t.id === swap.target_teacher_id);

                return (
                  <div
                    key={swap.id}
                    id={`swap-card-${swap.id}`}
                    className="bg-slate-950/70 rounded-2xl border border-purple-500/20 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{requester?.full_name}</span>
                        <span className="text-xs text-slate-400">&rarr;</span>
                        <span className="text-sm font-bold text-cyan-300">{targetTeacher?.full_name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ml-2 ${
                            swap.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : swap.status === 'rejected'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {swap.status}
                        </span>
                      </div>

                      {swap.status === 'requested' && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleApproveSwap(swap.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectSwap(swap.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-600/30 text-rose-400 hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Decline</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                      <span className="text-slate-500 font-medium">Reason: </span>
                      <span className="italic">{swap.reason}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL: SET EXPECTED TARGETS */}
      {isTargetModalOpen && (
        <div
          id="target-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in-50 duration-150"
        >
          <div
            id="target-modal"
            className="w-full max-w-md bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{t('set_expected_targets')}</span>
                <InfoTooltip content={t('info_target_bars')} />
              </h3>
              <button
                type="button"
                id="close-target-modal-btn"
                onClick={() => setIsTargetModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                &times;
              </button>
            </div>

            {/* Teacher Select */}
            <div className="space-y-1.5">
              <label htmlFor="target-teacher-select" className="text-xs font-semibold text-slate-300">
                {t('teacher')}
              </label>
              <select
                id="target-teacher-select"
                value={targetTeacherId}
                onChange={(e) => setTargetTeacherId(e.target.value)}
                className="w-full bg-slate-950 border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} ({t.teacher_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Select */}
            <div className="space-y-1.5">
              <label htmlFor="target-subject-select" className="text-xs font-semibold text-slate-300">
                {t('subject')}
              </label>
              <select
                id="target-subject-select"
                value={targetSubjectId}
                onChange={(e) => setTargetSubjectId(e.target.value)}
                className="w-full bg-slate-950 border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Class & Term */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="target-class-input" className="text-xs font-semibold text-slate-300">
                  {t('class')}
                </label>
                <input
                  type="text"
                  id="target-class-input"
                  value={targetClassName}
                  onChange={(e) => setTargetClassName(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="target-term-input" className="text-xs font-semibold text-slate-300">
                  {t('term')}
                </label>
                <input
                  type="text"
                  id="target-term-input"
                  value={targetTerm}
                  onChange={(e) => setTargetTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            {/* Two Targets Inputs */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="space-y-1.5">
                <label htmlFor="target-periods-input" className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                  <span>Target Periods</span>
                  <InfoTooltip content="Total scheduled periods expected to be taught in this term/month." />
                </label>
                <input
                  type="number"
                  id="target-periods-input"
                  min={1}
                  max={200}
                  value={targetPeriods}
                  onChange={(e) => setTargetPeriods(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-900 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="target-topics-input" className="text-xs font-bold text-purple-300 flex items-center gap-1">
                  <span>Target Topics</span>
                  <InfoTooltip content="Number of distinct syllabus topics/modules expected to be covered." />
                </label>
                <input
                  type="number"
                  id="target-topics-input"
                  min={1}
                  max={50}
                  value={targetTopics}
                  onChange={(e) => setTargetTopics(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-900 border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsTargetModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                id="save-target-confirm-btn"
                onClick={handleSaveTarget}
                className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-purple-900/30"
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESOLVE DISPUTE */}
      {activeDispute && (
        <div
          id="dispute-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in-50 duration-150"
        >
          <div
            id="dispute-modal"
            className="w-full max-w-md bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{t('resolve_appeal')}</span>
                <InfoTooltip content={t('info_dispute_resolution')} />
              </h3>
              <button
                type="button"
                onClick={() => setActiveDispute(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                &times;
              </button>
            </div>

            {/* Teacher statement */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Teacher Contest:</div>
              <p className="italic text-slate-200">{activeDispute.reason}</p>
            </div>

            {/* If attendance dispute, allow status adjustment */}
            {activeDispute.related_record_type === 'attendance' && (
              <div className="space-y-1.5">
                <label htmlFor="adjust-att-status-select" className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <span>Pardon Status Adjustment</span>
                  <InfoTooltip content="Selecting On-Time pardons any lateness penalty and ensures the period is paid in payroll." />
                </label>
                <select
                  id="adjust-att-status-select"
                  value={adjustAttendanceStatus}
                  onChange={(e) => setAdjustAttendanceStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="on_time">Pardon to On-Time (Full Credit, 0m Late)</option>
                  <option value="late">Allow Late (&le;15m, Standard Pay)</option>
                  <option value="cancelled_unpaid">Keep Cancelled/Unpaid</option>
                </select>
              </div>
            )}

            {/* Resolution note */}
            <div className="space-y-1.5">
              <label htmlFor="resolution-note-input" className="text-xs font-semibold text-slate-300">
                Resolution Note & Justification
              </label>
              <textarea
                id="resolution-note-input"
                rows={3}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="E.g., Confirmed with security gate log. Campus barrier failure caused delay. Period fully taught."
                className="w-full bg-slate-950 border border-purple-500/30 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-purple-400"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                id="dismiss-dispute-btn"
                onClick={() => handleExecuteDisputeResolution('dismissed')}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-900/30 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Dismiss Appeal
              </button>
              <button
                type="button"
                id="pardon-dispute-btn"
                onClick={() => handleExecuteDisputeResolution('resolved')}
                className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white text-xs font-bold shadow-lg shadow-purple-900/30 hover:opacity-90 cursor-pointer"
              >
                Pardon & Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import SignaturePad from 'signature_pad';
import {
  Teacher,
  Account,
  School,
  Level,
  LogbookEntry,
  TimetableSlot,
  Subject,
} from '../../types';
import { db } from '../../lib/db';
import { useLanguage } from '../../lib/i18n';
import { InfoTooltip } from '../common/InfoTooltip';
import { TeacherDisputeModal } from './TeacherDisputeModal';
import {
  BookOpen,
  PlusCircle,
  Search,
  Lock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Eraser,
  PenTool,
  ShieldCheck,
  ChevronRight,
  Eye,
  X,
  Users,
  CheckSquare,
} from 'lucide-react';

interface TeacherLogbookProps {
  teacher: Teacher & { account: Account };
  school: School;
  level: Level;
  preselectedSlot?: (TimetableSlot & { subject: Subject }) | null;
  onClearPreselectedSlot?: () => void;
  isOffline: boolean;
}

export const TeacherLogbook: React.FC<TeacherLogbookProps> = ({
  teacher,
  school,
  level,
  preselectedSlot,
  onClearPreselectedSlot,
  isOffline,
}) => {
  const { t, lang } = useLanguage();
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetailEntry, setSelectedDetailEntry] = useState<LogbookEntry | null>(null);

  // Dispute modal state
  const [disputeTargetEntry, setDisputeTargetEntry] = useState<LogbookEntry | null>(null);

  // New Entry Form State
  const [entryDate, setEntryDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [entryPeriod, setEntryPeriod] = useState<number>(1);
  const [entryClass, setEntryClass] = useState<string>('Form 5 Science');
  const [entrySubjectId, setEntrySubjectId] = useState<string>('');
  const [lessonTitle, setLessonTitle] = useState<string>('');
  const [contentSummary, setContentSummary] = useState<string>('');
  const [homeworkAssigned, setHomeworkAssigned] = useState<string>('');
  const [absenteeCount, setAbsenteeCount] = useState<number>(0);
  const [homeworkChecked, setHomeworkChecked] = useState<boolean>(true);
  const [homeworkNote, setHomeworkNote] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successSaved, setSuccessSaved] = useState(false);

  // Signature Pad Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sigPadRef = useRef<SignaturePad | null>(null);

  const subjects = db.getSubjectsForPartition(school.id, level.id);

  // Load past entries
  const reloadEntries = () => {
    const list = db.getLogbookEntriesForTeacher(teacher.id);
    setEntries(list);
  };

  useEffect(() => {
    reloadEntries();
  }, [teacher.id]);

  // Handle preselected slot from Home / Timetable
  useEffect(() => {
    if (preselectedSlot) {
      setIsCreatingNew(true);
      setEntryPeriod(preselectedSlot.period_number);
      setEntryClass(preselectedSlot.class_name);
      setEntrySubjectId(preselectedSlot.subject_id);
      if (onClearPreselectedSlot) onClearPreselectedSlot();
    }
  }, [preselectedSlot]);

  // Setup default subject if empty
  useEffect(() => {
    if (!entrySubjectId && subjects.length > 0) {
      setEntrySubjectId(subjects[0].id);
    }
  }, [subjects, entrySubjectId]);

  // Initialize Signature Pad when creating form opens
  useEffect(() => {
    if (isCreatingNew && canvasRef.current) {
      const canvas = canvasRef.current;
      // Setup canvas scale for crisp rendering
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(ratio, ratio);
      }

      const pad = new SignaturePad(canvas, {
        minWidth: 1.5,
        maxWidth: 3,
        penColor: '#38bdf8', // cyan accent
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
      });

      sigPadRef.current = pad;

      return () => {
        pad.off();
      };
    }
  }, [isCreatingNew]);

  const handleClearSignature = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!lessonTitle.trim()) {
      setFormError(lang === 'fr' ? 'Veuillez saisir le titre de la leçon.' : 'Please enter the lesson title.');
      return;
    }
    if (!contentSummary.trim()) {
      setFormError(lang === 'fr' ? 'Veuillez saisir le résumé du cours.' : 'Please provide a content summary.');
      return;
    }
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
      setFormError(lang === 'fr' ? 'Veuillez signer électroniquement la fiche.' : 'Please provide your hand-drawn signature.');
      return;
    }
    if (pinInput.trim().length !== 4) {
      setFormError(lang === 'fr' ? 'Le code PIN doit comporter 4 chiffres.' : 'PIN confirmation must be 4 digits.');
      return;
    }

    setIsSubmitting(true);

    try {
      const signatureDataUrl = sigPadRef.current.toDataURL('image/png');

      db.createLogbookEntry({
        teacher_id: teacher.id,
        academic_year: '2025–2026',
        date: entryDate,
        period: entryPeriod,
        class_name: entryClass,
        subject_id: entrySubjectId,
        lesson_title: lessonTitle.trim(),
        content_summary: contentSummary.trim(),
        homework_assigned: homeworkAssigned.trim() || null,
        absentee_count: absenteeCount,
        homework_checked: homeworkChecked,
        homework_note: homeworkNote.trim() || null,
        signature_url: signatureDataUrl,
        signed_at: new Date().toISOString(),
        pin_confirmed: true,
        offline_created: isOffline,
      });

      setSuccessSaved(true);
      setTimeout(() => {
        setSuccessSaved(false);
        setIsCreatingNew(false);
        // Reset fields
        setLessonTitle('');
        setContentSummary('');
        setHomeworkAssigned('');
        setAbsenteeCount(0);
        setHomeworkNote('');
        setPinInput('');
        reloadEntries();
      }, 1500);
    } catch {
      setFormError(lang === 'fr' ? 'Erreur d\'enregistrement.' : 'Failed to save logbook entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered past entries
  const filteredEntries = entries.filter((entry) => {
    const q = searchQuery.toLowerCase();
    return (
      entry.lesson_title.toLowerCase().includes(q) ||
      entry.content_summary.toLowerCase().includes(q) ||
      entry.class_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-xl shadow-purple-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <span>{t('logbook_title')}</span>
            <InfoTooltip text={t('info_locked_payroll')} />
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {school.name} • {level.name} • {entries.length} validated lessons
          </p>
        </div>

        <button
          type="button"
          id="toggle-new-logbook-entry-btn"
          onClick={() => {
            setIsCreatingNew((prev) => !prev);
            setFormError(null);
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
            isCreatingNew
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              : 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-purple-900/40 hover:scale-[1.02]'
          }`}
        >
          {isCreatingNew ? (
            <>
              <X className="w-4 h-4" />
              <span>{t('cancel')}</span>
            </>
          ) : (
            <>
              <PlusCircle className="w-4 h-4" />
              <span>{t('new_logbook_entry')}</span>
            </>
          )}
        </button>
      </div>

      {/* New Logbook Entry Interactive Form */}
      {isCreatingNew ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/95 border border-purple-500/40 shadow-2xl shadow-purple-950/30 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>{t('new_logbook_entry')}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                  Step-by-Step E-Validation
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Academic Year 2025–2026 • Official Pedagogic Record
              </p>
            </div>
            {isOffline && (
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {t('offline_indicator')}
              </span>
            )}
          </div>

          {successSaved ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">Lesson Successfully Signed & Recorded</h3>
              <p className="text-xs text-slate-400">
                Dispatched to school academic ledger and locked for payroll calculation.
              </p>
            </div>
          ) : (
            <form onSubmit={handleCreateSubmit} className="mt-6 space-y-6">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Step 1: Course Identification */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                  1. {t('course_identification')}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      {t('date')}
                    </label>
                    <input
                      type="date"
                      required
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      {t('period_label')} (1–7)
                    </label>
                    <select
                      value={entryPeriod}
                      onChange={(e) => setEntryPeriod(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                        <option key={p} value={p}>
                          {t('period_label')} {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      {t('class_group')}
                    </label>
                    <input
                      type="text"
                      required
                      value={entryClass}
                      onChange={(e) => setEntryClass(e.target.value)}
                      placeholder="e.g. Form 5 Science"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      {t('subject')}
                    </label>
                    <select
                      value={entrySubjectId}
                      onChange={(e) => setEntrySubjectId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    >
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 2: Lesson Content */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider block">
                  2. {t('lesson_content')}
                </span>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    {t('lesson_title')}
                  </label>
                  <input
                    type="text"
                    required
                    id="logbook-lesson-title-input"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="e.g. Conic Sections: Focal Geometry & Analytical Parabola"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    {t('content_summary')}
                  </label>
                  <textarea
                    rows={3}
                    required
                    id="logbook-content-summary-input"
                    value={contentSummary}
                    onChange={(e) => setContentSummary(e.target.value)}
                    placeholder="Detailed pedagogic summary of concepts taught, exercises worked, student participation..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    {t('homework_assigned')} (Optional)
                  </label>
                  <input
                    type="text"
                    value={homeworkAssigned}
                    onChange={(e) => setHomeworkAssigned(e.target.value)}
                    placeholder="e.g. Exercises 4B, problems 1 through 15 on textbook page 142"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>
              </div>

              {/* Step 3: Class Tracking (Headcount-only in v1) */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                    3. {t('class_tracking')}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span>Headcount tracking</span>
                    <InfoTooltip text={t('info_headcount_scope')} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Headcount stepper */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                      <span>{t('absentee_headcount')}</span>
                      <InfoTooltip text={t('info_headcount_scope')} />
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setAbsenteeCount((prev) => Math.max(0, prev - 1))}
                        className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-12 text-center text-base font-extrabold text-white font-mono">
                        {absenteeCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setAbsenteeCount((prev) => prev + 1)}
                        className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                      <span className="text-[11px] text-slate-400 ml-2">
                        {absenteeCount === 0 ? 'Full class present' : `${absenteeCount} absent`}
                      </span>
                    </div>
                  </div>

                  {/* Homework Notebook Checked */}
                  <div className="flex flex-col justify-center">
                    <label className="flex items-center gap-2.5 text-xs text-slate-300 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={homeworkChecked}
                        onChange={(e) => setHomeworkChecked(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                      />
                      <span>{t('homework_checked')}</span>
                    </label>
                    <input
                      type="text"
                      value={homeworkNote}
                      onChange={(e) => setHomeworkNote(e.target.value)}
                      placeholder="Note: e.g. 3 partial submissions checked..."
                      className="mt-2 w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                  </div>
                </div>
              </div>

              {/* Step 4: Validation & Signature */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
                    4. {t('validation_step')}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span>Tamper-evident verification</span>
                    <InfoTooltip text={t('info_signature_pin')} />
                  </div>
                </div>

                {/* Hand-drawn signature canvas */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{t('draw_signature')}</span>
                    </label>
                    <button
                      type="button"
                      id="logbook-clear-signature-btn"
                      onClick={handleClearSignature}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Eraser className="w-3 h-3" />
                      <span>{t('clear_signature')}</span>
                    </button>
                  </div>

                  <div className="w-full h-32 rounded-xl border border-slate-700 bg-slate-950/90 relative overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      className="w-full h-full cursor-crosshair touch-none"
                    />
                    <div className="absolute bottom-1 right-2 text-[9px] text-slate-600 font-mono pointer-events-none select-none">
                      Touch / Mouse input enabled
                    </div>
                  </div>
                </div>

                {/* PIN confirmation */}
                <div className="max-w-xs">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    <span>{t('pin_verification')}</span>
                    <InfoTooltip text={t('info_signature_pin')} />
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    id="logbook-pin-confirmation-input"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 4-digit PIN (demo: 7788)"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono tracking-widest text-white text-center focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>
              </div>

              {/* Form Action Controls */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  id="logbook-submit-lesson-btn"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-purple-900/40 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 hover:scale-[1.01]"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? t('loading') : t('sign_and_validate')}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      ) : null}

      {/* Search & Filter Past Entries */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search_lessons')}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing {filteredEntries.length} of {entries.length} entries
        </div>
      </div>

      {/* Past Logbook Entries Cards */}
      {filteredEntries.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400">
            {searchQuery ? 'No logbook entries match your search query.' : 'No logbook entries recorded yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEntries.map((entry) => {
            const subject = subjects.find((s) => s.id === entry.subject_id);
            return (
              <div
                key={entry.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md space-y-4"
              >
                <div>
                  {/* Top Metadata Row */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                        {entry.date}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-cyan-300">
                        {t('period_label')} {entry.period}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <Lock className="w-3 h-3" />
                      <span>{t('signed_and_locked')}</span>
                    </div>
                  </div>

                  {/* Title & Subject */}
                  <h3 className="text-base font-extrabold text-white leading-snug">
                    {entry.lesson_title}
                  </h3>
                  <p className="text-xs font-semibold text-cyan-400 mt-0.5">
                    {entry.class_name} • {subject?.name || 'Curriculum Subject'}
                  </p>

                  {/* Summary */}
                  <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                    {entry.content_summary}
                  </p>

                  {/* Tracking Chips */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-500" />
                      {entry.absentee_count === 0 ? '0 absent' : `${entry.absentee_count} absent`}
                    </span>
                    {entry.homework_checked && (
                      <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 flex items-center gap-1 text-emerald-400">
                        <CheckSquare className="w-3 h-3" />
                        Homework checked
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setDisputeTargetEntry(entry)}
                    className="text-[11px] font-medium text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    {t('file_dispute_correction')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedDetailEntry(entry)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View Record</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal for a Logbook Entry */}
      {selectedDetailEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl shadow-purple-950/40 text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Logbook Record Detail</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailEntry(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="font-extrabold text-sm text-white">{selectedDetailEntry.lesson_title}</div>
                <div className="text-slate-400 mt-1">
                  {selectedDetailEntry.class_name} • Period {selectedDetailEntry.period} • {selectedDetailEntry.date}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-400 block mb-1">Content Summary:</span>
                <p className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-200 leading-relaxed">
                  {selectedDetailEntry.content_summary}
                </p>
              </div>

              {selectedDetailEntry.homework_assigned && (
                <div>
                  <span className="font-bold text-slate-400 block mb-1">Homework Assigned:</span>
                  <p className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-200">
                    {selectedDetailEntry.homework_assigned}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-slate-500 block">Absentees:</span>
                  <span className="font-bold text-white text-sm">{selectedDetailEntry.absentee_count} students</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-slate-500 block">Homework Checked:</span>
                  <span className="font-bold text-white text-sm">
                    {selectedDetailEntry.homework_checked ? 'Yes • Verified' : 'No'}
                  </span>
                </div>
              </div>

              {/* Digital Signature Render */}
              <div>
                <span className="font-bold text-slate-400 block mb-1 flex items-center gap-1">
                  <span>Cryptographic Proof & Signature:</span>
                  <InfoTooltip text={t('info_signature_pin')} />
                </span>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="h-16 flex items-center">
                    {selectedDetailEntry.signature_url ? (
                      <img
                        src={selectedDetailEntry.signature_url}
                        alt="Teacher Signature"
                        className="h-12 max-w-[200px] object-contain"
                      />
                    ) : (
                      <span className="text-slate-600 italic">Signature on file</span>
                    )}
                  </div>
                  <div className="text-right text-[10px] text-slate-500 font-mono">
                    <div>PIN Verified: Yes</div>
                    <div>{selectedDetailEntry.signed_at?.split('T')[0]}</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDisputeTargetEntry(selectedDetailEntry);
                    setSelectedDetailEntry(null);
                  }}
                  className="px-3 py-1.5 rounded-xl text-amber-400 hover:bg-amber-500/10 border border-amber-500/30 text-xs font-semibold"
                >
                  {t('file_dispute_correction')}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDetailEntry(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {disputeTargetEntry && (
        <TeacherDisputeModal
          isOpen={!!disputeTargetEntry}
          onClose={() => setDisputeTargetEntry(null)}
          teacherId={teacher.id}
          recordType="logbook"
          recordId={disputeTargetEntry.id}
          recordTitle={disputeTargetEntry.lesson_title}
        />
      )}
    </div>
  );
};

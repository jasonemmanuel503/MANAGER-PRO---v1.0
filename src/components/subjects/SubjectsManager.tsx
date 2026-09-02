import React, { useState, useEffect } from 'react';
import { Subject, UserRole } from '../../types';
import { db } from '../../lib/db';
import { useLanguage } from '../../lib/i18n';
import { InfoTooltip } from '../common/InfoTooltip';
import { SkeletonLoader } from '../common/SkeletonLoader';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
} from 'lucide-react';

interface SubjectsManagerProps {
  schoolId: string;
  levelId: string;
  currentRole: UserRole;
}

export const SubjectsManager: React.FC<SubjectsManagerProps> = ({
  schoolId,
  levelId,
  currentRole,
}) => {
  const { t, lang } = useLanguage();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectNameInput, setSubjectNameInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Delete Confirm State
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Role permissions: VP (timetable-facing list) and Founder / Principal (master list)
  const canEdit =
    currentRole === 'VP' ||
    currentRole === 'Principal' ||
    currentRole === 'Founder';

  const loadData = () => {
    setIsLoading(true);
    // Simulate brief reactive fetch
    setTimeout(() => {
      const data = db.getSubjectsForPartition(schoolId, levelId);
      setSubjects(data);
      setIsLoading(false);
    }, 200);
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribeToRealtime((event) => {
      if (event.table === 'subjects') {
        const data = db.getSubjectsForPartition(schoolId, levelId);
        setSubjects(data);
      }
    });
    return unsub;
  }, [schoolId, levelId]);

  const handleOpenCreate = () => {
    setEditingSubject(null);
    setSubjectNameInput('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setSubjectNameInput(subject.name);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (editingSubject) {
        db.updateSubject(editingSubject.id, { name: subjectNameInput });
        setActionSuccess(t('subject_updated_success'));
      } else {
        db.createSubject({
          schoolId,
          levelId,
          name: subjectNameInput,
        });
        setActionSuccess(t('subject_created_success'));
      }

      setIsModalOpen(false);
      loadData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  const handleDeleteConfirm = () => {
    if (!subjectToDelete) return;
    setDeleteError(null);

    try {
      db.deleteSubject(subjectToDelete.id);
      setSubjectToDelete(null);
      loadData();
      setActionSuccess(t('subject_deleted_success'));
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl shadow-black/20">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex items-center">
              <h1 className="text-xl font-black text-white tracking-tight">
                {t('subjects_title')}
              </h1>
              <InfoTooltip content={t('info_subjects_scope')} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {canEdit ? (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('new_subject')}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('view_only_notice')}</span>
              <InfoTooltip content={t('info_subjects_permissions')} />
            </div>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2.5 backdrop-blur-md animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/40 border border-purple-500/15 backdrop-blur-md flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search')}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-cyan-400 transition-colors"
          />
        </div>
        <div className="text-xs font-mono text-slate-400 shrink-0">
          {filteredSubjects.length} {lang === 'fr' ? 'matières' : 'subjects'}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/10">
          <SkeletonLoader lines={6} />
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-white/10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-slate-300">
            {lang === 'fr' ? 'Aucune matière trouvée' : 'No subjects found'}
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t('new_subject')}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredSubjects.map((subject) => {
            const slotsUsing = db
              .getTimetableSlotsForPartition(schoolId, levelId)
              .filter((ts) => ts.subject_id === subject.id);

            return (
              <div
                key={subject.id}
                className="p-4 rounded-2xl bg-slate-900/50 border border-purple-500/15 hover:border-purple-500/40 backdrop-blur-md transition-all shadow-md shadow-black/20 flex flex-col justify-between gap-3 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold shrink-0">
                      {subject.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-white truncate">
                        {subject.name}
                      </div>
                      <div className="text-[11px] font-mono text-cyan-400 mt-0.5 flex items-center gap-1.5">
                        <Layers className="w-3 h-3" />
                        <span>
                          {slotsUsing.length}{' '}
                          {lang === 'fr' ? 'périodes assignées' : 'periods scheduled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(subject)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                        title={t('edit')}
                        aria-label={t('edit')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setSubjectToDelete(subject);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title={t('delete')}
                        aria-label={t('delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-white/5 flex items-center justify-between">
                  <span>ID: {subject.id}</span>
                  <span>v{subject.version}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in-50 duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-purple-500/30 p-6 shadow-2xl shadow-purple-950/50 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-white">
                  {editingSubject ? t('edit_subject') : t('new_subject')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  {t('subject_name')}
                </label>
                <input
                  type="text"
                  required
                  value={subjectNameInput}
                  onChange={(e) => setSubjectNameInput(e.target.value)}
                  placeholder="e.g. Further Mathematics, Littérature, Chemistry"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-cyan-400 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-xs font-semibold cursor-pointer transition-colors"
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
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {subjectToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in-50 duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-rose-500/40 p-6 shadow-2xl shadow-rose-950/40 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-white">
                {t('delete_subject')}
              </h3>
              <p className="text-xs text-slate-300">
                &ldquo;{subjectToDelete.name}&rdquo;
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSubjectToDelete(null)}
                className="w-full py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-xs font-bold cursor-pointer transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-md shadow-rose-950/40"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

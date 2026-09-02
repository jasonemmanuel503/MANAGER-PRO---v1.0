import React, { useState, useEffect } from 'react';
import { AuthSession, AccountLevelRole, Level } from '../../types';
import { db } from '../../lib/db';
import { LevelSwitcher } from '../auth/LevelSwitcher';
import { ThemeToggle } from '../common/ThemeToggle';
import { AdminSidebar, DashboardTab } from '../layout/AdminSidebar';
import { SubjectsManager } from '../subjects/SubjectsManager';
import { VisualTimetableBuilder } from '../timetable/VisualTimetableBuilder';
import { PeriodSwapManager } from '../swaps/PeriodSwapManager';
import { DisciplineMasterDashboard } from '../discipline/DisciplineMasterDashboard';
import { SecretaryAttendancePortal } from '../secretary/SecretaryAttendancePortal';
import { RealtimeToastFeed } from '../layout/RealtimeToastFeed';
import { InfoTooltip } from '../common/InfoTooltip';
import { useLanguage } from '../../lib/i18n';
import { useTheme } from '../../lib/theme';
import {
  LogOut,
  ShieldCheck,
  Building,
  Users,
  BookOpen,
  Calendar,
  Layers,
  Menu,
  X,
  CheckCircle2,
  Radio,
  Sparkles,
  Repeat,
  Languages,
  Sun,
  Moon,
  Clock,
} from 'lucide-react';

interface FoundationDashboardProps {
  session: AuthSession;
  onUpdateSession: (newSession: AuthSession) => void;
  onLogout: () => void;
  onOpenSchemaModal?: () => void;
}

export const FoundationDashboard: React.FC<FoundationDashboardProps> = ({
  session,
  onUpdateSession,
  onLogout,
  onOpenSchemaModal,
}) => {
  const { account, activeGrant, allGrants, currentSchool, currentLevel } = session;
  const { t, lang, setLanguage } = useLanguage();
  const { theme } = useTheme();

  const [currentTab, setCurrentTab] = useState<DashboardTab>(() => {
    if (activeGrant.role === 'DM') return 'dm_oversight';
    if (activeGrant.role === 'Secretary') return 'attendance';
    return 'overview';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingSwapsCount, setPendingSwapsCount] = useState(0);

  const schoolLevels = db.getLevelsForSchool(currentSchool.id);

  // Queries strictly partitioned by (school_id, level_id)
  const partitionTeachers = db.getTeachersForPartition(currentSchool.id, currentLevel.id);
  const partitionSubjects = db.getSubjectsForPartition(currentSchool.id, currentLevel.id);
  const partitionSlots = db.getTimetableSlotsForPartition(currentSchool.id, currentLevel.id);

  // Keep pending swaps count up to date
  useEffect(() => {
    const updateCount = () => {
      const swaps = db.getPeriodSwapsForPartition(currentSchool.id, currentLevel.id);
      setPendingSwapsCount(swaps.filter((s) => s.status === 'pending').length);
    };

    updateCount();
    const unsub = db.subscribeToRealtime((event) => {
      if (event.table === 'period_swaps') {
        updateCount();
      }
    });
    return unsub;
  }, [currentSchool.id, currentLevel.id]);

  // Switch grant handler (Multi-Level Switcher)
  const handleSwitchGrant = (newGrant: AccountLevelRole, newLevel: Level) => {
    onUpdateSession({
      ...session,
      activeGrant: newGrant,
      currentLevel: newLevel,
    });
  };

  const handleSwitchToTeacher = () => {
    const teachers = db.getTeachersForPartition(currentSchool.id, currentLevel.id);
    const teacher = teachers[0];
    if (!teacher) return;
    const teacherGrant: AccountLevelRole = {
      id: 'grant_preview_teacher',
      account_id: teacher.account_id,
      school_id: currentSchool.id,
      level_id: currentLevel.id,
      role: 'Teacher',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const teacherAccount = db.getTeacherByAccountId(teacher.account_id)?.account || {
      id: teacher.account_id,
      phone_number: teacher.phone_number || '+237670000007',
      pin_hash: '1234',
      full_name: teacher.full_name || 'Mr. Tabi Peter',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
    };
    onUpdateSession({
      ...session,
      account: teacherAccount,
      activeGrant: teacherGrant,
      allGrants: [...session.allGrants.filter((g) => g.id !== 'grant_preview_teacher'), teacherGrant],
    });
  };

  const handleSelectTab = (tab: DashboardTab) => {
    if (tab === 'schema') {
      onOpenSchemaModal?.();
    } else {
      setCurrentTab(tab);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 selection:bg-purple-500/30 selection:text-white max-w-full overflow-x-hidden no-scrollbar-mobile admin-viewport">
      {/* Realtime Toast Notifications Feed */}
      <RealtimeToastFeed />

      {/* Desktop Fixed Collapsible Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          userRole={activeGrant.role}
          userName={account.full_name}
          userPhone={account.phone_number}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          onLogout={onLogout}
          pendingSwapsCount={pendingSwapsCount}
        />
      </div>

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto overflow-x-hidden lg:overflow-x-visible no-scrollbar-mobile">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 px-4 sm:px-5 py-3 flex items-center justify-between border-b border-slate-200 dark:border-purple-500/20 bg-white/90 dark:bg-[#080c16]/90 backdrop-blur-2xl shadow-xs dark:shadow-lg dark:shadow-black/40">
          <div className="flex items-center gap-3 min-w-0">
            {/* School & Active Partition indicator */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-purple-950/40 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                  {currentSchool.name}
                </div>
                <div className="text-[10px] text-cyan-700 dark:text-cyan-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 truncate">
                  <span className="truncate">{currentLevel.name} Partition</span>
                  <span>•</span>
                  <span className="shrink-0">{activeGrant.role}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Desktop Level Switcher (>= lg) */}
            <div className="hidden lg:block">
              <LevelSwitcher
                currentLevel={currentLevel}
                currentRole={activeGrant.role}
                allGrants={allGrants}
                levels={schoolLevels}
                onSwitchGrant={handleSwitchGrant}
              />
            </div>

            {/* Quick Teacher Portal View Button (>= lg) */}
            <button
              type="button"
              id="dashboard-switch-teacher-btn"
              onClick={handleSwitchToTeacher}
              className="hidden lg:flex px-2.5 py-1.5 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 text-xs font-bold text-purple-600 dark:text-purple-300 items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Preview dedicated Teacher Portal"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
              <span>Teacher View</span>
            </button>

            {/* Desktop Language Switcher (hidden on mobile + tablet) */}
            <button
              type="button"
              id="dashboard-language-toggle-desktop"
              onClick={() => setLanguage(lang === 'en' ? 'fr' : 'en')}
              className="hidden lg:flex px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-purple-500/30 hover:border-cyan-500 dark:hover:border-cyan-400/50 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Toggle language (Bilingual EN/FR)"
              aria-label="Toggle language"
            >
              <Languages className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
              <span>{lang.toUpperCase()}</span>
            </button>

            {/* Desktop Theme Switcher (>= lg) */}
            <div className="hidden lg:block">
              <ThemeToggle
                id="dashboard-theme-toggle-desktop"
                className="bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-purple-500/30 text-slate-700 dark:text-slate-200 hover:text-amber-500"
              />
            </div>

            {/* Desktop Realtime Status Indicator (>= lg) */}
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-mono font-semibold"
              title="Supabase Realtime connected"
            >
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Realtime</span>
            </div>

            {/* Desktop Sign out (>= lg) */}
            <button
              type="button"
              id="dashboard-signout-btn-desktop"
              onClick={onLogout}
              className="hidden lg:flex px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('sign_out')}</span>
            </button>

            {/* Mobile & Tablet Hamburger Menu Toggle (ON THE RIGHT OF THE HEADER) */}
            <button
              type="button"
              id="dashboard-hamburger-toggle"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 cursor-pointer shadow-xs"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </header>

        {/* Mobile / Tablet Navigation Drawer */}
        {isMobileMenuOpen && (
          <>
            <div
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md transition-opacity duration-300 lg:hidden"
              aria-hidden="true"
            />

            <div className="fixed top-0 right-0 bottom-0 z-50 h-full w-[85vw] sm:w-[50vw] max-w-[340px] bg-white/98 dark:bg-[#080c16]/95 border-l border-slate-200 dark:border-purple-500/30 p-6 flex flex-col justify-between backdrop-blur-2xl animate-in slide-in-from-right duration-200 overflow-y-auto no-scrollbar-mobile lg:hidden shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-purple-500/20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      M
                    </div>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Manager Pro
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Level Switcher in Drawer */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5">
                    Active Partition
                  </label>
                  <LevelSwitcher
                    currentLevel={currentLevel}
                    currentRole={activeGrant.role}
                    allGrants={allGrants}
                    levels={schoolLevels}
                    onSwitchGrant={(g, l) => {
                      handleSwitchGrant(g, l);
                      setIsMobileMenuOpen(false);
                    }}
                  />
                </div>

                {/* Navigation Links */}
                <div className="space-y-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTab('overview');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentTab === 'overview'
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-md'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>{t('overview')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTab('subjects');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentTab === 'subjects'
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-md'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>{t('subjects')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTab('timetable');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentTab === 'timetable'
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-md'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{t('timetable')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTab('swaps');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentTab === 'swaps'
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-md'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Repeat className="w-4 h-4" />
                      <span>{t('period_swaps')}</span>
                    </div>
                    {pendingSwapsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500 dark:bg-cyan-400 text-white dark:text-slate-950 text-[10px] font-black">
                        {pendingSwapsCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSwitchToTeacher();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-purple-600 dark:text-purple-300 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Teacher Portal View</span>
                  </button>
                </div>

                {/* Display & Language Controls inside Hamburger Menu */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-purple-500/25 space-y-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center justify-between">
                    <span>{lang === 'fr' ? 'Affichage & Préférences' : 'Preferences'}</span>
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-semibold">
                      <Radio className="w-2.5 h-2.5 animate-pulse" />
                      <span>Realtime</span>
                    </div>
                  </div>

                  {/* Language Switcher inside Drawer */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <Languages className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {lang === 'fr' ? 'Langue' : 'Language'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-purple-500/30">
                      <button
                        type="button"
                        id="drawer-language-toggle-en"
                        onClick={() => setLanguage('en')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer ${
                          lang === 'en'
                            ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        EN
                      </button>
                      <button
                        type="button"
                        id="drawer-language-toggle-fr"
                        onClick={() => setLanguage('fr')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer ${
                          lang === 'fr'
                            ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        FR
                      </button>
                    </div>
                  </div>

                  {/* Theme Switcher inside Drawer */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      {theme === 'dark' ? (
                        <Moon className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Sun className="w-4 h-4 text-amber-500" />
                      )}
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {lang === 'fr' ? 'Thème' : 'Theme'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-400">
                        {theme === 'dark' ? (lang === 'fr' ? 'Sombre' : 'Dark') : (lang === 'fr' ? 'Clair' : 'Light')}
                      </span>
                      <ThemeToggle
                        id="drawer-theme-toggle"
                        className="bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-purple-500/30 text-slate-700 dark:text-slate-200 hover:text-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Extra Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-purple-500/20">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('sign_out')}</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-purple-500/20 text-center">
                <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400 font-semibold">
                  Manager Pro • Phase 2
                </span>
              </div>
            </div>
          </>
        )}

        {/* Tab Content Canvas */}
        <main className="flex-1 p-3.5 sm:p-5 md:p-8 max-w-7xl mx-auto w-full min-w-0 no-scrollbar-mobile">
          {currentTab === 'dm_oversight' && (
            <DisciplineMasterDashboard session={session} />
          )}

          {currentTab === 'attendance' && (
            <SecretaryAttendancePortal
              session={session}
              onUpdateSession={onUpdateSession}
              onLogout={onLogout}
              onSwitchRoleView={(role) => {
                const grant = session.allGrants.find((g) => g.role === role) || {
                  ...session.activeGrant,
                  role: role as any,
                };
                onUpdateSession({ ...session, activeGrant: grant });
              }}
            />
          )}

          {currentTab === 'subjects' && (
            <SubjectsManager
              schoolId={currentSchool.id}
              levelId={currentLevel.id}
              currentRole={activeGrant.role}
            />
          )}

          {currentTab === 'timetable' && (
            <VisualTimetableBuilder
              schoolId={currentSchool.id}
              levelId={currentLevel.id}
              currentRole={activeGrant.role}
              currentAccountId={account.id}
            />
          )}

          {currentTab === 'swaps' && (
            <PeriodSwapManager
              schoolId={currentSchool.id}
              levelId={currentLevel.id}
              currentRole={activeGrant.role}
              currentAccountId={account.id}
            />
          )}

          {currentTab === 'overview' && (
            <div className="space-y-6">
              {/* Welcome & Partition Badge */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-xl shadow-xl shadow-black/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl font-extrabold text-white">
                        {lang === 'fr' ? 'Bienvenue' : 'Welcome'}, {account.full_name}
                      </span>
                      <span className="px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold font-mono">
                        {activeGrant.role}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
                      <span>{currentSchool.name}</span>
                      <span>•</span>
                      <span>{currentLevel.name} Partition</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <span>Partition Isolated</span>
                    </span>
                  </div>
                </div>

                {/* Scoped Quick Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                  <div
                    onClick={() => setCurrentTab('subjects')}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-purple-500/15 hover:border-purple-500/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-400">
                          {t('subjects')}
                        </div>
                        <div className="text-2xl font-black text-white mt-0.5">
                          {partitionSubjects.length}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setCurrentTab('timetable')}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-purple-500/15 hover:border-cyan-500/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-400">
                          {t('timetable')}
                        </div>
                        <div className="text-2xl font-black text-white mt-0.5">
                          {partitionSlots.length}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setCurrentTab('swaps')}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-purple-500/15 hover:border-indigo-500/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                        <Repeat className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-400">
                          {t('period_swaps')}
                        </div>
                        <div className="text-2xl font-black text-white mt-0.5">
                          {pendingSwapsCount}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase 2 & Phase 4 Quick Launch Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  onClick={() => setCurrentTab('dm_oversight')}
                  className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-purple-950/40 border border-purple-500/25 hover:border-purple-500/50 backdrop-blur-xl shadow-xl shadow-black/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-purple-400" />
                      <h3 className="text-sm font-extrabold text-white">
                        {t('dm_oversight')}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-purple-400/20 text-purple-300 font-mono text-[10px] font-bold">
                      Phase 4
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    Teacher pedagogy progress bars, punctuality stats, monthly hour reconciliation, and appeal resolution.
                  </div>
                  <div className="mt-3 text-xs font-bold text-purple-400 group-hover:text-purple-300 flex items-center gap-1">
                    <span>Open Oversight →</span>
                  </div>
                </div>

                <div
                  onClick={() => setCurrentTab('attendance')}
                  className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-cyan-950/40 border border-cyan-500/25 hover:border-cyan-500/50 backdrop-blur-xl shadow-xl shadow-black/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-sm font-extrabold text-white">
                        {t('attendance')}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 font-mono text-xs font-bold">
                      Daily Gate
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    Secretary period check-in against timetable with automated &gt;15 min lateness cancellation.
                  </div>
                  <div className="mt-3 text-xs font-bold text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1">
                    <span>Mark Attendance →</span>
                  </div>
                </div>

                <div
                  onClick={() => setCurrentTab('timetable')}
                  className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/80 border border-slate-800 hover:border-slate-700 backdrop-blur-xl shadow-xl shadow-black/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-sm font-extrabold text-white">
                        {t('timetable_title')}
                      </h3>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    Visual weekly schedule builder with drag-and-drop and double-booking detection.
                  </div>
                  <div className="mt-3 text-xs font-bold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1">
                    <span>Open Timetable →</span>
                  </div>
                </div>

                <div
                  onClick={() => setCurrentTab('swaps')}
                  className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/80 border border-slate-800 hover:border-slate-700 backdrop-blur-xl shadow-xl shadow-black/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Repeat className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-sm font-extrabold text-white">
                        {t('period_swaps_title')}
                      </h3>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    Teacher absence coverage workflow and peer swap approvals.
                  </div>
                  <div className="mt-3 text-xs font-bold text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1">
                    <span>Open Swaps ({pendingSwapsCount}) →</span>
                  </div>
                </div>
              </div>

              {/* Authorized Account Grants */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-xl shadow-xl shadow-black/20">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                  <span className="text-sm font-extrabold text-white">
                    Authorized Account Grants
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {allGrants.length} active grant{allGrants.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {allGrants.map((grant) => {
                    const grantLevel = schoolLevels.find((l) => l.id === grant.level_id);
                    const isCurrent =
                      grant.level_id === currentLevel.id && grant.role === activeGrant.role;

                    return (
                      <div
                        key={grant.id}
                        className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                          isCurrent
                            ? 'border-purple-500 bg-purple-950/40'
                            : 'border-white/10 bg-slate-950/50 hover:border-purple-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                              isCurrent
                                ? 'bg-gradient-to-br from-purple-600 to-cyan-500 text-white'
                                : 'bg-slate-900 border border-white/10 text-slate-400'
                            }`}
                          >
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-extrabold text-white">
                              {grantLevel?.name || 'Unknown Level'}
                            </div>
                            <div className="text-xs text-slate-400">
                              Role: <span className="font-bold text-cyan-400">{grant.role}</span>
                            </div>
                          </div>
                        </div>

                        {isCurrent ? (
                          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Active</span>
                          </span>
                        ) : (
                          grantLevel && (
                            <button
                              type="button"
                              onClick={() => handleSwitchGrant(grant, grantLevel)}
                              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer py-1 px-2.5 rounded-lg hover:bg-white/5 transition-colors"
                            >
                              Switch →
                            </button>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

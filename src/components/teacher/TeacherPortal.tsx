import React, { useState, useEffect } from 'react';
import { AuthSession, Teacher, Account, TimetableSlot, Subject } from '../../types';
import { db } from '../../lib/db';
import { useLanguage } from '../../lib/i18n';
import { TeacherNavDrawer, TeacherTab } from './TeacherNavDrawer';
import { TeacherHome } from './TeacherHome';
import { TeacherTimetable } from './TeacherTimetable';
import { TeacherLogbook } from './TeacherLogbook';
import { TeacherProfile } from './TeacherProfile';
import { TeacherPayslip } from './TeacherPayslip';
import { TeacherNotifications } from './TeacherNotifications';
import { TeacherAwards } from './TeacherAwards';
import { TeacherSettings } from './TeacherSettings';
import {
  Menu,
  Bell,
  Wifi,
  WifiOff,
  Sparkles,
  ShieldCheck,
  User,
  LogOut,
} from 'lucide-react';

interface TeacherPortalProps {
  session: AuthSession;
  onUpdateSession: (session: AuthSession) => void;
  onLogout: () => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  session,
  onUpdateSession,
  onLogout,
}) => {
  const { account, currentSchool, currentLevel } = session;
  const { t, lang, setLanguage } = useLanguage();

  const [activeTab, setActiveTab] = useState<TeacherTab>('home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  // Preselected slot when teacher clicks "Log this lesson" from schedule or timetable
  const [preselectedSlot, setPreselectedSlot] = useState<(TimetableSlot & { subject: Subject }) | null>(null);

  // Load teacher record
  const [teacher, setTeacher] = useState<(Teacher & { account: Account }) | null>(() => {
    return db.getTeacherByAccountId(account.id);
  });

  // Keep unread count and notifications in sync
  const refreshNotificationsCount = () => {
    const notifs = db.getNotificationsForAccount(account.id);
    setUnreadNotifsCount(notifs.filter((n) => !n.read).length);
  };

  useEffect(() => {
    refreshNotificationsCount();
    const unsub = db.subscribeToRealtime((event) => {
      if (event.table === 'notifications') {
        refreshNotificationsCount();
      }
    });
    return unsub;
  }, [account.id]);

  // If teacher is somehow null, fetch or fallback
  useEffect(() => {
    const tRecord = db.getTeacherByAccountId(account.id);
    if (tRecord) {
      setTeacher(tRecord);
    }
  }, [account.id]);

  if (!teacher) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center max-w-md space-y-4">
          <ShieldCheck className="w-10 h-10 text-purple-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Teacher Record Not Found</h2>
          <p className="text-xs text-slate-400">
            This account does not have an active teacher profile in this partition.
          </p>
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
          >
            {t('sign_out')}
          </button>
        </div>
      </div>
    );
  }

  const handleLogLesson = (slot?: TimetableSlot & { subject: Subject }) => {
    if (slot) {
      setPreselectedSlot(slot);
    }
    setActiveTab('logbook');
  };

  const handleUpdateTeacher = (updated: Teacher & { account: Account }) => {
    setTeacher(updated);
  };

  const adminGrant = session.allGrants?.find((g) => g.role !== 'Teacher');

  const handleSwitchToAdmin = () => {
    if (adminGrant) {
      onUpdateSession({
        ...session,
        activeGrant: adminGrant,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-900 selection:text-white flex flex-col">
      {/* Slide-out Navigation Drawer */}
      <TeacherNavDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setDrawerOpen(false);
        }}
        teacher={teacher}
        school={currentSchool}
        level={currentLevel}
        unreadNotificationsCount={unreadNotifsCount}
        onLogout={onLogout}
        isOffline={isOffline}
        onToggleOffline={() => setIsOffline((prev) => !prev)}
        canSwitchToAdmin={Boolean(adminGrant)}
        onSwitchToAdmin={handleSwitchToAdmin}
      />

      {/* Sticky Top Header Bar */}
      <header className="sticky top-0 z-40 px-4 sm:px-6 py-3.5 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between shadow-lg shadow-purple-950/10">
        {/* Left: Hamburger button + Brand */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            id="teacher-hamburger-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-purple-900/40">
              M
            </div>
            <div>
              <span className="text-sm font-extrabold text-white tracking-tight block">
                Manager Pro
              </span>
              <span className="text-[10px] font-mono font-medium text-cyan-400 block -mt-0.5">
                {currentSchool.name} • {currentLevel.name}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Offline chip, Notifications bell, Language switch, Profile avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Offline Chip */}
          <button
            type="button"
            onClick={() => setIsOffline((prev) => !prev)}
            title={isOffline ? 'Offline Mode active' : 'Online & Synchronized'}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
              isOffline
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-emerald-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            {isOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">{t('offline_indicator')}</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">{t('online_synced')}</span>
              </>
            )}
          </button>

          {/* Notifications Button with unread count */}
          <button
            type="button"
            id="header-notifications-btn"
            onClick={() => setActiveTab('notifications')}
            aria-label="Notifications"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 relative transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Language Toggle */}
          <div className="hidden sm:flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                lang === 'en'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('fr')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                lang === 'fr'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              FR
            </button>
          </div>

          {/* Profile Shortcut */}
          <button
            type="button"
            id="header-teacher-profile-btn"
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-200 text-xs font-bold overflow-hidden">
              {teacher.photo_url ? (
                <img
                  src={teacher.photo_url}
                  alt={teacher.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{teacher.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</span>
              )}
            </div>
            <span className="hidden md:inline text-xs font-bold text-white">
              {teacher.full_name.split(' ')[0]}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'home' && (
          <TeacherHome
            teacher={teacher}
            school={currentSchool}
            level={currentLevel}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onLogLesson={handleLogLesson}
            isOffline={isOffline}
            pendingSyncCount={pendingSyncCount}
          />
        )}

        {activeTab === 'timetable' && (
          <TeacherTimetable
            teacher={teacher}
            school={currentSchool}
            level={currentLevel}
            onLogLesson={handleLogLesson}
          />
        )}

        {activeTab === 'logbook' && (
          <TeacherLogbook
            teacher={teacher}
            school={currentSchool}
            level={currentLevel}
            preselectedSlot={preselectedSlot}
            onClearPreselectedSlot={() => setPreselectedSlot(null)}
            isOffline={isOffline}
          />
        )}

        {activeTab === 'profile' && (
          <TeacherProfile
            teacher={teacher}
            school={currentSchool}
            level={currentLevel}
            onUpdateTeacher={handleUpdateTeacher}
          />
        )}

        {activeTab === 'payslip' && (
          <TeacherPayslip
            teacher={teacher}
            school={currentSchool}
            level={currentLevel}
          />
        )}

        {activeTab === 'notifications' && (
          <TeacherNotifications
            teacher={teacher}
            school={currentSchool}
            level={currentLevel}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onNotificationsUpdated={refreshNotificationsCount}
          />
        )}

        {activeTab === 'awards' && (
          <TeacherAwards
            teacher={teacher}
            school={currentSchool}
            level={currentLevel}
          />
        )}

        {activeTab === 'settings' && (
          <TeacherSettings
            teacher={teacher}
            school={currentSchool}
            level={currentLevel}
            isOffline={isOffline}
            onToggleOffline={() => setIsOffline((prev) => !prev)}
            pendingSyncCount={pendingSyncCount}
          />
        )}
      </main>
    </div>
  );
};

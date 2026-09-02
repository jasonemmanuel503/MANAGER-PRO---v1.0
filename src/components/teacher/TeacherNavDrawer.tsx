import React from 'react';
import {
  Home,
  Calendar,
  BookOpen,
  User,
  FileText,
  Bell,
  Award,
  Settings,
  LogOut,
  X,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Teacher, Account, School, Level } from '../../types';
import { useLanguage } from '../../lib/i18n';
import { InfoTooltip } from '../common/InfoTooltip';

export type TeacherTab =
  | 'home'
  | 'timetable'
  | 'logbook'
  | 'profile'
  | 'payslip'
  | 'notifications'
  | 'awards'
  | 'settings';

interface TeacherNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TeacherTab;
  onSelectTab: (tab: TeacherTab) => void;
  teacher: Teacher & { account: Account };
  school: School;
  level: Level;
  unreadNotificationsCount: number;
  onLogout: () => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  canSwitchToAdmin?: boolean;
  onSwitchToAdmin?: () => void;
}

export const TeacherNavDrawer: React.FC<TeacherNavDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  teacher,
  school,
  level,
  unreadNotificationsCount,
  onLogout,
  isOffline,
  onToggleOffline,
  canSwitchToAdmin,
  onSwitchToAdmin,
}) => {
  const { t, lang, setLanguage } = useLanguage();

  const navItems: Array<{
    id: TeacherTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'home', label: t('home'), icon: Home },
    { id: 'timetable', label: t('my_timetable'), icon: Calendar },
    { id: 'logbook', label: t('logbook'), icon: BookOpen },
    { id: 'profile', label: t('my_profile'), icon: User },
    { id: 'payslip', label: t('payslip'), icon: FileText },
    { id: 'notifications', label: t('notifications'), icon: Bell, badge: unreadNotificationsCount },
    { id: 'awards', label: t('awards'), icon: Award },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Drawer */}
      <div className="relative w-full max-w-xs sm:max-w-sm h-full bg-slate-950/95 border-r border-slate-800/80 p-6 flex flex-col justify-between shadow-2xl shadow-purple-950/50 text-slate-100 z-10 overflow-y-auto">
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-purple-900/30">
                MP
              </div>
              <div>
                <span className="text-sm font-extrabold text-white tracking-tight block">
                  Manager Pro
                </span>
                <span className="text-[11px] font-semibold text-purple-400 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  Teacher Portal
                </span>
              </div>
            </div>

            <button
              type="button"
              id="teacher-drawer-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Teacher Identity Card */}
          <div className="mt-5 p-3.5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-purple-950/30 border border-slate-800/80 flex items-center gap-3.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-base shadow-inner overflow-hidden">
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
              <span
                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
                  isOffline ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                title={isOffline ? 'Offline Mode' : 'Online'}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white truncate">{teacher.full_name}</h4>
              <p className="text-[11px] font-mono text-cyan-400/90 font-medium truncate">
                {teacher.teacher_code}
              </p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {school.name} • {level.name}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1.5" aria-label="Teacher Portal Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  id={`teacher-nav-${item.id}`}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600/30 to-cyan-600/20 text-white border border-purple-500/40 shadow-sm shadow-purple-900/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1 rounded-lg ${
                        isActive
                          ? 'text-cyan-400 bg-purple-500/20'
                          : 'text-slate-500 group-hover:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.badge && item.badge > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500 text-white shadow-xs">
                        {item.badge}
                      </span>
                    ) : null}
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isActive ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Drawer Footer */}
        <div className="pt-5 border-t border-slate-800/80 space-y-3">
          {/* Quick Offline Status & Toggle */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
              {isOffline ? (
                <WifiOff className="w-4 h-4 text-amber-400" />
              ) : (
                <Wifi className="w-4 h-4 text-emerald-400" />
              )}
              <span className="flex items-center gap-1">
                {isOffline ? t('offline_indicator') : t('online_synced')}
                <InfoTooltip text={t('info_offline_banner')} />
              </span>
            </div>
            <button
              type="button"
              id="drawer-toggle-offline-btn"
              onClick={onToggleOffline}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                isOffline
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isOffline ? 'Go Online' : 'Simulate Offline'}
            </button>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Langue / Language</span>
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
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
                className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                  lang === 'fr'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                FR
              </button>
            </div>
          </div>

          {/* Academic Year & Optional Admin Switch & Logout */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>{t('academic_year')}: 2025–2026</span>
          </div>

          {canSwitchToAdmin && onSwitchToAdmin && (
            <button
              type="button"
              id="teacher-return-admin-btn"
              onClick={onSwitchToAdmin}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Switch to Admin Console</span>
            </button>
          )}

          <button
            type="button"
            id="teacher-logout-btn"
            onClick={onLogout}
            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('sign_out')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

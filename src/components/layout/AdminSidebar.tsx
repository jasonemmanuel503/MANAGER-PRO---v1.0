import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Repeat,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Layers,
  Sparkles,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { UserRole } from '../../types';
import { useLanguage } from '../../lib/i18n';

export type DashboardTab =
  | 'overview'
  | 'subjects'
  | 'timetable'
  | 'swaps'
  | 'dm_oversight'
  | 'attendance'
  | 'schema';

interface AdminSidebarProps {
  currentTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  userRole: UserRole;
  userName: string;
  userPhone: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
  pendingSwapsCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  userName,
  userPhone,
  isCollapsed,
  onToggleCollapse,
  onLogout,
  pendingSwapsCount = 0,
}) => {
  const { t } = useLanguage();

  const navItems = [
    {
      id: 'overview' as DashboardTab,
      label: t('overview'),
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'dm_oversight' as DashboardTab,
      label: t('dm_oversight'),
      icon: ShieldCheck,
      badge: null,
    },
    {
      id: 'attendance' as DashboardTab,
      label: t('attendance'),
      icon: Clock,
      badge: null,
    },
    {
      id: 'subjects' as DashboardTab,
      label: t('subjects'),
      icon: BookOpen,
      badge: null,
    },
    {
      id: 'timetable' as DashboardTab,
      label: t('timetable'),
      icon: CalendarDays,
      badge: null,
    },
    {
      id: 'swaps' as DashboardTab,
      label: t('period_swaps'),
      icon: Repeat,
      badge: pendingSwapsCount > 0 ? pendingSwapsCount : null,
    },
  ];

  return (
    <aside
      className={`relative flex flex-col justify-between h-screen bg-white/95 dark:bg-[#080c16]/95 border-r border-slate-200 dark:border-purple-500/20 backdrop-blur-2xl transition-all duration-300 z-30 shrink-0 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Brand / Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-purple-500/15">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-500 text-white font-black flex items-center justify-center text-base shadow-md shadow-purple-950/40 shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight block truncate">
                  Manager Pro
                </span>
                <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 font-mono block uppercase tracking-wider truncate">
                  Phase 2 Active
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer hidden md:flex items-center justify-center shrink-0"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1.5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <div key={item.id} className="relative group">
                <button
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-purple-900/30 font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/5'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400'
                    }`}
                  />

                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}

                  {!isCollapsed && item.badge !== null && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500 dark:bg-cyan-400 text-white dark:text-slate-950 text-[10px] font-black shrink-0">
                      {item.badge}
                    </span>
                  )}

                  {isCollapsed && item.badge !== null && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-cyan-500 dark:bg-cyan-400 ring-2 ring-white dark:ring-slate-950" />
                  )}
                </button>

                {/* Tooltip on collapsed state hover */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-900 text-white border border-purple-500/30 text-xs font-semibold whitespace-nowrap shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                    {item.label}
                    {item.badge !== null && ` (${item.badge})`}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Profile & Sign Out */}
      <div className="p-3 border-t border-slate-200 dark:border-purple-500/15 space-y-2">
        <div
          className={`p-2.5 rounded-xl bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center gap-2.5 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-600/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/40 flex items-center justify-center font-black text-xs shrink-0">
            {userName.charAt(0)}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate">{userName}</div>
              <div className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 truncate font-semibold">
                {userRole} • {userPhone}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onLogout}
          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/30 transition-all cursor-pointer ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? t('sign_out') : undefined}
          aria-label={t('sign_out')}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>{t('sign_out')}</span>}
        </button>
      </div>
    </aside>
  );
};

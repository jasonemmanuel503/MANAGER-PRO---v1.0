import React, { useState, useEffect } from 'react';
import { Teacher, Account, School, Level, Notification } from '../../types';
import { db } from '../../lib/db';
import { useLanguage } from '../../lib/i18n';
import { InfoTooltip } from '../common/InfoTooltip';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Award,
  DollarSign,
  Calendar,
  BookOpen,
  ArrowRight,
  Clock,
  Sparkles,
  Check,
} from 'lucide-react';

interface TeacherNotificationsProps {
  teacher: Teacher & { account: Account };
  school: School;
  level: Level;
  onNavigateTab: (tab: any) => void;
  onNotificationsUpdated: () => void;
}

export const TeacherNotifications: React.FC<TeacherNotificationsProps> = ({
  teacher,
  school,
  level,
  onNavigateTab,
  onNotificationsUpdated,
}) => {
  const { t, lang } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    db.getNotificationsForAccount(teacher.account_id)
  );

  const reloadNotifications = () => {
    const list = db.getNotificationsForAccount(teacher.account_id);
    setNotifications(list);
    onNotificationsUpdated();
  };

  // Subscribe to real-time events
  useEffect(() => {
    reloadNotifications();
    const unsub = db.subscribeToRealtime((event) => {
      if (event.table === 'notifications' || event.table === 'period_swaps' || event.table === 'payslips') {
        reloadNotifications();
      }
    });
    return unsub;
  }, [teacher.account_id]);

  const handleMarkAsRead = (id: string) => {
    db.markNotificationAsRead(id);
    reloadNotifications();
  };

  const handleMarkAllAsRead = () => {
    db.markAllNotificationsAsRead(teacher.account_id);
    reloadNotifications();
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'salary':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'swap':
        return <Calendar className="w-4 h-4 text-cyan-400" />;
      case 'award':
        return <Award className="w-4 h-4 text-amber-400" />;
      case 'logbook':
        return <BookOpen className="w-4 h-4 text-purple-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-xl shadow-purple-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-400" />
            <span>{t('notifications')}</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-purple-500 text-white">
                {unreadCount} {t('unread_label')}
              </span>
            )}
            <InfoTooltip text={t('info_realtime_feed')} />
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Realtime Supabase Event Stream • {school.name}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            id="mark-all-notifications-read-btn"
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('mark_all_as_read')}</span>
          </button>
        )}
      </div>

      {/* Feed List */}
      {notifications.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
          <Bell className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400">No notifications at this time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                !notif.read
                  ? 'bg-gradient-to-r from-slate-900 via-purple-950/30 to-slate-900 border-purple-500/50 shadow-md shadow-purple-950/30'
                  : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    !notif.read
                      ? 'bg-purple-500/20 border border-purple-500/30'
                      : 'bg-slate-800 border border-slate-700'
                  }`}
                >
                  {getIcon(notif.type)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white truncate">{notif.title}</h3>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{notif.body}</p>
                  <span className="text-[10px] text-slate-500 font-mono mt-2 block">
                    {new Date(notif.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {notif.link_tab && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!notif.read) handleMarkAsRead(notif.id);
                      onNavigateTab(notif.link_tab);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}

                {!notif.read && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                    title={t('mark_as_read')}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

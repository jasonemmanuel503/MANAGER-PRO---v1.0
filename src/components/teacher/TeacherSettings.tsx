import React from 'react';
import { Teacher, Account, School, Level } from '../../types';
import { useLanguage } from '../../lib/i18n';
import { InfoTooltip } from '../common/InfoTooltip';
import {
  Settings,
  Globe,
  Wifi,
  WifiOff,
  Shield,
  KeyRound,
  RefreshCw,
  Smartphone,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface TeacherSettingsProps {
  teacher: Teacher & { account: Account };
  school: School;
  level: Level;
  isOffline: boolean;
  onToggleOffline: () => void;
  pendingSyncCount: number;
}

export const TeacherSettings: React.FC<TeacherSettingsProps> = ({
  teacher,
  school,
  level,
  isOffline,
  onToggleOffline,
  pendingSyncCount,
}) => {
  const { t, lang, setLanguage } = useLanguage();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-xl shadow-purple-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400" />
            <span>{t('settings')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Personalization, Offline Cache & Security Preferences
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language Preferences */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white">{t('language')}</h2>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Choose your preferred language for interfaces, pedagogical logbooks, and bulletins.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              id="set-lang-en-btn"
              onClick={() => setLanguage('en')}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                lang === 'en'
                  ? 'bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-950/30'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>English (UK/CM)</span>
              {lang === 'en' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
            </button>

            <button
              type="button"
              id="set-lang-fr-btn"
              onClick={() => setLanguage('fr')}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                lang === 'fr'
                  ? 'bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-950/30'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>Français (Cameroun)</span>
              {lang === 'fr' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
            </button>
          </div>
        </div>

        {/* Offline & PWA Mode */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">Offline Mode & Cache</h2>
            </div>
            <InfoTooltip text={t('info_offline_banner')} />
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Log lessons while in classrooms without cellular connectivity. Entries are cryptographically queued locally and sync automatically.
          </p>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isOffline ? (
                <WifiOff className="w-5 h-5 text-amber-400" />
              ) : (
                <Wifi className="w-5 h-5 text-emerald-400" />
              )}
              <div>
                <span className="text-xs font-bold text-white block">
                  {isOffline ? t('offline_indicator') : t('online_synced')}
                </span>
                <span className="text-[11px] text-slate-400">
                  {pendingSyncCount} locally cached records
                </span>
              </div>
            </div>

            <button
              type="button"
              id="toggle-offline-mode-btn"
              onClick={onToggleOffline}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isOffline
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isOffline ? 'Switch Online' : 'Simulate Offline'}
            </button>
          </div>
        </div>

        {/* Security & PIN Policy */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Security & PIN Policy</h2>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Your 4-digit PIN is stored with PBKDF2 cryptographic hashing. It authorizes all official logbook pedagogical sign-offs.
          </p>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-purple-400" />
              <span>Teacher 4-PIN Status: Configured</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">ACTIVE</span>
          </div>
        </div>

        {/* System & Partition Info */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white">Partition & Academic Scope</h2>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">School Tenant:</span>
              <span className="font-bold text-white">{school.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Operating Partition:</span>
              <span className="font-bold text-cyan-400">{level.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Academic Year:</span>
              <span className="font-bold text-white">2025–2026</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Edition:</span>
              <span className="font-mono text-purple-400 font-semibold">Teacher Suite v3.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

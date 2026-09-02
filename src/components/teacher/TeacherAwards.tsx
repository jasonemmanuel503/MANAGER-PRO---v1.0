import React from 'react';
import { Teacher, Account, School, Level, Award as AwardType } from '../../types';
import { db } from '../../lib/db';
import { useLanguage } from '../../lib/i18n';
import { InfoTooltip } from '../common/InfoTooltip';
import {
  Award,
  Trophy,
  Calendar,
  Sparkles,
  DollarSign,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface TeacherAwardsProps {
  teacher: Teacher & { account: Account };
  school: School;
  level: Level;
}

export const TeacherAwards: React.FC<TeacherAwardsProps> = ({
  teacher,
  school,
  level,
}) => {
  const { t, lang } = useLanguage();
  const awards = db.getAwardsForTeacher(teacher.id);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-xl shadow-purple-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>{t('awards_title')}</span>
            <InfoTooltip text={t('info_awards_readonly')} />
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {school.name} • {level.name} • Academic Honors & Distinctions
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{awards.length} Distinctions on Record</span>
        </div>
      </div>

      {/* Awards List */}
      {awards.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
          <Award className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400">{t('no_awards_yet')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {awards.map((award) => (
            <div
              key={award.id}
              className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/40 shadow-xl shadow-amber-950/10 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                    {award.term}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-white leading-snug">
                  {award.title}
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {award.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 space-y-2">
                {award.bonus_amount && award.bonus_amount > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t('bonus_stipend')}:</span>
                    </span>
                    <span className="font-extrabold text-emerald-400 font-mono">
                      +{award.bonus_amount.toLocaleString()} FCFA
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span className="truncate">Awarded by {award.awarded_by}</span>
                  <span className="font-mono">{award.awarded_date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Readonly info notice */}
      <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Awards are ratified by the Academic Council and recorded in official school archives.</span>
        </span>
        <InfoTooltip text={t('info_awards_readonly')} />
      </div>
    </div>
  );
};

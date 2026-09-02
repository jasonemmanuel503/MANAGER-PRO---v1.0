import React, { useState } from 'react';
import { Teacher, Account, School, Level } from '../../types';
import { db } from '../../lib/db';
import { useLanguage } from '../../lib/i18n';
import { InfoTooltip } from '../common/InfoTooltip';
import {
  User,
  Phone,
  Camera,
  Shield,
  Briefcase,
  GraduationCap,
  Save,
  CheckCircle2,
  Lock,
  Building,
  DollarSign,
} from 'lucide-react';

interface TeacherProfileProps {
  teacher: Teacher & { account: Account };
  school: School;
  level: Level;
  onUpdateTeacher: (updated: Teacher & { account: Account }) => void;
}

export const TeacherProfile: React.FC<TeacherProfileProps> = ({
  teacher,
  school,
  level,
  onUpdateTeacher,
}) => {
  const { t, lang } = useLanguage();
  const [phoneNumber, setPhoneNumber] = useState(teacher.phone_number || '');
  const [photoUrl, setPhotoUrl] = useState(teacher.photo_url || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updated = db.updateTeacherContact(teacher.id, {
        phone_number: phoneNumber.trim(),
        photo_url: photoUrl.trim() || null,
      });

      onUpdateTeacher(updated);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
      }, 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-xl shadow-purple-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <User className="w-5 h-5 text-purple-400" />
            <span>{t('my_profile')}</span>
            <InfoTooltip text={t('info_contract_readonly')} />
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {school.name} • {level.name} • {teacher.teacher_code}
          </p>
        </div>

        {savedSuccess && (
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('profile_saved')}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Editable Contact */}
        <div className="lg:col-span-1 p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600/30 to-cyan-600/20 border-2 border-purple-500/40 flex items-center justify-center text-purple-200 text-2xl font-black shadow-lg shadow-purple-950/40 overflow-hidden relative group">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={teacher.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{teacher.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</span>
              )}
            </div>

            <h2 className="text-lg font-bold text-white mt-3">{teacher.full_name}</h2>
            <p className="text-xs font-mono text-cyan-400 font-semibold">{teacher.teacher_code}</p>
            <span className="mt-1.5 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {teacher.contract_type === 'permanent' ? t('permanent') : t('part_time')}
            </span>
          </div>

          <form onSubmit={handleSaveContact} className="space-y-4 pt-4 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
              Editable Contact Details
            </span>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-purple-400" />
                <span>{t('contact_phone')}</span>
              </label>
              <input
                type="tel"
                required
                id="profile-phone-input"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+237 670 000 007"
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span>Profile Photo URL</span>
              </label>
              <input
                type="url"
                id="profile-photo-url-input"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
            </div>

            <button
              type="submit"
              id="save-profile-contact-btn"
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-purple-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? t('loading') : t('save')}</span>
            </button>
          </form>
        </div>

        {/* Right Columns: Read-Only Recruitment & Contract Terms */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Official Recruitment & Contract Terms</span>
                <InfoTooltip text={t('info_contract_readonly')} />
              </h3>
            </div>
            <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
              <Lock className="w-3 h-3" />
              Read-Only
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                <span>{t('qualification')}</span>
              </span>
              <p className="text-sm font-bold text-white">{teacher.qualification || 'DIPES II / Master'}</p>
              <span className="text-[10px] text-slate-500">Verified by Ministry of Secondary Education</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t('department_label')}</span>
              </span>
              <p className="text-sm font-bold text-white">{teacher.department}</p>
              <span className="text-[10px] text-slate-500">Academic Faculty Assignment</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('contract_type_label')}</span>
              </span>
              <p className="text-sm font-bold text-white">
                {teacher.contract_type === 'permanent' ? 'Permanent Full-Time Contract' : 'Part-Time / Visiting Lecturer'}
              </p>
              <span className="text-[10px] text-slate-500">10-Month Academic Schedule</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('compensation_rate')}</span>
              </span>
              <p className="text-sm font-bold text-emerald-300">
                {teacher.base_salary ? `${teacher.base_salary.toLocaleString()} FCFA / month` : '250,000 FCFA base'}
              </p>
              <span className="text-[10px] text-slate-500">+ 2,500 FCFA per extra / substitution period</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 block">
              {t('subjects_taught')}
            </span>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Mathematics (Form 4, Form 5, Lower Sixth)
              </span>
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Further Mathematics (Form 5 Science)
              </span>
            </div>
          </div>

          {/* Readonly info notice using InfoTooltip design */}
          <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-500 shrink-0" />
              <span>{t('recruitment_notice')}</span>
            </span>
            <InfoTooltip text={t('info_contract_readonly')} />
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Building2, Layers, ShieldCheck, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { EducationLevelType, AuthSession } from '../../types';
import { db } from '../../lib/db';

interface OnboardingFlowProps {
  onComplete: (session: AuthSession) => void;
  onCancel?: () => void;
}

const ALL_LEVELS: EducationLevelType[] = [
  'Nursery',
  'Primary',
  'Secondary',
  'Higher Institution',
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Question 1: School Name & Prefix
  const [schoolName, setSchoolName] = useState('');
  const [teacherPrefix, setTeacherPrefix] = useState('');

  // Question 2: Education Levels
  const [selectedLevels, setSelectedLevels] = useState<EducationLevelType[]>(['Secondary']);

  // Question 3: Founder / Principal Account
  const [founderName, setFounderName] = useState('');
  const [founderPhone, setFounderPhone] = useState('');
  const [founderPin, setFounderPin] = useState('');
  const [founderLevels, setFounderLevels] = useState<EducationLevelType[]>(['Secondary']);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Derive acronym from school name
  const handleSchoolNameChange = (name: string) => {
    setSchoolName(name);
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      const acronym = words
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .substring(0, 5);
      setTeacherPrefix(acronym);
    } else if (words.length === 1 && words[0].length >= 3) {
      setTeacherPrefix(words[0].substring(0, 3).toUpperCase());
    }
  };

  // Step 1 Validation & Next
  const handleStep1Next = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!schoolName.trim()) {
      setError('Enter school name to continue.');
      return;
    }
    if (!teacherPrefix.trim()) {
      setError('Enter teacher ID prefix.');
      return;
    }
    setError(null);
    setStep(2);
  };

  // Step 2 Validation & Next
  const handleStep2Next = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedLevels.length === 0) {
      setError('Select at least one education level.');
      return;
    }
    setError(null);
    setFounderLevels(selectedLevels);
    setStep(3);
  };

  // Toggle level selection in Step 2
  const toggleLevel = (lvl: EducationLevelType) => {
    setError(null);
    if (selectedLevels.includes(lvl)) {
      if (selectedLevels.length === 1) return; // keep at least 1
      setSelectedLevels(selectedLevels.filter((l) => l !== lvl));
    } else {
      setSelectedLevels([...selectedLevels, lvl]);
    }
  };

  // Step 3 Submit
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!founderName.trim()) {
      setError('Enter full name.');
      return;
    }
    if (!founderPhone.trim()) {
      setError('Enter phone number.');
      return;
    }
    if (founderPin.trim().length !== 6) {
      setError('Founder role requires a 6-digit security PIN.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await db.registerSchoolOnboarding({
        schoolName,
        teacherPrefix,
        levels: selectedLevels,
        founderFullName: founderName,
        founderPhone,
        founderPin,
        founderLevels,
      });

      const firstLevel = result.levels[0];
      const activeGrant = result.grants.find((g) => g.level_id === firstLevel.id) || result.grants[0];

      onComplete({
        account: result.founderAccount,
        activeGrant,
        allGrants: result.grants,
        currentSchool: result.school,
        currentLevel: firstLevel,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to complete onboarding.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto py-6 px-4">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8 px-2">
        {[1, 2, 3].map((num) => (
          <div key={num} className="flex items-center flex-1 last:flex-none">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                step === num
                  ? 'bg-gradient-to-br from-orange-600 to-orange-700 text-white ring-4 ring-orange-500/20 shadow-md shadow-orange-600/30'
                  : step > num
                  ? 'bg-lime-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              {step > num ? <Check className="w-4 h-4 stroke-[3]" /> : num}
            </div>
            {num < 3 && (
              <div
                className={`h-1 flex-1 mx-3 rounded-full transition-colors ${
                  step > num ? 'bg-lime-700' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-600 dark:text-rose-400 hover:text-rose-900 font-bold ml-2 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* QUESTION 1: School Name */}
      {step === 1 && (
        <form onSubmit={handleStep1Next} className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0 shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                What is the school name?
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                School Name
              </label>
              <input
                id="onboarding-school-name-input"
                type="text"
                autoFocus
                required
                value={schoolName}
                onChange={(e) => handleSchoolNameChange(e.target.value)}
                placeholder="e.g. Sacred Heart College"
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-base text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Teacher Code Prefix
              </label>
              <input
                id="onboarding-prefix-input"
                type="text"
                required
                maxLength={6}
                value={teacherPrefix}
                onChange={(e) => setTeacherPrefix(e.target.value.toUpperCase())}
                placeholder="e.g. SHC"
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono tracking-wider text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 shadow-2xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            ) : (
              <div />
            )}
            <button
              type="submit"
              id="onboarding-step-1-next"
              className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white text-sm font-bold rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-md shadow-orange-700/25 hover:shadow-lg transition-all"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* QUESTION 2: Education Levels */}
      {step === 2 && (
        <form onSubmit={handleStep2Next} className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0 shadow-xs">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Which education levels are operated?
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {ALL_LEVELS.map((lvl) => {
              const isSelected = selectedLevels.includes(lvl);
              return (
                <button
                  key={lvl}
                  type="button"
                  id={`onboarding-level-${lvl.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => toggleLevel(lvl)}
                  className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer shadow-xs ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/70 dark:bg-orange-950/40 ring-1 ring-orange-500/30 shadow-md shadow-orange-950/10'
                      : 'border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-800/60 hover:border-orange-300'
                  }`}
                >
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{lvl}</span>
                  <div
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-lime-700 border-lime-700 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="submit"
              id="onboarding-step-2-next"
              className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white text-sm font-bold rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-md shadow-orange-700/25 hover:shadow-lg transition-all"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* QUESTION 3: Founder / Principal Account */}
      {step === 3 && (
        <form onSubmit={handleFinalSubmit} className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Create the Founder / Principal Account
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                id="onboarding-founder-name-input"
                type="text"
                required
                value={founderName}
                onChange={(e) => setFounderName(e.target.value)}
                placeholder="e.g. Dr. Paul Enow or Mme. Lum"
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number
              </label>
              <input
                id="onboarding-founder-phone-input"
                type="tel"
                required
                value={founderPhone}
                onChange={(e) => setFounderPhone(e.target.value)}
                placeholder="+237 6XXXXXXXX"
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Security PIN (6 Digits)
              </label>
              <input
                id="onboarding-founder-pin-input"
                type="password"
                maxLength={6}
                pattern="[0-9]*"
                inputMode="numeric"
                required
                value={founderPin}
                onChange={(e) => setFounderPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono tracking-widest text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 shadow-2xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="submit"
              id="onboarding-finish-button"
              disabled={submitting}
              className="px-6 py-2.5 bg-gradient-to-r from-lime-700 to-lime-800 hover:from-lime-800 hover:to-lime-900 disabled:opacity-50 text-white text-sm font-bold rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-md shadow-lime-900/25 hover:shadow-lg transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? 'Initializing...' : 'Complete Foundation Setup'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

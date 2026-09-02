import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, Lock, Phone, UserCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Level, UserRole, HIGH_SECURITY_ROLES, AuthSession, School } from '../../types';
import { db } from '../../lib/db';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: School;
  level: Level;
  onLoginSuccess: (session: AuthSession) => void;
}

const ROLES_ORDER: UserRole[] = [
  'Founder',
  'Principal',
  'VP',
  'DM',
  'Secretary',
  'Finance',
  'Teacher',
];

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  school,
  level,
  onLoginSuccess,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset state when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setSelectedRole(null);
      setPhoneNumber('');
      setPin('');
      setError(null);
      setShowPin(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isHighSecurityRole = selectedRole ? HIGH_SECURITY_ROLES.includes(selectedRole) : false;
  const requiredPinLength = isHighSecurityRole ? 6 : 4;

  // Handle role selection
  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
    setPin('');

    // Pre-populate with seed account for this role if available to make testing seamless
    const grants = db.getGrantsForSchoolLevel(school.id, level.id);
    const grantForRole = grants.find((g) => g.role === role);
    if (grantForRole) {
      const acc = db.getAccounts().find((a) => a.id === grantForRole.account_id);
      if (acc) {
        setPhoneNumber(acc.phone_number);
        // Default seed pins
        if (role === 'Founder') setPin('123456');
        else if (role === 'Principal') setPin('654321');
        else if (role === 'VP') setPin('112233');
        else if (role === 'DM') setPin('1234');
        else if (role === 'Secretary') setPin('4321');
        else if (role === 'Finance') setPin('889900');
        else if (role === 'Teacher') setPin('7788');
      }
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setError(null);
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    if (pin.trim().length !== requiredPinLength) {
      setError(`This role requires a ${requiredPinLength}-digit PIN.`);
      return;
    }

    setLoading(true);
    try {
      const authResult = await db.authenticate(
        phoneNumber,
        pin,
        school.id,
        level.id,
        selectedRole
      );
      onLoginSuccess({
        account: authResult.account,
        activeGrant: authResult.activeGrant,
        allGrants: authResult.allGrants,
        currentSchool: authResult.school,
        currentLevel: authResult.level,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="login-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        id="login-modal-container"
        className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-orange-950/20 dark:shadow-black/80 border border-white/50 dark:border-white/10 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-orange-100/60 dark:border-white/10 flex items-center justify-between bg-orange-50/30 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            {selectedRole && (
              <button
                type="button"
                id="back-to-roles-button"
                onClick={() => {
                  setSelectedRole(null);
                  setError(null);
                }}
                className="p-1.5 -ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-orange-100/50 dark:hover:bg-slate-800 transition-colors"
                aria-label="Back to roles list"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <span className="text-base font-bold text-slate-900 dark:text-white block leading-tight">
                {selectedRole ? `${selectedRole} Login` : 'Select Your Role'}
              </span>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {school.name} • {level.name}
              </div>
            </div>
          </div>

          <button
            type="button"
            id="close-login-modal-button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-orange-100/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div
              id="login-error-alert"
              className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          {!selectedRole ? (
            /* Roles selection list */
            <div className="space-y-2">
              {ROLES_ORDER.map((role) => {
                const isHigh = HIGH_SECURITY_ROLES.includes(role);

                return (
                  <button
                    key={role}
                    type="button"
                    id={`role-btn-${role.toLowerCase()}`}
                    onClick={() => handleSelectRole(role)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-800/60 hover:border-orange-500/50 hover:bg-orange-50/50 dark:hover:bg-slate-800 text-left transition-all flex items-center justify-between group cursor-pointer shadow-xs hover:shadow-md"
                  >
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      {role}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isHigh
                          ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60'
                          : 'bg-lime-50 dark:bg-lime-950/40 text-lime-700 dark:text-lime-400 border border-lime-200 dark:border-lime-800/60'
                      }`}
                    >
                      {isHigh ? '6-Digit PIN' : '4-Digit PIN'}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Phone Number + PIN fields */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="login-phone-input"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+237 6XXXXXXXX"
                    required
                    className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 font-mono shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  PIN Code ({requiredPinLength} Digits)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="login-pin-input"
                    type={showPin ? 'text' : 'password'}
                    maxLength={requiredPinLength}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder={`•`.repeat(requiredPinLength)}
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 text-center shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((prev) => !prev)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5"
                    aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="submit-login-button"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 active:from-orange-800 active:to-orange-900 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-orange-700/25 hover:shadow-lg disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{loading ? 'Authenticating...' : `Sign In as ${selectedRole}`}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

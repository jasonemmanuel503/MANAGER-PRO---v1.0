import React, { useState } from 'react';
import { School, Level, AuthSession } from '../../types';
import { db } from '../../lib/db';
import { LoginModal } from './LoginModal';
import { School as SchoolIcon, Layers, PlusCircle, KeyRound, Menu, X, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

interface LandingScreenProps {
  onLoginSuccess: (session: AuthSession) => void;
  onStartOnboarding: () => void;
  onOpenSchemaModal?: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onLoginSuccess,
  onStartOnboarding,
  onOpenSchemaModal,
}) => {
  const schools = db.getSchools();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    schools[0]?.id || ''
  );
  const [modalLevel, setModalLevel] = useState<Level | null>(null);
  const [showQuickCredentials, setShowQuickCredentials] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const currentSchool = schools.find((s) => s.id === selectedSchoolId) || schools[0];
  const operatedLevels = currentSchool ? db.getLevelsForSchool(currentSchool.id) : [];

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top Glassmorphic Navigation */}
      <header className="glass-bar sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between border-b border-orange-200/50 dark:border-white/10 shadow-md shadow-orange-950/5 dark:shadow-black/40">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-600 to-orange-700 dark:from-orange-500 dark:to-orange-700 flex items-center justify-center text-white font-black text-lg shadow-md shadow-orange-600/30">
            M
          </div>
          <div>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Manager Pro
            </span>
          </div>
        </div>

        {/* Desktop Navigation elements (hidden on mobile and tablet) */}
        <div className="hidden lg:flex items-center gap-3">
          {schools.length > 1 && (
            <div className="flex items-center gap-2 mr-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tenant</span>
              <select
                id="select-school-tenant-desktop"
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white/90 dark:bg-slate-800/90 border border-orange-200/70 dark:border-white/10 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-xs cursor-pointer"
              >
                {schools.map((sch) => (
                  <option key={sch.id} value={sch.id}>
                    {sch.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            id="start-onboarding-btn"
            onClick={onStartOnboarding}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-md shadow-orange-700/25 hover:shadow-lg transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Onboard School</span>
          </button>

          <ThemeToggle />
        </div>

        {/* Mobile + Tablet Hamburger Toggle & Theme Icon */}
        <div className="flex lg:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            id="mobile-nav-hamburger"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-xl border border-orange-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:text-orange-600 cursor-pointer shadow-xs transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile + Tablet 100% Glassmorphic Navigation Drawer Revealing from Right */}
      {isMobileMenuOpen && (
        <>
          {/* Blur Backdrop covering everything under the nav drawer */}
          <div
            id="mobile-nav-backdrop"
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/40 dark:bg-black/60 backdrop-blur-md transition-opacity duration-300"
            aria-hidden="true"
          />

          {/* Nav Drawer: 100% height, 40-50% width on tablet/mobile */}
          <div
            id="mobile-nav-drawer"
            className="fixed top-0 right-0 bottom-0 z-50 h-full w-[50vw] sm:w-[45vw] min-w-[280px] max-w-[420px] glass-nav-drawer p-6 flex flex-col justify-between animate-slide-in-right overflow-y-auto"
          >
            <div>
              {/* Drawer Top Header with Close Button */}
              <div className="flex items-center justify-between pb-4 border-b border-orange-200/50 dark:border-white/10 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    M
                  </div>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Menu
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-orange-100/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Actions */}
              <div className="space-y-4">
                {schools.length > 1 && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Select School
                    </label>
                    <select
                      id="select-school-tenant-mobile"
                      value={selectedSchoolId}
                      onChange={(e) => {
                        setSelectedSchoolId(e.target.value);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-xs bg-white/90 dark:bg-slate-800/90 border border-orange-200/70 dark:border-white/10 rounded-xl font-semibold text-slate-800 dark:text-slate-200 shadow-xs"
                    >
                      {schools.map((sch) => (
                        <option key={sch.id} value={sch.id}>
                          {sch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  id="mobile-onboard-btn"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onStartOnboarding();
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-orange-700/25 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Onboard School</span>
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-orange-200/50 dark:border-white/10 text-center">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Manager Pro
              </span>
            </div>
          </div>
        </>
      )}

      {/* Main Content Area - blurred when mobile nav is active */}
      <main
        className={`flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full transition-all duration-300 ${
          isMobileMenuOpen ? 'blur-xs pointer-events-none select-none' : ''
        }`}
      >
        {/* School Tenant Card with Glassmorphism & Layered Border Shadow */}
        <div className="w-full glass-card-prominent rounded-3xl p-6 sm:p-8 mb-6 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-orange-100/70 dark:border-white/10 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-xs">
                <SchoolIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {currentSchool.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {operatedLevels.length} Operated Level{operatedLevels.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            </div>

            {schools.length > 1 && (
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Switch School:
                </span>
                <select
                  id="select-school-tenant"
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white/90 dark:bg-slate-800/90 border border-orange-200/70 dark:border-white/10 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-xs cursor-pointer"
                >
                  {schools.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Operated Education Levels List */}
          <div className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Education Level to Enter
              </span>

              <button
                type="button"
                id="toggle-test-creds-button"
                onClick={() => setShowQuickCredentials((prev) => !prev)}
                className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 inline-flex items-center gap-1.5 cursor-pointer py-1 px-2.5 rounded-lg hover:bg-orange-50 dark:hover:bg-slate-800 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{showQuickCredentials ? 'Hide Demo Logins' : 'View Demo Logins'}</span>
              </button>
            </div>

            {/* Level Action Cards with Glassmorphism, Deep Contrast, and Smooth Hover Effects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {operatedLevels.map((lvl) => (
                <div
                  key={lvl.id}
                  className="p-5 rounded-2xl border border-orange-200/70 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-md shadow-orange-950/5 dark:shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:shadow-2xl hover:shadow-orange-600/15 dark:hover:shadow-[0_15px_35px_rgba(249,115,22,0.25)] hover:border-orange-500/80 dark:hover:border-orange-400 hover:-translate-y-1 transition-all duration-300 ease-out text-left group flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/15 dark:bg-orange-500/30 border border-orange-500/30 dark:border-orange-500/50 flex items-center justify-center text-orange-600 dark:text-orange-300 group-hover:bg-orange-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-orange-600/30 transition-all duration-300 shadow-xs">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors block">
                        {lvl.name}
                      </span>
                      <div className="text-xs font-semibold text-orange-700/80 dark:text-orange-300/90 mt-0.5 font-mono">
                        {currentSchool.teacher_id_prefix}-{lvl.name.substring(0, 3).toUpperCase()} Partition
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    id={`select-level-btn-${lvl.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => setModalLevel(lvl)}
                    className="px-4 py-2.5 rounded-xl bg-lime-700/15 dark:bg-lime-950/80 text-lime-800 dark:text-lime-300 border border-lime-600/40 dark:border-lime-500/60 hover:bg-lime-700 hover:text-white dark:hover:bg-lime-600 dark:hover:text-white dark:hover:border-lime-400 text-xs font-extrabold inline-flex items-center gap-2 transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md hover:shadow-lime-700/30 hover:scale-105 group-hover:translate-x-0.5"
                  >
                    <span>Enter</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Demo Credentials Panel */}
            {showQuickCredentials && (
              <div className="mt-6 p-5 rounded-2xl glass-card border border-orange-200/60 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 animate-in fade-in duration-150">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white mb-3 pb-2 border-b border-orange-100 dark:border-white/10">
                  <span>Pre-configured Demo Accounts ({currentSchool.name})</span>
                  <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                    Auto-filled on role selection
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 font-mono text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-orange-100/80 dark:border-white/10 shadow-xs">
                    <div className="font-bold text-slate-900 dark:text-white">Founder (6-PIN: 123456)</div>
                    <div className="text-slate-500 dark:text-slate-400">+237670000001 (Dr. Enow)</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-orange-100/80 dark:border-white/10 shadow-xs">
                    <div className="font-bold text-slate-900 dark:text-white">Principal (6-PIN: 654321)</div>
                    <div className="text-slate-500 dark:text-slate-400">+237670000002 (Mrs. Lum)</div>
                    <div className="text-[10px] text-lime-700 dark:text-lime-400 font-sans font-semibold mt-0.5">
                      Multi-level grant (Sec & Pri)
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-orange-100/80 dark:border-white/10 shadow-xs">
                    <div className="font-bold text-slate-900 dark:text-white">VP (6-PIN: 112233)</div>
                    <div className="text-slate-500 dark:text-slate-400">+237670000003 (Mr. Ngu)</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-orange-100/80 dark:border-white/10 shadow-xs">
                    <div className="font-bold text-slate-900 dark:text-white">DM (4-PIN: 1234)</div>
                    <div className="text-slate-500 dark:text-slate-400">+237670000004 (Mr. Eto)</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-orange-100/80 dark:border-white/10 shadow-xs">
                    <div className="font-bold text-slate-900 dark:text-white">Secretary (4-PIN: 4321)</div>
                    <div className="text-slate-500 dark:text-slate-400">+237670000005 (Ms. Bi)</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-orange-100/80 dark:border-white/10 shadow-xs">
                    <div className="font-bold text-slate-900 dark:text-white">Finance (6-PIN: 889900)</div>
                    <div className="text-slate-500 dark:text-slate-400">+237670000006 (Mr. Mbarga)</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-orange-100/80 dark:border-white/10 shadow-xs sm:col-span-2 md:col-span-1">
                    <div className="font-bold text-slate-900 dark:text-white">Teacher (4-PIN: 7788)</div>
                    <div className="text-slate-500 dark:text-slate-400">+237670000007 (Mr. Tabi)</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Glassmorphic Footer */}
      <footer
        className={`py-4 text-center border-t border-orange-100/60 dark:border-white/5 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md transition-all duration-300 ${
          isMobileMenuOpen ? 'blur-xs pointer-events-none select-none' : ''
        }`}
      >
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Manager Pro
        </span>
      </footer>

      {/* Login Modal with Glassmorphism and Deep Colors */}
      {modalLevel && currentSchool && (
        <LoginModal
          isOpen={Boolean(modalLevel)}
          onClose={() => setModalLevel(null)}
          school={currentSchool}
          level={modalLevel}
          onLoginSuccess={onLoginSuccess}
        />
      )}
    </div>
  );
};

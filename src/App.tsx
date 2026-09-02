import React, { useState, useEffect } from 'react';
import { AuthSession } from './types';
import { LandingScreen } from './components/auth/LandingScreen';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { FoundationDashboard } from './components/dashboard/FoundationDashboard';
import { TeacherPortal } from './components/teacher/TeacherPortal';
import { SecretaryAttendancePortal } from './components/secretary/SecretaryAttendancePortal';
import { SchemaInspectorModal } from './components/schema/SchemaInspectorModal';
import { ArrowLeft, Menu, X } from 'lucide-react';
import { ThemeProvider } from './lib/theme';
import { ThemeToggle } from './components/common/ThemeToggle';

const SESSION_KEY = 'manager_pro_session';

function AppContent() {
  const [session, setSession] = useState<AuthSession | null>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [mobileOnboardingMenuOpen, setMobileOnboardingMenuOpen] = useState(false);

  // Sync session to sessionStorage
  useEffect(() => {
    try {
      if (session) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // ignore
    }
  }, [session]);

  const handleLoginSuccess = (newSession: AuthSession) => {
    setSession(newSession);
    setIsOnboarding(false);
  };

  const handleLogout = () => {
    setSession(null);
  };

  const handleUpdateSession = (updatedSession: AuthSession) => {
    setSession(updatedSession);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-slate-50 to-lime-50/25 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100 selection:bg-orange-200 dark:selection:bg-orange-950 selection:text-orange-950 dark:selection:text-orange-100 transition-colors duration-200">
      {/* If User is Authenticated */}
      {session ? (
        session.activeGrant.role === 'Teacher' ? (
          <TeacherPortal
            session={session}
            onUpdateSession={handleUpdateSession}
            onLogout={handleLogout}
          />
        ) : session.activeGrant.role === 'Secretary' ? (
          <SecretaryAttendancePortal
            session={session}
            onUpdateSession={handleUpdateSession}
            onLogout={handleLogout}
            onSwitchRoleView={(role) => {
              const matchingGrant = session.allGrants.find((g) => g.role === role) || {
                ...session.activeGrant,
                role: role as any,
              };
              handleUpdateSession({
                ...session,
                activeGrant: matchingGrant,
              });
            }}
          />
        ) : (
          <FoundationDashboard
            session={session}
            onUpdateSession={handleUpdateSession}
            onLogout={handleLogout}
            onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
          />
        )
      ) : isOnboarding ? (
        /* Conversational Onboarding Flow */
        <div className="min-h-screen flex flex-col justify-between">
          <header className="glass-bar sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b border-orange-200/40 dark:border-white/10 shadow-md shadow-orange-950/5 dark:shadow-black/40">
            <div className="flex items-center gap-3">
              <button
                type="button"
                id="onboarding-back-btn"
                onClick={() => setIsOnboarding(false)}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                aria-label="Back to landing"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-600 to-orange-700 flex items-center justify-center text-white font-black text-sm shadow-xs">
                  M
                </div>
                <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Manager Pro • School Onboarding
                </span>
              </div>
            </div>

            {/* Desktop Nav Items */}
            <div className="hidden lg:flex items-center gap-3">
              <ThemeToggle />
            </div>

            {/* Mobile & Tablet Hamburger Toggle */}
            <div className="flex lg:hidden items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                id="onboarding-hamburger-toggle"
                onClick={() => setMobileOnboardingMenuOpen((prev) => !prev)}
                aria-label="Toggle navigation menu"
                className="p-2 rounded-xl border border-orange-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:text-orange-600 cursor-pointer shadow-xs"
              >
                {mobileOnboardingMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </header>

          {/* Mobile & Tablet Right-Revealing Glassmorphic Drawer */}
          {mobileOnboardingMenuOpen && (
            <>
              {/* Blur Backdrop */}
              <div
                id="onboarding-mobile-backdrop"
                onClick={() => setMobileOnboardingMenuOpen(false)}
                className="fixed inset-0 z-40 bg-slate-950/40 dark:bg-black/60 backdrop-blur-md transition-opacity duration-300"
                aria-hidden="true"
              />

              <div
                id="onboarding-mobile-nav-panel"
                className="fixed top-0 right-0 bottom-0 z-50 h-full w-[50vw] sm:w-[45vw] min-w-[280px] max-w-[420px] glass-nav-drawer p-6 flex flex-col justify-between animate-slide-in-right overflow-y-auto"
              >
                <div>
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-orange-200/50 dark:border-white/10 mb-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                        M
                      </div>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Onboarding Menu
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMobileOnboardingMenuOpen(false)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-orange-100/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      aria-label="Close menu"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOnboardingMenuOpen(false);
                        setIsOnboarding(false);
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-orange-200/50 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 text-center cursor-pointer transition-colors"
                    >
                      Return to School Selection
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-orange-200/50 dark:border-white/10 text-center">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Manager Pro
                  </span>
                </div>
              </div>
            </>
          )}

          <main
            className={`flex-1 flex items-center justify-center p-4 transition-all duration-300 ${
              mobileOnboardingMenuOpen ? 'blur-xs pointer-events-none select-none' : ''
            }`}
          >
            <OnboardingFlow
              onComplete={handleLoginSuccess}
              onCancel={() => setIsOnboarding(false)}
            />
          </main>

          <footer
            className={`py-4 text-center border-t border-orange-100/60 dark:border-white/5 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md transition-all duration-300 ${
              mobileOnboardingMenuOpen ? 'blur-xs pointer-events-none select-none' : ''
            }`}
          >
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Manager Pro
            </span>
          </footer>
        </div>
      ) : (
        /* Landing Screen with Level Select and Login Modal */
        <LandingScreen
          onLoginSuccess={handleLoginSuccess}
          onStartOnboarding={() => setIsOnboarding(true)}
          onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
        />
      )}

      {/* PostgreSQL & RLS Schema Inspector Modal */}
      <SchemaInspectorModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

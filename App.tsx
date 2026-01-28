
import React, { useState, useEffect } from 'react';
import { AppStep, UserProfile, SearchSession } from './types';
import { ICONS } from './constants';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import AuthScreen from './components/AuthScreen';

const DB_KEY_PREFIX = 'jobflow_user_';

const App: React.FC = () => {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => localStorage.getItem('jobflow_current_user'));
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [step, setStep] = useState<AppStep>('auth');
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  // Load profile when auth changes or component mounts
  useEffect(() => {
    if (currentUserEmail) {
      const saved = localStorage.getItem(DB_KEY_PREFIX + currentUserEmail);
      if (saved) {
        setProfile(JSON.parse(saved));
        setStep('dashboard');
      } else {
        setStep('onboarding');
      }
    } else {
      setStep('auth');
    }
  }, [currentUserEmail]);

  // Persist profile changes to local storage "database"
  useEffect(() => {
    if (profile && currentUserEmail) {
      localStorage.setItem(DB_KEY_PREFIX + currentUserEmail, JSON.stringify(profile));
    }
  }, [profile, currentUserEmail]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.theme = newTheme ? 'dark' : 'light';
  };

  const handleLogin = (user: { email: string, name: string }) => {
    setCurrentUserEmail(user.email);
    localStorage.setItem('jobflow_current_user', user.email);
    
    // Check if profile already exists for this email
    const saved = localStorage.getItem(DB_KEY_PREFIX + user.email);
    if (saved) {
      setProfile(JSON.parse(saved));
      setStep('dashboard');
    } else {
      setStep('onboarding');
    }
  };

  const handleLogout = () => {
    setCurrentUserEmail(null);
    setProfile(null);
    localStorage.removeItem('jobflow_current_user');
    setStep('auth');
  };

  const handleOnboardingComplete = (resumeData: any) => {
    const newProfile: UserProfile = {
      id: `user-${Date.now()}`,
      email: currentUserEmail || undefined,
      resumeText: resumeData.text,
      resumeSourceType: resumeData.source,
      history: []
    };
    setProfile(newProfile);
    setStep('dashboard');
  };

  const updateHistory = (session: SearchSession) => {
    if (!profile) return;
    setProfile({
      ...profile,
      history: [session, ...profile.history] // Newest search first
    });
  };

  const markJobInteraction = (sessionId: string, jobId: string) => {
    if (!profile) return;
    const now = Date.now();
    const newHistory = profile.history.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          results: session.results.map(job => 
            job.id === jobId ? { ...job, clicked: true, lastInteractedAt: now } : job
          )
        };
      }
      return session;
    });
    setProfile({ ...profile, history: newHistory });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-18 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => profile && setStep('dashboard')}>
            <div className="bg-indigo-600 dark:bg-indigo-500 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              {ICONS.Briefcase}
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter text-slate-900 dark:text-white leading-none">JobFlow AI</span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Intelligence Layer</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              {isDark ? ICONS.Sun : ICONS.Moon}
            </button>
            {profile && (
              <div className="flex items-center gap-3 pl-4 border-l border-slate-100 dark:border-slate-800">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-xs font-black text-slate-900 dark:text-white">{currentUserEmail}</span>
                  <span className="text-[9px] text-indigo-500 uppercase font-black tracking-widest">Permanent Account</span>
                </div>
                <button onClick={handleLogout} className="px-4 py-2 text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all uppercase tracking-widest">
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-8">
        {step === 'auth' && <AuthScreen onLogin={handleLogin} />}
        {step === 'onboarding' && <Onboarding onComplete={handleOnboardingComplete} />}
        {step === 'dashboard' && profile && (
          <Dashboard 
            profile={profile} 
            onSearchSave={updateHistory}
            onJobClick={markJobInteraction}
            onBack={() => setStep('onboarding')}
          />
        )}
      </main>

      <footer className="py-12 text-center border-t border-slate-100 dark:border-slate-900 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em]">
          &copy; 2024 JobFlow AI • Secured Intelligence Framework
        </p>
      </footer>
    </div>
  );
};

export default App;

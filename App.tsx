
import React, { useState, useEffect } from 'react';
import { AppStep, UserProfile, SearchSession } from './types';
import { ICONS } from './constants';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import AuthScreen from './components/AuthScreen';
import ProfilePage from './components/ProfilePage';
import { storage } from './services/storageService';

const App: React.FC = () => {
  const [authUid, setAuthUid] = useState<string | null>(() => localStorage.getItem('jobflow_auth_uid'));
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [step, setStep] = useState<AppStep>('auth');
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    if (authUid) {
      const savedProfile = storage.getProfile(authUid);
      if (savedProfile) {
        setProfile(savedProfile);
        setStep(savedProfile.resumeText ? 'dashboard' : 'onboarding');
      } else {
        // Fallback for missing profile
        setStep('auth');
      }
    } else {
      setStep('auth');
    }
  }, [authUid]);

  useEffect(() => {
    if (profile) {
      storage.saveProfile(profile);
    }
  }, [profile]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.theme = newTheme ? 'dark' : 'light';
  };

  const handleGoogleLogin = (user: { uid: string, email: string, displayName: string, photoURL: string }) => {
    localStorage.setItem('jobflow_auth_uid', user.uid);
    const existing = storage.getProfile(user.uid);
    if (!existing) {
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        history: [],
      };
      storage.saveProfile(newProfile);
      setProfile(newProfile);
    } else {
      setProfile({
        ...existing,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });
    }
    setAuthUid(user.uid);
  };

  const handleLogout = () => {
    localStorage.removeItem('jobflow_auth_uid');
    setAuthUid(null);
    setProfile(null);
    setStep('auth');
  };

  const handleOnboardingComplete = (resumeData: any) => {
    if (!profile) return;
    setProfile({
      ...profile,
      resumeText: resumeData.text,
      resumeUrl: resumeData.source === 'url' ? resumeData.text : undefined,
      resumeSourceType: resumeData.source,
    });
    setStep('dashboard');
  };

  const updateHistory = (session: SearchSession) => {
    if (!profile) return;
    setProfile({
      ...profile,
      history: [session, ...profile.history]
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
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => profile?.resumeText && setStep('dashboard')}>
            <div className="bg-indigo-600 dark:bg-indigo-500 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              {ICONS.Briefcase}
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter text-slate-900 dark:text-white leading-none">JobFlow AI</span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Global Radar</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              {isDark ? ICONS.Sun : ICONS.Moon}
            </button>
            {profile && (
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
                <button 
                  onClick={() => setStep('profile')}
                  className="flex items-center gap-2 group"
                >
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-black text-slate-900 dark:text-white">{profile.displayName || 'User Profile'}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Settings</div>
                  </div>
                  <img 
                    src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName || 'User'}&background=random`} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-xl border-2 border-slate-100 dark:border-slate-800 group-hover:border-indigo-500 transition-all"
                  />
                </button>
                <button 
                  onClick={handleLogout} 
                  className="p-2.5 text-slate-400 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  {ICONS.X}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-8">
        {step === 'auth' && <AuthScreen onLogin={handleGoogleLogin} />}
        {step === 'onboarding' && <Onboarding onComplete={handleOnboardingComplete} />}
        {step === 'dashboard' && profile && (
          <Dashboard 
            profile={profile} 
            onSearchSave={updateHistory}
            onJobClick={markJobInteraction}
            onBack={() => setStep('onboarding')}
          />
        )}
        {step === 'profile' && profile && (
          <ProfilePage 
            profile={profile} 
            onUpdate={(updated) => { setProfile(updated); setStep('dashboard'); }} 
            onBack={() => setStep('dashboard')}
            onLogout={handleLogout}
          />
        )}
      </main>

      <footer className="py-12 text-center border-t border-slate-100 dark:border-slate-900 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em]">
          &copy; 2024 JobFlow AI • Intelligent Search Engine
        </p>
      </footer>
    </div>
  );
};

export default App;

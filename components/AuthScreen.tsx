
import React, { useState } from 'react';
import { ICONS } from '../constants';

interface AuthScreenProps {
  onLogin: (user: { uid: string, email: string, displayName: string, photoURL: string }) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleGoogleAuth = () => {
    setIsConnecting(true);
    // Simulate Google OAuth flow
    setTimeout(() => {
      onLogin({
        uid: 'google-user-' + Math.random().toString(36).substr(2, 9),
        email: 'career.explorer@gmail.com',
        displayName: 'Alex Sterling',
        photoURL: 'https://i.pravatar.cc/150?u=alexsterling'
      });
      setIsConnecting(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="w-24 h-24 bg-indigo-600 text-white rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/40 relative group">
        <div className="absolute inset-0 bg-indigo-400 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
        <div className="relative z-10 scale-125">
          {ICONS.Shield}
        </div>
      </div>
      <h1 className="text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter leading-none">
        Elevate Your<br/><span className="text-indigo-600 dark:text-indigo-400">Career Orbit</span>
      </h1>
      <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 leading-relaxed font-medium max-w-lg mx-auto">
        Access the elite global job discovery engine. Authenticate via Google to sync your career database.
      </p>
      
      <div className="w-full max-w-sm">
        <button
          onClick={handleGoogleAuth}
          disabled={isConnecting}
          className="w-full group relative flex items-center justify-center gap-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-black py-5 px-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 transition-all transform active:scale-95 overflow-hidden"
        >
          {isConnecting ? (
            <div className="animate-spin h-5 w-5 border-3 border-indigo-600 border-t-transparent rounded-full" />
          ) : (
            <>
              <svg className="w-6 h-6" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span className="text-sm uppercase tracking-widest">Sign In with Google</span>
            </>
          )}
        </button>
        <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Secured by JobFlow Intelligence
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;

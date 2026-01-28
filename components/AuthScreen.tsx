
import React, { useState } from 'react';
import { ICONS } from '../constants';

interface AuthScreenProps {
  onLogin: (user: { email: string, name: string }) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && name) {
      onLogin({ email, name });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/40">
        {ICONS.Shield}
      </div>
      <h1 className="text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">
        Secure Orchestration
      </h1>
      <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 leading-relaxed font-medium">
        Enter your details to initialize your persistent career database. 
        Your search history and profile analysis will be stored permanently.
      </p>
      
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="space-y-1 text-left">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</label>
          <input 
            type="text" 
            required
            className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 outline-none transition-all text-sm"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1 text-left">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</label>
          <input 
            type="email" 
            required
            className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 outline-none transition-all text-sm"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-8 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all transform active:scale-95 text-sm uppercase tracking-widest mt-2"
        >
          <img src="https://www.google.com/favicon.ico" className="w-4 h-4 brightness-0 invert" alt="Google" />
          Join with Google
        </button>
      </form>
    </div>
  );
};

export default AuthScreen;

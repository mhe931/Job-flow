
import React, { useState } from 'react';
import { ResumeSourceType } from '../types';
import { ICONS } from '../constants';

interface OnboardingProps {
  onComplete: (data: { text: string, source: ResumeSourceType }, analysis: any) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [resumeUrl, setResumeUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const handleNext = async () => {
    if (!resumeUrl || !resumeUrl.startsWith('http')) {
      setError('Please provide a valid professional resume URL.');
      return;
    }
    setIsAnalyzing(true);
    setTimeout(() => {
      onComplete({ text: resumeUrl, source: 'url' }, {});
      setIsAnalyzing(false);
    }, 1200);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-3">
        <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">Career Intelligence Hub</h2>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Provide your professional resume link. Our AI will analyze your digital footprint to orchestrate your next career move.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-10">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              {ICONS.ExternalLink}
            </div>
            <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Resume Asset Link</label>
          </div>
          
          <div className="space-y-4">
            <input 
              type="url" 
              className="w-full px-8 py-6 rounded-3xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-all text-lg font-medium"
              placeholder="https://linkedin.com/in/yourprofile"
              value={resumeUrl}
              onChange={(e) => {
                setResumeUrl(e.target.value);
                if (error) setError('');
              }}
            />
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              {ICONS.Shield}
              <p className="text-[10px] font-black uppercase tracking-widest">Encrypted Direct Link Processing Enabled</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-3xl text-xs font-black uppercase text-center border border-red-100 dark:border-red-900/30">
            {error}
          </div>
        )}

        <button 
          onClick={handleNext}
          disabled={isAnalyzing}
          className={`w-full py-6 rounded-3xl font-black text-white text-lg transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-3 ${
            isAnalyzing ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin h-5 w-5 border-3 border-white/30 border-t-white rounded-full" />
              Initializing Scraper...
            </>
          ) : (
            <>
              Orchestrate Career Pipeline {ICONS.Zap}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;

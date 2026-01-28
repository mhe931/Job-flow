
import React, { useState } from 'react';
import { ResumeSourceType } from '../types';
import { ICONS } from '../constants';

interface OnboardingProps {
  onComplete: (data: { text: string, source: ResumeSourceType }, analysis: any) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [resumeContent, setResumeContent] = useState('');
  const [sourceType, setSourceType] = useState<ResumeSourceType>('upload');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setResumeContent(event.target?.result as string);
      reader.readAsText(file);
    }
  };

  const handleNext = async () => {
    if (!resumeContent) {
      setError('Please provide your resume content.');
      return;
    }
    setIsAnalyzing(true);
    // Onboarding just captures content now, dashboard handles deep analysis
    setTimeout(() => {
      onComplete({ text: resumeContent, source: sourceType }, {});
      setIsAnalyzing(false);
    }, 800);
  };

  const SourceTab = ({ id, label, icon }: { id: ResumeSourceType, label: string, icon: any }) => (
    <button
      onClick={() => { setSourceType(id); setResumeContent(''); }}
      className={`flex-1 flex flex-col items-center gap-3 py-6 px-2 rounded-3xl border-2 transition-all ${
        sourceType === id 
          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-indigo-400' 
          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200'
      }`}
    >
      <span className={sourceType === id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}>{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-3">
        <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">Your Career Intelligence Hub</h2>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Upload your credentials. Our agent will orchestrate a high-fidelity market scan based on your specific DNA.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-10">
        <div className="space-y-4">
          <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Orchestration Source</label>
          <div className="flex gap-4">
            <SourceTab id="upload" label="Local Upload" icon={ICONS.PlusCircle} />
            <SourceTab id="paste" label="Raw Text" icon={ICONS.FileText} />
            <SourceTab id="url" label="Web URL" icon={ICONS.Search} />
          </div>
        </div>

        <div className="min-h-[200px]">
          {sourceType === 'upload' && (
            <div className="relative border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-12 text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-pointer group bg-slate-50/50 dark:bg-slate-800/50">
              <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept=".txt,.md" />
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors shadow-sm">
                  {ICONS.PlusCircle}
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900 dark:text-white">
                    {resumeContent ? 'Asset Ready' : 'Identify Resume Asset'}
                  </p>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Accepting MD & TXT</p>
                </div>
              </div>
            </div>
          )}

          {sourceType === 'paste' && (
            <textarea 
              className="w-full h-64 px-6 py-5 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-all text-sm font-medium resize-none"
              placeholder="Inject your core experience narrative here..."
              value={resumeContent}
              onChange={(e) => setResumeContent(e.target.value)}
            />
          )}

          {sourceType === 'url' && (
            <div className="space-y-4">
              <input 
                type="url" 
                className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-all"
                placeholder="https://linkedin.com/in/architect"
                value={resumeContent}
                onChange={(e) => setResumeContent(e.target.value)}
              />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest ml-1">Live Profile Scraping Enabled</p>
            </div>
          )}
        </div>

        {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-black uppercase text-center">{error}</div>}

        <button 
          onClick={handleNext}
          disabled={isAnalyzing}
          className={`w-full py-6 rounded-3xl font-black text-white text-lg transition-all shadow-xl shadow-indigo-600/20 active:scale-95 ${
            isAnalyzing ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isAnalyzing ? 'Initializing Agent...' : 'Orchestrate Career Pipeline'}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;

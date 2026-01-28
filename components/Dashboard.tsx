
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, SearchSession, JobResult } from '../types';
import { ICONS } from '../constants';
import { analyzeResume, discoverJobs, validateJobUrl } from '../services/geminiService';

const getCountryFlag = (countryName: string) => {
  const name = countryName.toLowerCase();
  if (name.includes('united states') || name.includes('usa')) return '🇺🇸';
  if (name.includes('united kingdom') || name.includes('uk')) return '🇬🇧';
  if (name.includes('germany')) return '🇩🇪';
  if (name.includes('netherlands')) return '🇳🇱';
  if (name.includes('canada')) return '🇨🇦';
  if (name.includes('remote')) return '🌐';
  if (name.includes('singapore')) return '🇸🇬';
  if (name.includes('australia')) return '🇦🇺';
  if (name.includes('switzerland')) return '🇨🇭';
  if (name.includes('india')) return '🇮🇳';
  if (name.includes('france')) return '🇫🇷';
  if (name.includes('japan')) return '🇯🇵';
  if (name.includes('ireland')) return '🇮🇪';
  if (name.includes('sweden')) return '🇸🇪';
  if (name.includes('brazil')) return '🇧🇷';
  if (name.includes('spain')) return '🇪🇸';
  return '📍';
};

const ScoreBadge = ({ value, label, type }: { value: number, label: string, type: 'match' | 'prob' }) => {
  const color = value > 85 ? 'text-emerald-600' : value > 70 ? 'text-blue-600' : 'text-slate-500';
  const bg = value > 85 ? 'bg-emerald-50' : value > 70 ? 'bg-blue-50' : 'bg-slate-50';
  
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${bg} ${color} text-[10px] font-bold border border-current opacity-80`}>
      <span className="uppercase tracking-tighter">{label}:</span>
      <span>{value}%</span>
    </div>
  );
};

interface DashboardProps {
  profile: UserProfile;
  onSearchSave: (session: SearchSession) => void;
  onJobClick: (sessionId: string, jobId: string) => void;
  onBack: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ profile, onSearchSave, onJobClick, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [verifyingUrls, setVerifyingUrls] = useState(false);
  const [isHomeMode, setIsHomeMode] = useState(!profile.history.length);
  const [config, setConfig] = useState<{ countries: string[], titles: string[] } | null>(null);
  
  const [selectedCountries, setSelectedCountries] = useState<string[]>(profile.suggestedCountries || []);
  const [selectedTitles, setSelectedTitles] = useState<string[]>(profile.targetTitles || []);
  
  const [activeSessionId, setActiveSessionId] = useState<string | null>(profile.history[0]?.id || null);
  const [selectedJob, setSelectedJob] = useState<{ job: JobResult, sessionId: string } | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!profile.resumeText) return;
      setLoading(true);
      try {
        const analysis = await analyzeResume(profile.resumeText, profile.resumeSourceType || 'url');
        setConfig(analysis);
        if (selectedCountries.length === 0) setSelectedCountries(analysis.countries.slice(0, 3));
        if (selectedTitles.length === 0) setSelectedTitles(analysis.titles.slice(0, 3));
      } catch (err) {
        console.error("Analysis failed", err);
      } finally {
        setLoading(false);
      }
    };
    if (!config) fetchConfig();
  }, [profile.resumeText]);

  useEffect(() => {
    profile.suggestedCountries = selectedCountries;
    profile.targetTitles = selectedTitles;
  }, [selectedCountries, selectedTitles]);

  const handleSearch = async () => {
    if (!profile.resumeText) return;
    setLoading(true);
    setIsHomeMode(false);
    try {
      const results = await discoverJobs(selectedCountries, selectedTitles, profile.resumeText);
      
      setVerifyingUrls(true);
      const validatedResults: JobResult[] = [];
      for (const job of results) {
        const isValid = await validateJobUrl(job.url);
        if (isValid) validatedResults.push({ ...job, isValidated: true });
      }
      setVerifyingUrls(false);

      const session: SearchSession = {
        id: `session-${Date.now()}`,
        timestamp: Date.now(),
        countries: selectedCountries,
        targetTitles: selectedTitles,
        results: validatedResults
      };
      onSearchSave(session);
      setActiveSessionId(session.id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setVerifyingUrls(false);
    }
  };

  const activeSession = profile.history.find(s => s.id === activeSessionId) || profile.history[0];

  const sortedJobs = useMemo(() => {
    if (!activeSession) return [];
    return [...activeSession.results].sort((a, b) => {
      if (a.clicked === b.clicked) {
        return b.hiringProbability - a.hiringProbability;
      }
      return a.clicked ? 1 : -1;
    });
  }, [activeSession]);

  const handleVisit = (sessionId: string, jobId: string, url: string) => {
    onJobClick(sessionId, jobId);
    window.open(url, '_blank');
  };

  const copyUrl = (sessionId: string, jobId: string, url: string) => {
    navigator.clipboard.writeText(url);
    onJobClick(sessionId, jobId);
  };

  if (isHomeMode && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-12 animate-in fade-in zoom-in-95 duration-700">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-4 rounded-[2rem] shadow-2xl">
              {ICONS.Briefcase}
            </div>
            <h1 className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter">JobFlow</h1>
          </div>
          <p className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.4em] ml-20">Global Intelligence</p>
        </div>

        <div className="w-full max-w-2xl space-y-8">
          <div className="relative group">
            <div className="absolute inset-y-0 left-6 flex items-center text-slate-400 group-focus-within:text-indigo-600 transition-colors">
              {ICONS.Search}
            </div>
            <div className="w-full h-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-lg group-hover:shadow-2xl transition-all flex items-center px-16 group-focus-within:ring-4 group-focus-within:ring-indigo-500/10 group-focus-within:border-indigo-500/50">
              <span className="text-slate-900 dark:text-white font-medium truncate">
                Scouting {selectedTitles.length} roles in {selectedCountries.length} hubs...
              </span>
            </div>
            <button 
              onClick={() => setIsHomeMode(false)}
              className="absolute inset-y-0 right-4 flex items-center px-4 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 my-2 rounded-full transition-all"
            >
              Adjust
            </button>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={handleSearch}
              className="px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent hover:border-slate-300 transition-all"
            >
              JobFlow Search
            </button>
            <button 
              onClick={handleSearch}
              className="px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent hover:border-slate-300 transition-all"
            >
              I'm Feeling Productive
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col animate-in fade-in duration-500 min-h-screen">
      {/* Sticky Google-style Search Bar */}
      <div className="sticky top-[72px] z-40 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 -mx-8 px-8 py-4 mb-8">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center gap-8">
          <div className="hidden lg:flex items-center gap-2 cursor-pointer" onClick={() => setIsHomeMode(true)}>
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">JobFlow</span>
          </div>

          <div className="flex-1 w-full max-w-3xl relative group">
             <div className="absolute inset-y-0 left-5 flex items-center text-slate-400">
               {ICONS.Search}
             </div>
             <input 
              readOnly 
              onClick={() => setIsHomeMode(true)}
              className="w-full h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm hover:shadow-md px-14 text-sm text-slate-900 dark:text-white outline-none cursor-pointer transition-all"
              value={`${selectedTitles.join(', ')} in ${selectedCountries.join(', ')}`}
             />
             <div className="absolute inset-y-0 right-4 flex items-center gap-2">
               {loading && <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full" />}
               <button onClick={handleSearch} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition-colors">
                 {ICONS.Zap}
               </button>
             </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Market Results</span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{activeSession?.results.length || 0} discovered</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        {/* Sidebar for Filters/Metadata */}
        <aside className="w-full lg:w-72 shrink-0 space-y-8 animate-in slide-in-from-left-4 duration-700">
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Applied Filters</h4>
            <div className="space-y-3">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Countries</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCountries.map(c => <span key={c} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-md text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700">{getCountryFlag(c)} {c}</span>)}
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Titles</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTitles.map(t => <span key={t} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-md text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700">{t}</span>)}
                  </div>
                </div>
              </div>
              <button onClick={() => setIsHomeMode(true)} className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all border border-dashed border-indigo-200 dark:border-indigo-900/50">
                Modify Search Matrix
              </button>
            </div>
          </div>

          <div className="bg-indigo-600/5 dark:bg-indigo-400/5 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
            <h5 className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest mb-2">Recruiter Insight</h5>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
              "We've verified these links using our real-time audit engine. Focus on 'Elite Alignment' for highest success."
            </p>
          </div>
        </aside>

        {/* Main SERP-style Results */}
        <main className="flex-1 max-w-4xl space-y-10">
          {loading && (
            <div className="space-y-12 py-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-4 animate-pulse">
                  <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  <div className="h-20 w-full bg-slate-100 dark:bg-slate-900 rounded-2xl" />
                </div>
              ))}
            </div>
          )}

          {activeSession && !loading && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {sortedJobs.map(job => {
                const isNew = Date.now() - job.timestamp < 24 * 60 * 60 * 1000;
                return (
                  <article 
                    key={job.id} 
                    className={`group relative space-y-2 transition-all ${job.clicked ? 'opacity-50 grayscale' : 'opacity-100'}`}
                  >
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5 font-medium">
                        {getCountryFlag(job.country)} {job.country}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">{job.company}</span>
                      <span>•</span>
                      <span className="font-medium">{job.postedAt}</span>
                      {isNew && !job.clicked && (
                        <span className="ml-2 px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-black rounded-sm uppercase tracking-widest animate-pulse">New Find</span>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <h3 
                        onClick={() => setSelectedJob({ job, sessionId: activeSession.id })}
                        className="text-xl font-bold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer tracking-tight"
                      >
                        {job.role}
                      </h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        <ScoreBadge value={job.matchScore} label="Match" type="match" />
                        <ScoreBadge value={job.hiringProbability} label="Hire Prob" type="prob" />
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl line-clamp-2 italic">
                      {job.jd}
                    </p>

                    <div className="flex items-center gap-4 pt-1">
                      <button 
                        onClick={() => handleVisit(activeSession.id, job.id, job.url)}
                        className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center gap-2"
                      >
                        Source Portal {ICONS.ExternalLink}
                      </button>
                      <button 
                        onClick={() => copyUrl(activeSession.id, job.id, job.url)}
                        className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center gap-2"
                      >
                        {ICONS.Copy} Secure
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {activeSession?.results.length === 0 && !loading && (
            <div className="py-20 text-center space-y-4">
              <p className="text-slate-500 dark:text-slate-400 italic">No exact matches found for the current matrix.</p>
              <button onClick={() => setIsHomeMode(true)} className="text-indigo-600 font-bold hover:underline">Refine Parameters</button>
            </div>
          )}
        </main>
      </div>

      {/* Modal / Preview Overlay */}
      {selectedJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedJob(null)}>
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3 text-xs text-slate-400 uppercase font-black tracking-widest">
                  {getCountryFlag(selectedJob.job.country)} {selectedJob.job.country} • {selectedJob.job.company} • {selectedJob.job.postedAt}
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{selectedJob.job.role}</h3>
              </div>
              <button onClick={() => setSelectedJob(null)} className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-full transition-all">
                {ICONS.X}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 space-y-12">
              <div className="grid grid-cols-2 gap-8">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-8 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Technical Ecosystem Audit</span>
                  <div className="text-4xl font-black text-indigo-600">{selectedJob.job.matchScore}%</div>
                  <p className="text-xs text-slate-500 mt-2">Based on inferred technical DNA mapping from your resume asset.</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-8 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Predictive Hiring Prob</span>
                  <div className="text-4xl font-black text-blue-600">{selectedJob.job.hiringProbability}%</div>
                  <p className="text-xs text-slate-500 mt-2">Adjusted for regional competition and current market trajectory.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Intelligence Summary</h4>
                <div className="text-xl text-slate-700 dark:text-slate-300 leading-relaxed font-medium italic border-l-4 border-indigo-500 pl-8 py-2">
                  "{selectedJob.job.jd}"
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex gap-4">
              <button 
                onClick={() => handleVisit(selectedJob.sessionId, selectedJob.job.id, selectedJob.job.url)}
                className="flex-1 bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all uppercase text-xs tracking-widest"
              >
                Access Portal {ICONS.ExternalLink}
              </button>
              <button 
                onClick={() => copyUrl(selectedJob.sessionId, selectedJob.job.id, selectedJob.job.url)}
                className="px-10 py-5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-black rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm uppercase text-xs tracking-widest"
              >
                {ICONS.Copy} Secure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

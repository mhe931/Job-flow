
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

const Gauge = ({ value, size = 64, strokeWidth = 6, label }: { value: number, size?: number, strokeWidth?: number, label: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const color = value > 85 ? 'text-indigo-600 dark:text-indigo-400' : value > 70 ? 'text-blue-500' : 'text-slate-400';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-slate-100 dark:text-slate-800" />
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={`${color} transition-all duration-1000 ease-out`} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-slate-900 dark:text-white">
          {value}%
        </span>
      </div>
      <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-tighter text-center leading-tight mt-0.5">{label}</span>
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
  const [showFilters, setShowFilters] = useState(true);
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
      setShowFilters(false);
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
    alert('Link secured and copied.');
  };

  const ChecklistSection = ({ title, items, selected, onSetSelected, categoryKey }: { title: string, items: string[], selected: string[], onSetSelected: (val: string[]) => void, categoryKey: string }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredItems = useMemo(() => items.filter(item => item.toLowerCase().includes(searchTerm.toLowerCase())), [items, searchTerm]);

    const handleAdd = () => {
      const val = searchTerm.trim();
      if (val) {
        if (config) {
          const category = categoryKey as keyof typeof config;
          if (!config[category].includes(val)) {
            const updated = { ...config, [category]: [val, ...config[category]] };
            setConfig(updated);
          }
        }
        if (!selected.includes(val)) onSetSelected([val, ...selected]);
        setSearchTerm('');
      }
    };

    return (
      <div className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{title}</h4>
          <div className="flex gap-3">
            <button onClick={() => onSetSelected([...new Set([...selected, ...items])])} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">All</button>
            <button onClick={() => onSetSelected([])} className="text-[10px] font-black text-slate-400 uppercase hover:underline">None</button>
          </div>
        </div>
        <div className="relative group">
          <input 
            type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={`Filter ${title.toLowerCase()}...`}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all pr-12 text-slate-900 dark:text-white"
          />
          <button onClick={handleAdd} className="absolute right-3 top-2.5 text-indigo-600 dark:text-indigo-400 p-1 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm">{ICONS.PlusCircle}</button>
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {filteredItems.map(item => (
            <label key={item} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer group transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
              <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${selected.includes(item) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 group-hover:border-indigo-500/30'}`}>
                {selected.includes(item) && <div className="w-2 h-2 bg-white rounded-full scale-110" />}
              </div>
              <input type="checkbox" checked={selected.includes(item)} onChange={() => onSetSelected(selected.includes(item) ? selected.filter(i => i !== item) : [...selected, item])} className="hidden" />
              <span className={`text-[13px] font-bold transition-colors truncate ${selected.includes(item) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>{item}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700 pb-32">
      {/* Search & Header Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl sticky top-20 z-40">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`flex items-center gap-4 px-8 py-4.5 rounded-[1.75rem] font-black text-xs uppercase tracking-[0.15em] transition-all shadow-sm ${showFilters ? 'bg-indigo-600 text-white shadow-indigo-600/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            {ICONS.Filter} {showFilters ? 'Hide Parameters' : 'Search Control'}
          </button>
          <div className="hidden sm:block">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Global Discovery</h2>
            <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest mt-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              Recruiter-Level Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {loading && (
            <div className="flex items-center gap-4 px-6 py-3.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl text-[11px] font-black uppercase tracking-widest animate-pulse border border-indigo-100 dark:border-indigo-900/30">
              {verifyingUrls ? ICONS.Shield : ICONS.Zap} {verifyingUrls ? 'Integrity Audit...' : 'Syncing Hubs...'}
            </div>
          )}
          {activeSession && !loading && (
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Radar Session</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white mt-1">{activeSession.results.length} Verifiable Opportunities Found</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 items-start relative">
        {/* Sidebar Filters */}
        <div className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] sticky top-48 ${showFilters ? 'w-full lg:w-[420px] opacity-100 scale-100' : 'w-0 lg:w-0 opacity-0 scale-95 pointer-events-none overflow-hidden'}`}>
          <div className="space-y-8 p-1">
            <div className="bg-slate-50/50 dark:bg-slate-800/20 rounded-[3.5rem] border border-slate-200/50 dark:border-slate-800/50 p-8 shadow-inner space-y-8">
              <button 
                onClick={handleSearch}
                disabled={loading}
                className="w-full py-7 bg-indigo-600 dark:bg-indigo-500 text-white rounded-[2.25rem] font-black text-sm shadow-2xl shadow-indigo-600/40 hover:bg-indigo-700 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-4 group"
              >
                {loading ? <div className="animate-spin h-6 w-6 border-2 border-white/30 border-t-white rounded-full" /> : ICONS.Zap}
                <span className="uppercase tracking-[0.2em]">{loading ? 'Engaging Agents...' : 'Engage Search Radar'}</span>
              </button>

              {config ? (
                <>
                  <ChecklistSection title="Target Hubs" items={config.countries} selected={selectedCountries} onSetSelected={setSelectedCountries} categoryKey="countries" />
                  <ChecklistSection title="Optimized Roles" items={config.titles} selected={selectedTitles} onSetSelected={setSelectedTitles} categoryKey="titles" />
                </>
              ) : (
                <div className="py-24 text-center space-y-6">
                  <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full mx-auto animate-spin shadow-sm"></div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Hydrating Regional Metadata...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Results Column */}
        <div className="flex-1 space-y-8 w-full min-w-0">
          {!activeSession && !loading && (
            <div className="bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-200 dark:border-slate-800 p-40 text-center space-y-10 shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/20 to-transparent dark:from-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="w-32 h-32 bg-slate-50 dark:bg-slate-800 rounded-[3rem] flex items-center justify-center mx-auto text-slate-300 dark:text-slate-600 border border-slate-100 dark:border-slate-800 shadow-sm relative z-10 transition-transform group-hover:scale-110">
                {ICONS.Search}
              </div>
              <div className="space-y-6 relative z-10">
                <h2 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">Radar Idle</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium text-xl italic leading-relaxed">Customize your market deployment hubs and initiate a scan to secure opportunities.</p>
              </div>
            </div>
          )}

          {loading && !verifyingUrls && (
            <div className="space-y-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-[4rem] p-20 h-96 animate-pulse border border-slate-100 dark:border-slate-800 shadow-sm" />
              ))}
            </div>
          )}

          {activeSession && !loading && (
            <div className="space-y-8 w-full animate-in fade-in slide-in-from-bottom-6 duration-1000">
              <div className="flex flex-col gap-8 w-full">
                {sortedJobs.map(job => {
                  const isNew = Date.now() - job.timestamp < 24 * 60 * 60 * 1000;
                  return (
                    <div 
                      key={job.id}
                      onClick={() => setSelectedJob({ job, sessionId: activeSession.id })}
                      className={`bg-white dark:bg-slate-900 rounded-[4rem] p-12 md:p-16 border-2 transition-all group relative overflow-hidden flex flex-col md:flex-row gap-16 shadow-xl cursor-pointer ${
                        job.clicked 
                          ? 'border-slate-100 dark:border-slate-800 opacity-60 filter grayscale shadow-none translate-y-3' 
                          : 'border-white dark:border-slate-800 hover:border-indigo-600/30 hover:shadow-2xl hover:-translate-y-2'
                      }`}
                    >
                      {isNew && !job.clicked && (
                        <div className="absolute top-8 right-8 flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/30 animate-in zoom-in-50 duration-500">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                          New Find
                        </div>
                      )}

                      <div className="md:w-64 shrink-0 flex flex-col items-center justify-center gap-10 bg-slate-50/80 dark:bg-slate-800/40 rounded-[3.5rem] p-12 border border-slate-100 dark:border-slate-800 transition-all group-hover:bg-white dark:group-hover:bg-slate-800">
                        <Gauge value={job.hiringProbability} size={100} strokeWidth={10} label="Hire Prob" />
                        <Gauge value={job.matchScore} size={80} strokeWidth={8} label="Tech Fit" />
                      </div>

                      <div className="flex-1 space-y-8">
                        <div className="space-y-6">
                          <div className="flex flex-wrap items-center gap-4">
                            <span className="flex items-center gap-3 px-6 py-2.5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-full text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 shadow-sm">
                              {getCountryFlag(job.country)} {job.country}
                            </span>
                            {job.matchScore > 88 && (
                              <span className="px-6 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 rounded-full text-[11px] font-black uppercase tracking-widest shadow-sm">
                                Elite Alignment
                              </span>
                            )}
                          </div>
                          <div className="space-y-3">
                            <h3 className={`text-5xl font-black tracking-tighter leading-none transition-colors ${job.clicked ? 'text-slate-400' : 'text-slate-900 dark:text-white group-hover:text-indigo-600'}`}>
                              {job.role}
                            </h3>
                            <p className="text-3xl font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-tighter leading-none">
                              {job.company}
                            </p>
                          </div>
                        </div>
                        <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-3">
                          {job.jd}
                        </p>
                      </div>

                      <div className="md:w-80 shrink-0 flex flex-col justify-center gap-5">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleVisit(activeSession.id, job.id, job.url); }}
                          className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[12px] font-black uppercase tracking-[0.2em] py-8 rounded-[2.5rem] text-center hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95"
                        >
                          Access Portal {ICONS.ExternalLink}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); copyUrl(activeSession.id, job.id, job.url); }}
                          className="w-full py-6 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 rounded-[2rem] transition-all border border-slate-100 dark:border-slate-700 hover:border-indigo-500/30 text-[11px] font-black uppercase tracking-[0.1em]"
                        >
                          {ICONS.Copy} Track Resource
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Job Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 md:p-16 bg-slate-950/60 backdrop-blur-3xl animate-in fade-in duration-500" onClick={() => setSelectedJob(null)}>
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-6xl max-h-[95vh] rounded-[4.5rem] border border-slate-200 dark:border-slate-800 shadow-[0_40px_100px_-15px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-16 duration-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-16 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
              <div className="flex items-center gap-8">
                <span className="text-6xl filter drop-shadow-md">{getCountryFlag(selectedJob.job.country)}</span>
                <div className="space-y-2">
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{selectedJob.job.role}</h3>
                  <p className="text-indigo-600 dark:text-indigo-400 font-black uppercase text-xl tracking-widest">
                    {selectedJob.job.company} • {selectedJob.job.country}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedJob(null)} className="p-7 bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-[2.5rem] transition-all transform hover:rotate-90 shadow-sm border border-slate-100 dark:border-slate-700">
                {ICONS.X}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-16 space-y-20 custom-scrollbar">
              <div className="flex justify-center gap-24 md:gap-32 flex-wrap">
                <Gauge value={selectedJob.job.hiringProbability} size={200} strokeWidth={18} label="Predictive Hire Probability" />
                <Gauge value={selectedJob.job.matchScore} size={200} strokeWidth={18} label="Technical Ecosystem Audit" />
              </div>

              <div className="space-y-10">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                  <h4 className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.4em] flex items-center gap-4">
                    {ICONS.FileText} Strategy Intelligence Report
                  </h4>
                  <div className="flex gap-4">
                    <span className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                      ID: {selectedJob.job.id}
                    </span>
                    <span className="px-6 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Verified Access
                    </span>
                  </div>
                </div>
                <div className="text-3xl text-slate-700 dark:text-slate-300 font-medium leading-[1.6] bg-slate-50 dark:bg-slate-800/40 p-16 rounded-[4.5rem] border border-slate-100 dark:border-slate-800 shadow-inner italic">
                  "{selectedJob.job.jd}"
                </div>
              </div>
            </div>

            <div className="p-12 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-8">
              <button 
                onClick={() => handleVisit(selectedJob.sessionId, selectedJob.job.id, selectedJob.job.url)}
                className="flex-1 bg-indigo-600 text-white font-black py-9 rounded-[2.75rem] shadow-2xl shadow-indigo-600/40 flex items-center justify-center gap-5 uppercase text-base tracking-[0.25em] hover:bg-indigo-700 transition-all transform active:scale-95"
              >
                Launch Intelligence Portal {ICONS.ExternalLink}
              </button>
              <button 
                onClick={() => copyUrl(selectedJob.sessionId, selectedJob.job.id, selectedJob.job.url)}
                className="px-12 py-9 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-white font-black rounded-[2.75rem] flex items-center gap-4 uppercase text-sm tracking-widest shadow-lg hover:border-indigo-500 transition-all"
              >
                {ICONS.Copy} Secure Resource Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

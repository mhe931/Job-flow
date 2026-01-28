
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
  return '📍';
};

const Gauge = ({ value, size = 60, strokeWidth = 6, label }: { value: number, size?: number, strokeWidth?: number, label: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const color = value > 80 ? 'text-indigo-600' : value > 50 ? 'text-blue-500' : 'text-slate-400';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-slate-100 dark:text-slate-800" />
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} className={`${color} transition-all duration-1000 ease-out`} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-900 dark:text-white">
          {value}%
        </span>
      </div>
      <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter text-center leading-none mt-1">{label}</span>
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
  const [config, setConfig] = useState<{ countries: string[], keywords: string[], titles: string[] } | null>(null);
  
  const [selectedCountries, setSelectedCountries] = useState<string[]>(profile.suggestedCountries || []);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(profile.suggestedKeywords || []);
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
        if (selectedKeywords.length === 0) setSelectedKeywords(analysis.keywords.slice(0, 5));
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
    profile.suggestedKeywords = selectedKeywords;
    profile.targetTitles = selectedTitles;
  }, [selectedCountries, selectedKeywords, selectedTitles]);

  const handleSearch = async () => {
    if (!profile.resumeText) return;
    setLoading(true);
    try {
      const results = await discoverJobs(selectedKeywords, selectedCountries, selectedTitles, profile.resumeText);
      
      setVerifyingUrls(true);
      const validatedResults: JobResult[] = [];
      for (const job of results) {
        const isValid = await validateJobUrl(job.url);
        if (isValid) validatedResults.push({ ...job, isValidated: true });
      }
      setVerifyingUrls(false);

      // Initial sort: By hiring probability
      const sortedResults = validatedResults.sort((a, b) => b.hiringProbability - a.hiringProbability);

      const session: SearchSession = {
        id: `session-${Date.now()}`,
        timestamp: Date.now(),
        countries: selectedCountries,
        keywords: selectedKeywords,
        targetTitles: selectedTitles,
        results: sortedResults
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

  // Logic: Unclicked at top (sorted by prob), Clicked at bottom
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
    alert('Opportunity link copied to clipboard.');
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
      <div className="space-y-3 bg-slate-50/50 dark:bg-slate-800/30 p-5 rounded-3xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{title}</h4>
          <div className="flex gap-2">
            <button onClick={() => onSetSelected([...new Set([...selected, ...items])])} className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase">All</button>
            <button onClick={() => onSetSelected([])} className="text-[9px] font-black text-slate-400 uppercase">None</button>
          </div>
        </div>
        <div className="relative">
          <input 
            type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={`Search...`}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all pr-10"
          />
          <button onClick={handleAdd} className="absolute right-2 top-1.5 text-indigo-600 dark:text-indigo-400 p-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg">{ICONS.PlusCircle}</button>
        </div>
        <div className="space-y-1 max-h-44 overflow-y-auto pr-2 scrollbar-thin">
          {filteredItems.map(item => (
            <label key={item} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 cursor-pointer group transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
              <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${selected.includes(item) ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
                {selected.includes(item) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              <input type="checkbox" checked={selected.includes(item)} onChange={() => onSetSelected(selected.includes(item) ? selected.filter(i => i !== item) : [...selected, item])} className="hidden" />
              <span className={`text-xs font-bold transition-colors truncate ${selected.includes(item) ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{item}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl sticky top-20 z-40 transition-all">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm ${showFilters ? 'bg-indigo-600 text-white shadow-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'}`}
          >
            {ICONS.Filter} {showFilters ? 'Apply Strategy' : 'Adjust Strategy'}
          </button>
          <div className="hidden sm:block">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Radar Pulse</h2>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Clicked opportunities move to bottom</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {loading && verifyingUrls && (
            <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest animate-pulse">
              {ICONS.Shield} Critical URL Validation...
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start relative">
        <div className={`transition-all duration-500 ease-in-out ${showFilters ? 'w-full lg:w-80 opacity-100' : 'w-0 lg:w-0 opacity-0 pointer-events-none overflow-hidden'}`}>
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4">
              <button 
                onClick={handleSearch}
                disabled={loading}
                className="w-full py-5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-3xl font-black text-sm shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group mb-2"
              >
                {loading ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : ICONS.Zap}
                <span className="uppercase tracking-widest">{loading ? 'Scanning...' : 'Initiate Discovery'}</span>
              </button>

              {config ? (
                <>
                  <ChecklistSection title="Target Regions" items={config.countries} selected={selectedCountries} onSetSelected={setSelectedCountries} categoryKey="countries" />
                  <ChecklistSection title="Optimized Roles" items={config.titles} selected={selectedTitles} onSetSelected={setSelectedTitles} categoryKey="titles" />
                  <ChecklistSection title="Technical DNA" items={config.keywords} selected={selectedKeywords} onSetSelected={setSelectedKeywords} categoryKey="keywords" />
                </>
              ) : (
                <div className="py-12 text-center animate-pulse">
                  <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full mx-auto mb-4 animate-spin"></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hydrating Config...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-6 w-full min-w-0">
          {!activeSession && !loading && (
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 p-24 text-center space-y-6 shadow-sm">
              <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-300 dark:text-slate-600 border border-slate-100 dark:border-slate-800">
                {ICONS.Search}
              </div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Radar Silent</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium italic">Define your career target and initiate the global discovery scan.</p>
            </div>
          )}

          {loading && !verifyingUrls && (
            <div className="space-y-6">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 h-64 animate-pulse border border-slate-100 dark:border-slate-800 shadow-sm" />
              ))}
            </div>
          )}

          {activeSession && !loading && (
            <div className="space-y-4 w-full animate-in fade-in duration-700">
              <div className="grid grid-cols-1 gap-4 w-full">
                {sortedJobs.map(job => (
                  <div 
                    key={job.id}
                    onClick={() => setSelectedJob({ job, sessionId: activeSession.id })}
                    className={`bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border-2 transition-all group relative overflow-hidden flex flex-col md:flex-row gap-8 shadow-sm cursor-pointer ${
                      job.clicked 
                        ? 'border-slate-100 dark:border-slate-800 opacity-60' 
                        : 'border-white dark:border-slate-800 hover:border-indigo-500/20 hover:shadow-2xl'
                    }`}
                  >
                    <div className="md:w-44 shrink-0 flex flex-col items-center justify-center gap-6 bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 transition-colors">
                      <Gauge value={job.hiringProbability} label="Hiring Probability" />
                      <Gauge value={job.matchScore} size={50} strokeWidth={4} label="Match Score" />
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl" role="img">{getCountryFlag(job.country)}</span>
                          <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{job.country}</span>
                        </div>
                        <h3 className={`text-3xl font-black tracking-tight transition-colors ${job.clicked ? 'text-slate-400' : 'text-slate-900 dark:text-white group-hover:text-indigo-600'}`}>{job.role}</h3>
                        <p className="text-xl font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-wide leading-none">{job.company}</p>
                      </div>
                      <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-2">
                        {job.jd}
                      </p>
                    </div>

                    <div className="md:w-64 shrink-0 flex flex-col justify-center gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleVisit(activeSession.id, job.id, job.url); }}
                        className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest py-5 rounded-[1.5rem] text-center hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white transition-all shadow-xl flex items-center justify-center gap-3"
                      >
                        Visit Portal {ICONS.ExternalLink}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); copyUrl(activeSession.id, job.id, job.url); }}
                        className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 rounded-2xl transition-all border border-transparent hover:border-slate-200 text-[10px] font-black uppercase tracking-widest"
                      >
                        {ICONS.Copy} Copy Link
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-950/40 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setSelectedJob(null)}>
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{getCountryFlag(selectedJob.job.country)}</span>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{selectedJob.job.role}</h3>
                  <p className="text-indigo-600 dark:text-indigo-400 font-black uppercase text-sm tracking-widest mt-1">
                    {selectedJob.job.company} • {getCountryFlag(selectedJob.job.country)} {selectedJob.job.country}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedJob(null)} className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-2xl transition-all">
                {ICONS.X}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-12">
              <div className="flex justify-center gap-12">
                <Gauge value={selectedJob.job.hiringProbability} size={120} strokeWidth={10} label="Hiring Probability" />
                <Gauge value={selectedJob.job.matchScore} size={120} strokeWidth={10} label="Technical Alignment" />
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                  {ICONS.FileText} High-Fidelity Intelligence Summary
                </h4>
                <div className="text-xl text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/20 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 italic">
                  "{selectedJob.job.jd}"
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-4">
              <button 
                onClick={() => handleVisit(selectedJob.sessionId, selectedJob.job.id, selectedJob.job.url)}
                className="flex-1 bg-indigo-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
              >
                Access Career Portal {ICONS.ExternalLink}
              </button>
              <button 
                onClick={() => copyUrl(selectedJob.sessionId, selectedJob.job.id, selectedJob.job.url)}
                className="px-8 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white font-black rounded-[1.5rem] flex items-center gap-2 uppercase text-xs tracking-widest shadow-sm"
              >
                {ICONS.Copy} Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

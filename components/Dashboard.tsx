
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, SearchSession, JobResult } from '../types';
import { ICONS } from '../constants';
import { analyzeResume, discoverJobs } from '../services/geminiService';

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
  const [config, setConfig] = useState<{ titles: string[], countries: string[], keywords: string[] } | null>(null);
  
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  
  const [activeSessionId, setActiveSessionId] = useState<string | null>(profile.history[0]?.id || null);
  const [selectedJob, setSelectedJob] = useState<{ job: JobResult, sessionId: string } | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const analysis = await analyzeResume(profile.resumeText, profile.resumeSourceType);
        setConfig(analysis);
        setSelectedTitles(analysis.titles.slice(0, 3));
        setSelectedCountries(analysis.countries.slice(0, 3));
        setSelectedKeywords(analysis.keywords.slice(0, 5));
      } catch (err) {
        console.error("Analysis failed", err);
      } finally {
        setLoading(false);
      }
    };
    if (!config) fetchConfig();
  }, [profile.resumeText]);

  const handleSearch = async () => {
    setLoading(true);
    setVerifyingUrls(true);
    try {
      const results = await discoverJobs(selectedKeywords, selectedCountries, selectedTitles, profile.resumeText);
      const session: SearchSession = {
        id: `session-${Date.now()}`,
        timestamp: Date.now(),
        titles: selectedTitles,
        countries: selectedCountries,
        keywords: selectedKeywords,
        results
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

  const copyUrl = (sessionId: string, jobId: string, url: string) => {
    navigator.clipboard.writeText(url);
    onJobClick(sessionId, jobId);
    alert('Job URL copied and tracked.');
  };

  const handleVisit = (sessionId: string, jobId: string, url: string) => {
    onJobClick(sessionId, jobId);
    window.open(url, '_blank');
  };

  const exportResultsToCsv = (results: JobResult[], filename: string) => {
    const headers = ["Interacted Date", "Interacted", "Search Date", "Company", "Role", "Country", "Link", "Match Score (%)", "Hiring Probability (%)"];
    const rows = results.map(job => [
      job.lastInteractedAt ? new Date(job.lastInteractedAt).toLocaleDateString() : 'N/A',
      job.clicked ? 'YES' : 'NO',
      new Date(job.timestamp).toLocaleDateString(),
      `"${job.company.replace(/"/g, '""')}"`,
      `"${job.role.replace(/"/g, '""')}"`,
      `"${job.country.replace(/"/g, '""')}"`,
      `"${job.url}"`,
      job.matchScore,
      job.hiringProbability
    ]);
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const activeSession = profile.history.find(s => s.id === activeSessionId) || profile.history[0];

  const exportAll = () => {
    const allResults = profile.history.flatMap(h => h.results);
    exportResultsToCsv(allResults, `JobFlow_Master_History_${new Date().toISOString().split('T')[0]}.csv`);
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
            placeholder={`Search or add...`}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all pr-10"
          />
          <button onClick={handleAdd} className="absolute right-2 top-2 text-indigo-600 dark:text-indigo-400 p-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg">{ICONS.PlusCircle}</button>
        </div>
        <div className="space-y-1 max-h-44 overflow-y-auto pr-2 scrollbar-thin">
          {filteredItems.map(item => (
            <label key={item} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 cursor-pointer group transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
              <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${selected.includes(item) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
                {selected.includes(item) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              <input type="checkbox" checked={selected.includes(item)} onChange={() => onSetSelected(selected.includes(item) ? selected.filter(i => i !== item) : [...selected, item])} className="hidden" />
              <span className={`text-xs font-bold transition-colors truncate ${selected.includes(item) ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{item}</span>
            </label>
          ))}
          {searchTerm && !items.some(i => i.toLowerCase() === searchTerm.toLowerCase()) && (
            <button onClick={handleAdd} className="w-full text-left p-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl mt-1 border border-indigo-100 dark:border-indigo-900/20">
              Add "{searchTerm}"
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl sticky top-20 z-40 transition-all">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm ${showFilters ? 'bg-indigo-600 text-white shadow-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'}`}
          >
            {ICONS.Filter} {showFilters ? 'Hide Logic' : 'Edit Strategy'}
          </button>
          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tight">Active Pipeline</h2>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Real-time market discovery</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {profile.history.length > 0 && (
            <button onClick={exportAll} className="hidden sm:flex px-6 py-3 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all items-center gap-2 shadow-sm active:scale-95">
              {ICONS.Download} Global Export
            </button>
          )}
          {activeSession && (
            <button onClick={() => exportResultsToCsv(activeSession.results, `JobFlow_Session_${activeSession.id}.csv`)} className="px-6 py-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2 shadow-sm active:scale-95">
              {ICONS.Download} Download CSV
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start relative">
        {/* Collapsible Sidebar */}
        <div className={`transition-all duration-500 ease-in-out ${showFilters ? 'w-full lg:w-80 opacity-100 translate-x-0' : 'w-0 lg:w-0 opacity-0 -translate-x-10 pointer-events-none overflow-hidden'}`}>
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4">
              {/* Deploy Scan Moved to Top */}
              <button 
                onClick={handleSearch}
                disabled={loading || selectedTitles.length === 0}
                className="w-full py-5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-3xl font-black text-sm shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group mb-2"
              >
                {loading ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : ICONS.Zap}
                <span className="uppercase tracking-widest">{verifyingUrls ? 'Scanning Web...' : 'Deploy Agent Scan'}</span>
              </button>

              {config ? (
                <>
                  <ChecklistSection title="Target Roles" items={config.titles} selected={selectedTitles} onSetSelected={setSelectedTitles} categoryKey="titles" />
                  <ChecklistSection title="Geographies" items={config.countries} selected={selectedCountries} onSetSelected={setSelectedCountries} categoryKey="countries" />
                  <ChecklistSection title="Skill Stack" items={config.keywords} selected={selectedKeywords} onSetSelected={setSelectedKeywords} categoryKey="keywords" />
                </>
              ) : (
                <div className="py-12 text-center animate-pulse">
                  <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full mx-auto mb-4 animate-spin"></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hydrating Config...</p>
                </div>
              )}
            </div>

            {profile.history.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2 px-1">
                  {ICONS.History} Session Cache
                </h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {profile.history.map(session => (
                    <button
                      key={session.id}
                      onClick={() => { setActiveSessionId(session.id); setShowFilters(false); }}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${activeSessionId === session.id ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-600' : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:border-slate-200'}`}
                    >
                      <div className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-tighter">{new Date(session.timestamp).toLocaleDateString()}</div>
                      <div className={`text-xs font-bold truncate ${activeSessionId === session.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>{session.titles[0]}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 space-y-6 w-full min-w-0">
          {!activeSession && !loading && (
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 p-24 text-center space-y-6 shadow-sm animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-300 dark:text-slate-600 border border-slate-100 dark:border-slate-800">
                {ICONS.Dashboard}
              </div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">Start Your Discovery</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium leading-relaxed italic">The engine is primed and waiting for target parameters. Deploy the agent to begin.</p>
            </div>
          )}

          {loading && (
            <div className="space-y-6">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 h-64 animate-pulse border border-slate-100 dark:border-slate-800 shadow-sm" />
              ))}
            </div>
          )}

          {activeSession && !loading && (
            <div className="space-y-6 w-full animate-in fade-in duration-700">
              <div className="flex items-center gap-4 px-2">
                <div className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20">{activeSession.results.length} Verified Hits</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Deployment Stack: {activeSession.keywords.slice(0, 3).join(' • ')}</div>
              </div>

              <div className="flex flex-col gap-6 w-full">
                {activeSession.results.map(job => (
                  <div 
                    key={job.id}
                    onClick={() => setSelectedJob({ job, sessionId: activeSession.id })}
                    className={`bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-10 border-2 transition-all group relative overflow-hidden flex flex-col md:flex-row gap-8 shadow-sm cursor-pointer ${
                      job.clicked 
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/10 dark:bg-indigo-900/5 shadow-inner' 
                        : 'border-white dark:border-slate-800 hover:border-indigo-500/20 hover:shadow-2xl'
                    }`}
                  >
                    {job.clicked && (
                      <div className="absolute top-6 right-10 text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-2 bg-indigo-600 px-4 py-1.5 rounded-full shadow-lg shadow-indigo-500/40">
                        {ICONS.CheckCircle} Interacted {new Date(job.lastInteractedAt || job.timestamp).toLocaleDateString()}
                      </div>
                    )}

                    {/* Circular Score Display */}
                    <div className="md:w-44 shrink-0 flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-800 group-hover:bg-white dark:group-hover:bg-slate-900 transition-colors">
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200 dark:text-slate-700" />
                          <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={264} strokeDashoffset={264 - (264 * job.hiringProbability) / 100} className="text-indigo-600 dark:text-indigo-400 transition-all duration-1000" />
                        </svg>
                        <span className="absolute text-2xl font-black text-slate-900 dark:text-white leading-none">{job.hiringProbability}%</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Success Prob</span>
                        <div className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">{job.matchScore}% Match</div>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 transition-colors">{job.role}</h3>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-lg font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-wide leading-none">{job.company}</span>
                          <span className="h-4 w-[2px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                          <span className="flex items-center gap-1.5 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">{ICONS.MapPin} {job.country}</span>
                        </div>
                      </div>
                      <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed font-medium max-w-4xl line-clamp-2">
                        {job.jd}
                      </p>
                      <div className="flex gap-4 items-center">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-100/50 dark:bg-slate-800/30 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800">
                          {new Date(job.timestamp).toLocaleDateString()} Deployment
                        </div>
                        {job.clicked && (
                          <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">Retrieved Cache</div>
                        )}
                      </div>
                    </div>

                    <div className="md:w-64 shrink-0 flex flex-col justify-center gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleVisit(activeSession.id, job.id, job.url); }}
                        className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest py-5 rounded-[1.5rem] text-center hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 group/btn"
                      >
                        Visit Career Portal
                        <span className="group-hover/btn:translate-x-1 transition-transform">{ICONS.ExternalLink}</span>
                      </button>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); copyUrl(activeSession.id, job.id, job.url); }}
                          className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-2xl transition-all border border-transparent hover:border-slate-200 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
                        >
                          {ICONS.Copy} Copy
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onJobClick(activeSession.id, job.id); exportResultsToCsv([job], `Opportunity_${job.company}.csv`); }}
                          className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-2xl transition-all border border-transparent hover:border-slate-200"
                        >
                          {ICONS.Download}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-950/40 backdrop-blur-xl animate-in fade-in duration-300">
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-[1.5rem] flex items-center justify-center">
                  {ICONS.Briefcase}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{selectedJob.job.role}</h3>
                  <p className="text-indigo-600 dark:text-indigo-400 font-black uppercase text-sm tracking-widest">{selectedJob.job.company}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedJob(null)}
                className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-2xl transition-all"
              >
                {ICONS.X}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center gap-2">
                   <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{selectedJob.job.hiringProbability}%</div>
                   <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Hiring Prob</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center gap-2">
                   <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{selectedJob.job.matchScore}%</div>
                   <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Match Strength</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center gap-2">
                   <div className="text-sm font-black text-slate-700 dark:text-slate-300">{selectedJob.job.country}</div>
                   <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Location</div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                  {ICONS.FileText} Intelligence Summary
                </h4>
                <div className="text-lg text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/20 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 italic">
                  "{selectedJob.job.jd}"
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Metadata Pipeline</h4>
                <div className="flex flex-wrap gap-3">
                  <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 rounded-xl">Role ID: {selectedJob.job.id}</div>
                  <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 rounded-xl">Found: {new Date(selectedJob.job.timestamp).toLocaleString()}</div>
                  {selectedJob.job.lastInteractedAt && (
                    <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-[10px] font-bold text-indigo-600 rounded-xl">Last Interacted: {new Date(selectedJob.job.lastInteractedAt).toLocaleString()}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-4">
              <button 
                onClick={() => handleVisit(selectedJob.sessionId, selectedJob.job.id, selectedJob.job.url)}
                className="flex-1 bg-indigo-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
              >
                Access Portal {ICONS.ExternalLink}
              </button>
              <button 
                onClick={() => copyUrl(selectedJob.sessionId, selectedJob.job.id, selectedJob.job.url)}
                className="px-8 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white font-black rounded-[1.5rem] flex items-center gap-2 uppercase text-xs tracking-widest shadow-sm"
              >
                {ICONS.Copy} Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

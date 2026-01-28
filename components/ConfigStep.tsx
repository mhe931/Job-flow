
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { ICONS } from '../constants';

// Added missing ConfigStepProps interface
interface ConfigStepProps {
  profile: UserProfile;
  onConfirm: (profile: UserProfile) => void;
}

const INITIAL_DATABASES = {
  countries: [
    "United States", "United Kingdom", "Germany", "Netherlands", "Canada", "Singapore",
    "Australia", "Remote", "Switzerland", "Japan", "France", "Sweden", "UAE", "Ireland",
    "Norway", "Denmark", "Finland", "Israel", "India", "New Zealand", "Estonia"
  ],
  titles: [
    "Software Engineer", "Frontend Developer", "Backend Developer", "Product Manager",
    "Data Scientist", "DevOps Engineer", "Staff Engineer", "Solutions Architect"
  ]
};

const ConfigStep: React.FC<ConfigStepProps> = ({ profile, onConfirm }) => {
  const [countries, setCountries] = useState<string[]>(profile.suggestedCountries || []);
  const [titles, setTitles] = useState<string[]>(profile.targetTitles || []);

  const [databases, setDatabases] = useState(() => {
    const saved = localStorage.getItem('jobflow_db');
    if (saved) return JSON.parse(saved);
    return INITIAL_DATABASES;
  });

  useEffect(() => {
    localStorage.setItem('jobflow_db', JSON.stringify(databases));
  }, [databases]);

  const handleStart = () => {
    onConfirm({
      ...profile,
      suggestedCountries: countries,
      targetTitles: titles
    });
  };

  const updateDatabase = (category: keyof typeof INITIAL_DATABASES, value: string) => {
    const trimmed = value.trim();
    if (trimmed && !databases[category].some((item: string) => item.toLowerCase() === trimmed.toLowerCase())) {
      setDatabases((prev: any) => ({
        ...prev,
        [category]: [...prev[category], trimmed]
      }));
    }
  };

  const AutocompletePillList = ({ 
    items, 
    onSet, 
    label, 
    icon, 
    placeholder,
    category
  }: { 
    items: string[], 
    onSet: (newItems: string[]) => void, 
    label: string, 
    icon: React.ReactNode, 
    placeholder: string,
    category: keyof typeof INITIAL_DATABASES
  }) => {
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredSuggestions = databases[category].filter(
      (s: string) => s.toLowerCase().includes(inputValue.toLowerCase()) && 
      !items.some(item => item.toLowerCase() === s.toLowerCase())
    ).slice(0, 8);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setShowSuggestions(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAdd = (value: string) => {
      const trimmed = value.trim();
      if (trimmed && !items.some(item => item.toLowerCase() === trimmed.toLowerCase())) {
        onSet([...items, trimmed]);
        updateDatabase(category, trimmed);
        setInputValue('');
        setShowSuggestions(false);
      }
    };

    return (
      <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm hover:shadow-xl transition-all duration-500">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            {icon}
          </div>
          <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{label}</h3>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 min-h-[60px]">
          {items.map((item, i) => (
            <span key={i} className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all animate-in zoom-in-95">
              {item}
              <button onClick={() => onSet(items.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500 transition-colors">×</button>
            </span>
          ))}
        </div>

        <div className="mt-auto relative" ref={dropdownRef}>
          <div className="relative">
            <input 
              type="text" 
              className="w-full pl-5 pr-14 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500/50 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
              placeholder={placeholder}
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd(inputValue)}
            />
            <button onClick={() => handleAdd(inputValue)} className="absolute right-3 top-3 p-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl hover:bg-indigo-700 transition-all">{ICONS.PlusCircle}</button>
          </div>
          {showSuggestions && inputValue && (
            <div className="absolute z-[60] bottom-full mb-3 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-h-56 overflow-y-auto">
              {filteredSuggestions.map((suggestion, index) => (
                <button key={index} onClick={() => handleAdd(suggestion)} className="w-full text-left px-5 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0">{suggestion}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-slate-200 dark:border-slate-800 pb-12">
        <div className="space-y-4">
          <span className="inline-block bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-indigo-500/20">Strategy Configuration</span>
          <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">Global Deployment Map</h2>
          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl font-medium">Verify your market targets to ensure the agent orchestrates the scan with maximum precision.</p>
        </div>
        <button onClick={handleStart} className="w-full md:w-auto px-12 py-6 bg-indigo-600 dark:bg-indigo-500 text-white rounded-3xl font-black text-lg shadow-2xl shadow-indigo-600/30 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-4">
          Deploy Intelligence Radar {ICONS.Zap}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <AutocompletePillList items={countries} onSet={setCountries} label="Geographic Hubs" icon={ICONS.MapPin} placeholder="Search regions..." category="countries" />
        <AutocompletePillList items={titles} onSet={setTitles} label="Strategic Roles" icon={ICONS.Briefcase} placeholder="Search roles..." category="titles" />
      </div>
    </div>
  );
};

export default ConfigStep;

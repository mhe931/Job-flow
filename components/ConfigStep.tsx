
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { ICONS } from '../constants';

// Define the missing props interface
interface ConfigStepProps {
  profile: UserProfile;
  onConfirm: (profile: UserProfile) => void;
}

// Professional Industry Baseline Data
const INITIAL_DATABASES = {
  titles: [
    "Senior Python Developer", "Cloud Architect", "AI Engineer", "Machine Learning Ops (MLOps)",
    "Backend Engineer", "Data Scientist", "Solutions Architect", "DevOps Lead",
    "Full Stack Architect", "Technical Product Manager", "CTO", "VP of Engineering",
    "SRE (Site Reliability Engineer)", "Frontend Lead", "Cybersecurity Architect",
    "Data Engineer", "NLP Researcher", "Embedded Systems Engineer", "Engineering Manager"
  ],
  countries: [
    "United States", "United Kingdom", "Germany", "Netherlands", "Canada", "Singapore",
    "Australia", "Remote", "Switzerland", "Japan", "France", "Sweden", "UAE", "Ireland",
    "Norway", "Denmark", "Finland", "Israel", "India", "New Zealand", "Estonia"
  ],
  keywords: [
    "Python", "AWS", "GCP", "Azure", "Docker", "Kubernetes", "LLM", "RAG", "Vector DBs",
    "TypeScript", "React", "Terraform", "CI/CD", "FastAPI", "Go", "Rust", "HuggingFace",
    "TensorFlow", "PyTorch", "SQL", "NoSQL", "Snowflake", "Databricks", "OpenAI API",
    "LangChain", "Node.js", "GraphQL", "Microservices", "Serverless"
  ]
};

const ConfigStep: React.FC<ConfigStepProps> = ({ profile, onConfirm }) => {
  // Fix: Handle cases where suggested fields might be undefined initially using profile data or empty arrays
  const [titles, setTitles] = useState<string[]>(profile.suggestedTitles || []);
  const [countries, setCountries] = useState<string[]>(profile.suggestedCountries || []);
  const [keywords, setKeywords] = useState<string[]>(profile.suggestedKeywords || []);

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
      suggestedTitles: titles,
      suggestedCountries: countries,
      suggestedKeywords: keywords
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
    const [activeIndex, setActiveIndex] = useState(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredSuggestions = databases[category].filter(
      (s: string) => s.toLowerCase().includes(inputValue.toLowerCase()) && 
      !items.some(item => item.toLowerCase() === s.toLowerCase())
    ).slice(0, 8); // Show top 8 for UI cleanliness

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
        setActiveIndex(-1);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => Math.min(prev + 1, filteredSuggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex >= 0 && filteredSuggestions[activeIndex]) {
          handleAdd(filteredSuggestions[activeIndex]);
        } else {
          handleAdd(inputValue);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    };

    return (
      <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl transition-colors">
            {icon}
          </div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">{label}</h3>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 min-h-[48px]">
          {items.map((item, i) => (
            <span 
              key={i} 
              className="group flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all animate-in zoom-in-95"
            >
              {item}
              <button 
                onClick={() => onSet(items.filter((_, idx) => idx !== i))}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                ×
              </button>
            </span>
          ))}
          {items.length === 0 && (
            <span className="text-xs text-slate-400 dark:text-slate-500 italic py-2">No selections yet. Start typing to search...</span>
          )}
        </div>

        <div className="mt-auto relative" ref={dropdownRef}>
          <div className="relative">
            <input 
              type="text" 
              className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500/50 dark:focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
              placeholder={placeholder}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
            />
            <button 
              onClick={() => handleAdd(inputValue)}
              className="absolute right-3 top-3 p-1.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
            >
              {ICONS.PlusCircle}
            </button>
          </div>

          {showSuggestions && inputValue && (
            <div className="absolute z-[60] bottom-full mb-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-h-56 overflow-y-auto animate-in slide-in-from-bottom-2 duration-200">
              {filteredSuggestions.length > 0 ? (
                filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleAdd(suggestion)}
                    className={`w-full text-left px-5 py-3 text-sm transition-colors flex items-center justify-between ${
                      index === activeIndex 
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' 
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{suggestion}</span>
                    <span className="text-[9px] uppercase font-bold text-slate-300 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">DB Match</span>
                  </button>
                ))
              ) : (
                <div className="px-5 py-4 text-xs text-slate-400 dark:text-slate-500 flex items-center justify-between">
                  <span>New: "{inputValue}"</span>
                  <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-lg font-bold uppercase text-[9px]">Add & Learn</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-slate-200 dark:border-slate-800 pb-10 transition-colors">
        <div className="space-y-3">
          <span className="inline-block bg-indigo-600 dark:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg">
            Profile Intelligence
          </span>
          <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Target Strategy
          </h2>
          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl">
            Confirm your search parameters. Our engine adapts to your industry specific requirements.
          </p>
        </div>
        
        <button 
          onClick={handleStart}
          className="w-full lg:w-auto px-10 py-5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-3xl font-black text-lg shadow-2xl shadow-indigo-600/20 hover:bg-indigo-700 dark:hover:bg-indigo-600 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-4"
        >
          {ICONS.Shield}
          Start Orchestration
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <AutocompletePillList 
          items={titles} 
          onSet={setTitles}
          label="Job Titles"
          icon={ICONS.Briefcase}
          placeholder="e.g. Lead AI Architect..."
          category="titles"
        />
        <AutocompletePillList 
          items={countries} 
          onSet={setCountries}
          label="Geographies"
          icon={ICONS.MapPin}
          placeholder="e.g. Remote, Netherlands..."
          category="countries"
        />
        <AutocompletePillList 
          items={keywords} 
          onSet={setKeywords}
          label="Skill Stack"
          icon={ICONS.Search}
          placeholder="e.g. LLMOps, RAG..."
          category="keywords"
        />
      </div>
    </div>
  );
};

export default ConfigStep;
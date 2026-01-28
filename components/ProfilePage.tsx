
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ICONS } from '../constants';

interface ProfilePageProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
  onBack: () => void;
  onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ profile, onUpdate, onBack, onLogout }) => {
  const [resumeUrl, setResumeUrl] = useState(profile.resumeText || '');
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [countries, setCountries] = useState(profile.suggestedCountries || []);
  const [keywords, setKeywords] = useState(profile.suggestedKeywords || []);
  const [titles, setTitles] = useState(profile.targetTitles || []);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      onUpdate({
        ...profile,
        displayName,
        resumeText: resumeUrl,
        resumeUrl: resumeUrl,
        suggestedCountries: countries,
        suggestedKeywords: keywords,
        targetTitles: titles
      });
      setIsSaving(false);
    }, 800);
  };

  const handleRemove = (set: Function, list: string[], item: string) => {
    set(list.filter(i => i !== item));
  };

  const PillInput = ({ label, items, onSet, placeholder }: { label: string, items: string[], onSet: Function, placeholder: string }) => {
    const [val, setVal] = useState('');
    return (
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">{label}</label>
        <div className="flex flex-wrap gap-2">
          {items.map(item => (
            <span key={item} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-2 group">
              {item}
              <button onClick={() => handleRemove(onSet, items, item)} className="text-slate-400 hover:text-red-500">×</button>
            </span>
          ))}
          <input 
            type="text" 
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && val.trim()) {
                onSet([...items, val.trim()]);
                setVal('');
              }
            }}
            placeholder={placeholder}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500 w-32"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-all font-black uppercase text-[10px] tracking-widest">
          {ICONS.Back} Back to Radar
        </button>
        <div className="flex items-center gap-4">
          <button onClick={onLogout} className="px-5 py-2.5 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all">
            Logout Session
          </button>
          <button 
            onClick={handleSave}
            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            {isSaving ? 'Syncing DB...' : 'Save Database'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <img 
              src={profile.photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=random`} 
              alt="Profile" 
              className="w-32 h-32 rounded-[2rem] mx-auto border-4 border-indigo-50 dark:border-indigo-900/30 shadow-xl"
            />
            <div className="space-y-1">
              <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="text-2xl font-black text-slate-900 dark:text-white bg-transparent border-b-2 border-transparent focus:border-indigo-500 outline-none text-center w-full"
                placeholder="Candidate Name"
              />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{profile.email}</p>
            </div>
          </div>
          
          <div className="bg-slate-100/50 dark:bg-slate-900/50 p-6 rounded-[2rem] space-y-6">
            <PillInput label="Target Regions" items={countries} onSet={setCountries} placeholder="Add..." />
            <PillInput label="Probable Titles" items={titles} onSet={setTitles} placeholder="Add..." />
            <PillInput label="Skill Matrix" items={keywords} onSet={setKeywords} placeholder="Add..." />
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                {ICONS.ExternalLink}
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Professional Resume Link</h3>
            </div>
            <div className="space-y-4">
              <input 
                type="url" 
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                className="w-full px-8 py-6 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-medium outline-none focus:border-indigo-500"
                placeholder="https://..."
              />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                Updating this link will re-trigger the intelligence pipeline analysis during the next discovery scan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

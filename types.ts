
export type ResumeSourceType = 'upload' | 'paste' | 'drive' | 'url';

export interface JobResult {
  id: string;
  company: string;
  role: string;
  country: string;
  url: string;
  matchScore: number;
  hiringProbability: number;
  jd: string;
  clicked: boolean;
  lastInteractedAt?: number;
  timestamp: number;
  isValidated?: boolean;
}

export interface SearchSession {
  id: string;
  timestamp: number;
  countries: string[];
  targetTitles: string[];
  results: JobResult[];
}

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  resumeText?: string;
  resumeUrl?: string;
  resumeSourceType?: ResumeSourceType;
  history: SearchSession[];
  suggestedCountries?: string[];
  targetTitles?: string[];
}

export type AppStep = 'auth' | 'onboarding' | 'dashboard' | 'profile';

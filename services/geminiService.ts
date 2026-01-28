
import { GoogleGenAI, Type } from "@google/genai";
import { JobResult } from "../types";

export async function analyzeResume(resumeUrl: string, sourceType: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const strategyContext = `Act as an Elite Tech Talent Architect. 
    Analyze this professional resume URL: ${resumeUrl}
    Based on the metadata and professional footprint of this individual, architect a global career strategy.
    
    Perform a deep semantic mapping to identify:
    1. 10 Strategic High-Growth Tech Hubs (Countries) where this profile is highly competitive.
    2. 15 Precise Industry Keywords representing their unique technical stack and domain expertise.
    3. 8 Professional Job Titles that align with their seniority and maximize hiring probability.`;

  const prompt = `${strategyContext}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          countries: { type: Type.ARRAY, items: { type: Type.STRING } },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          titles: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["countries", "keywords", "titles"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
}

export async function discoverJobs(keywords: string[], countries: string[], titles: string[], resumeUrl: string): Promise<JobResult[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `As a Senior Global Headhunter, identify 15 ACTIVE job opportunities for the professional at: ${resumeUrl}
    
    Search Context:
    - Target Regions: ${countries.join(', ')}
    - Job Titles: ${titles.join(', ')}
    - Keywords: ${keywords.join(', ')}
    
    SCORING ENGINE PROTOCOL (RECRUITER LEVEL ACCURACY):
    For each job, perform a critical comparison between the JD and the candidate's professional profile.
    
    1. matchScore (0-100): 
       - Technical Stack Alignment: Languages, frameworks, and architecture patterns.
       - Hard Skill Gaps: Deduct points for missing core requirements.
       - Technical Complexity: Compare candidate's past scale with JD requirements.
    
    2. hiringProbability (0-100): 
       - Seniority Parity: Is the candidate overqualified or underqualified?
       - Domain Specialization: (e.g., FinTech, SaaS, AI/ML)
       - Market Competition Factor: Estimated supply/demand for this role.
    
    Output Format: JSON Array of objects.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            company: { type: Type.STRING },
            role: { type: Type.STRING },
            country: { type: Type.STRING },
            url: { type: Type.STRING },
            jd: { type: Type.STRING },
            matchScore: { type: Type.INTEGER },
            hiringProbability: { type: Type.INTEGER }
          },
          required: ["company", "role", "country", "url", "jd", "matchScore", "hiringProbability"]
        }
      }
    }
  });

  const results = JSON.parse(response.text || '[]');
  return results.map((r: any, i: number) => ({
    ...r,
    id: `job-${Date.now()}-${i}`,
    clicked: false,
    timestamp: Date.now()
  }));
}

export async function validateJobUrl(url: string): Promise<boolean> {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (!url || url.includes('example.com') || url.length < 10) return false;
    return true;
  } catch {
    return false;
  }
}

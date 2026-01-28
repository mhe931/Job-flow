
import { GoogleGenAI, Type } from "@google/genai";
import { JobResult } from "../types";

export async function analyzeResume(resumeContent: string, sourceType: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const strategyContext = `Act as an Executive Recruitment Architect. 
    Analyze this candidate's DNA for global market placement.
    Return exactly:
    1. 10 Strategic Job Titles.
    2. 10 High-Growth Tech Hubs.
    3. 15 Precise Industry Keywords.`;

  const prompt = `${strategyContext}\n\nProfile Content:\n${resumeContent}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          titles: { type: Type.ARRAY, items: { type: Type.STRING } },
          countries: { type: Type.ARRAY, items: { type: Type.STRING } },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["titles", "countries", "keywords"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
}

export async function discoverJobs(keywords: string[], countries: string[], titles: string[], resumeText: string): Promise<JobResult[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Reinforced instruction to check links twice
  const prompt = `As a Senior Talent Headhunter and Web Researcher, find 12 REALISTIC, ACTIVE, and VERIFIED job openings.
    Parameters:
    - Target Titles: ${titles.join(', ')}
    - Target Regions: ${countries.join(', ')}
    - Core Stack: ${keywords.join(', ')}
    
    CRITICAL PROTOCOLS:
    1. VERIFY THE LINK TWICE: Ensure the "url" provided is a direct and functional link to the career portal or job listing. Do not return broken or speculative links.
    2. ACCURACY: The Company name must be 100% accurate.
    3. SCORING: Calculate Match Score (0-100) based on role requirements vs resume.
    4. PROBABILITY: Calculate "hiringProbability" as an INTEGER (0-100) specifically considering market competition and resume strength: ${resumeText.slice(0, 800)}
    5. DESCRIPTION: Provide a 2-3 sentence summary of the role focus as "jd".

    Return only valid JSON.`;

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

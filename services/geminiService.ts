
import { GoogleGenAI, Type } from "@google/genai";
import { JobResult } from "../types";

export async function analyzeResume(resumeContent: string, sourceType: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const strategyContext = `Act as an Elite Tech Talent Architect. 
    Analyze this professional's experience narrative to identify global market fit.
    Perform a deep extraction of:
    1. 10 Strategic High-Growth Tech Hubs (Countries/Cities) where this profile is in high demand.
    2. 15 Precise Industry Keywords representing their unique technical stack and domain expertise.`;

  const prompt = `${strategyContext}\n\nCandidate Resume Content:\n${resumeContent}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          countries: { type: Type.ARRAY, items: { type: Type.STRING } },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["countries", "keywords"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
}

export async function discoverJobs(keywords: string[], countries: string[], resumeText: string): Promise<JobResult[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `As a Senior Global Headhunter, identify 12 ACTIVE and HIGH-QUALITY job openings.
    Target Parameters:
    - Regions: ${countries.join(', ')}
    - Technical Domain: ${keywords.join(', ')}
    
    SCORING ENGINE PROTOCOL (CRITICAL):
    Compare the following Resume with each found Job Description:
    
    Resume Context: ${resumeText.slice(0, 1500)}
    
    1. matchScore: Calculate based on hard-skill overlap (languages, frameworks, tools).
    2. hiringProbability: Perform a multi-factor analysis:
       - Experience depth vs role seniority.
       - Domain alignment (e.g., FinTech to FinTech).
       - Technical maturity reflected in the resume.
    
    3. URL VERIFICATION: You MUST check the link twice. Return ONLY functional, direct links.
    
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
            matchScore: { type: Type.INTEGER, description: "Percentage 0-100" },
            hiringProbability: { type: Type.INTEGER, description: "Percentage 0-100" }
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

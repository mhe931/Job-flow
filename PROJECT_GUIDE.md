
# JobFlow AI: System Documentation & Assistant Context

## 1. Project Overview
JobFlow AI is a persistent career discovery engine designed for high-fidelity job matching. It uses a "Link-Only" resume model where the user's professional digital footprint (LinkedIn, Personal Site, Portfolio) acts as the source of truth for AI analysis.

## 2. Technical Stack
- **Core:** React 19, TypeScript, Tailwind CSS.
- **AI Orchestration:** Google Gemini 3 (Pro for discovery, Flash for strategy).
- **Persistence:** "SQLite Mirror" (localStorage-backed Data Access Layer).
- **Icons:** Lucide React.

## 3. Data Schema (UserProfile)
| Field | Type | Description |
|-------|------|-------------|
| `uid` | string | Unique Google Auth ID |
| `resumeUrl` | string | The ONLY allowed resume source (URL) |
| `history` | Array | Search sessions containing job results |
| `targetTitles`| Array | AI-suggested or user-added job titles |
| `suggestedCountries` | Array | Strategic regions for deployment |

## 4. AI Orchestration Strategy
### A. Strategy Discovery (Gemini Flash)
- **Input:** Resume URL.
- **Output:** Strategic mapping (Titles, Countries).
- **Goal:** Broad market fit identification based on professional trajectory.

### B. High-Fidelity Discovery (Gemini Pro)
- **Input:** Selected titles, regions, and Resume URL.
- **Scoring Engine:**
  - **Match Score:** Weights: Technical Stack (50%), Seniority (30%), Education/Tools (20%).
  - **Hiring Prob:** Weights: Market Competition (40%), Experience Depth (40%), Role Specificity (20%).

## 5. UI/UX Rules
- **Sorting:** `unclicked` (high-prob first) -> `clicked` (bottom).
- **Visuals:** Country flags must accompany every region mention.
- **Validation:** Every job URL must pass a reachability simulation.
- **Profile:** Users must have full CRUD control over their strategic parameters.

## 6. Suggested Improvements
1. **Resume Scraping Proxy:** Integrate a server-side scraping API (like Browserless) to actually fetch the text from the URL, as the frontend is CORS-restricted.
2. **Dynamic Thresholds:** Allow users to hide jobs below a 70% Match Score.
3. **Applied State:** Add a button to mark a job as "Applied" which moves it to a separate "Active Pipeline" tab.

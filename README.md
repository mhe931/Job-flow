
# JobFlow AI 🚀

JobFlow AI is a high-fidelity career discovery engine that transforms your professional digital footprint into a strategic roadmap for job applications. Unlike traditional scrapers, JobFlow uses a multi-layered AI scoring engine to determine your technical match and hiring probability with recruiter-level precision.

## ✨ Features

- **Link-Based Intelligence**: No more uploading static PDFs. Provide a link to your LinkedIn, portfolio, or online resume.
- **Weighted Scoring Engine**: 
  - **Match Score**: Analyzes technical stack alignment (50%), seniority fit (30%), and ecosystem tools (20%).
  - **Hiring Probability**: Evaluates market competition (40%), strategic fit (40%), and domain specificity (20%).
- **Persistent DB Sync**: Uses a "SQLite Mirror" (localStorage DAL) to persist your search history, target titles, and regional hubs across sessions.
- **Smart Sorting**: Interacted jobs automatically move to the bottom of your radar, keeping fresh opportunities front and center.
- **Global Hub Discovery**: AI-suggested regions and professional roles based on your specific technical DNA.

## 🛠️ Tech Stack

- **Frontend**: React 19 (ES6+), TypeScript, Tailwind CSS.
- **AI**: Google Gemini 2.5 & 3.0 (Flash for strategy, Pro for discovery).
- **Icons**: Lucide React.
- **Persistence**: Custom persistence layer mimicking a relational database structure.

## 🚀 Getting Started

### Prerequisites
- A Google Gemini API Key.

### Environment Setup
The application expects the following environment variable:
- `process.env.API_KEY`: Your Google Gemini API key.

### Local Development
1. Open `index.html` in any modern web browser.
2. Log in with the simulated Google Auth.
3. Provide your professional resume URL to begin the analysis.

## 🧠 System Architecture

- **`App.tsx`**: Manages global state, authentication flow, and step-based navigation.
- **`Dashboard.tsx`**: The core engine for displaying results, re-sorting interactions, and refining search parameters.
- **`geminiService.ts`**: Handles all LLM interactions, including the weighted scoring heuristic.
- **`storageService.ts`**: The Data Access Layer (DAL) that manages the local "SQLite Mirror."

---
*Created by the Senior Engineering Team at JobFlow.*

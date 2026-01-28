# System Specification: JobFlow AI Career Discovery Engine

## 1. Executive Summary
The system is a high-fidelity job discovery and career orchestration platform. Unlike traditional job boards, it uses a "Digital Footprint First" model where a user's professional URL (LinkedIn, Portfolio, or Personal Site) serves as the primary data source. The engine applies recruiter-level heuristics to analyze market fit, suggest strategic deployment regions, and discover verified job opportunities with weighted success probabilities.

## 2. Core Modules & Subsystems

### A. Identity & Session Management
- **Authentication:** Secure OAuth2-style login (e.g., Google Identity).
- **Profile Management:** User-specific persistence of search history, target job titles, and preferred geographic hubs.
- **Session Tracking:** Ability to group discovery results into "Search Sessions" to track market changes over time.

### B. Strategic Intelligence Engine (The "Architect")
- **Input Analysis:** The system must parse a professional URL and identify the user's technical seniority, core stack, and career trajectory.
- **Market Mapping:** Automatically suggest:
    - **Strategic Hubs:** 10+ geographic regions/countries where the user's profile has high market demand.
    - **Optimized Titles:** 8+ high-precision job titles that bypass generic filtering and align with the user's seniority.

### C. Discovery & Auditing Engine (The "Headhunter")
- **Live Scouting:** Find active job opportunities across multiple regions and roles simultaneously.
- **Integrity Audit:** A verification layer that simulates/checks the reachability and validity of job URLs before presenting them to the user.
- **Data Extraction:** Capture key metadata for each job: Role, Company, Region, Brief Description, and Posting Date (Relative).

### D. Scoring Heuristics (The "Auditor")
The system must apply a dual-score model for every discovered job:

1.  **Match Score (Technical Alignment - 0-100%):**
    - **50% Tech Stack:** Alignment of languages, frameworks, and architecture.
    - **30% Seniority Fit:** Depth of experience vs. job requirements.
    - **20% Ecosystem/Tools:** Secondary tools and cultural/industry alignment.

2.  **Hiring Probability (Success Prediction - 0-100%):**
    - **40% Market Competition:** Saturation of the specific region for that role.
    - **40% Strategic Value:** How directly the user's past wins solve the company's inferred pain points.
    - **20% Domain Specificity:** Vertical industry alignment (e.g., FinTech, SaaS).

## 3. User Interface & Experience Standards

### A. Search-Centric Design
- **Home View:** A minimalist "Search Engine" interface focused on high-level goals.
- **Results View (SERP):** A listing page optimized for information density and readability.
- **Sticky Navigation:** Persistent search bar for immediate parameter refinement.

### B. Result Visualization
- **Metadata Cards:** Each result must display the role, company, relative posting date (e.g., "2 hours ago"), geographic flag, and dual scores.
- **Interaction Feedback:** Interacted links (clicked/visited) should visually recede (grayscale/opacity) and move to the bottom of the list to prioritize fresh content.
- **New Find Indicators:** Prominent badges for opportunities discovered within the last 24 hours.

## 4. Operational Processes

1.  **Ingestion:** User provides a URL. The system analyzes the "Digital Footprint."
2.  **Configuration:** The system presents suggested titles and countries. The user can add, remove, or modify these parameters.
3.  **Deployment:** The system scouts the market based on the configured "Search Matrix."
4.  **Audit:** Discovered links are verified for validity.
5.  **Ranking:** Results are sorted by:
    - `Interacted Status` (Unread first).
    - `Hiring Probability` (Highest first).
6.  **Persistence:** All findings, metadata, and user preferences are saved to a local or cloud-based data store for cross-session continuity.

## 5. Security & Privacy
- User data must be scoped to their unique identifier.
- External URLs should be handled through a validation layer to prevent malicious redirection.
- No personal data should be stored beyond what is necessary for career matching and session persistence.

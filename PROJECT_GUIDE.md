# JobFlow AI: Project Guide & Development Context
**Version:** 2.0  
**Last Updated:** 2026-01-29  
**Architecture:** Python 3.11+ | Streamlit | SQLAlchemy | Pydantic | Google GenAI

---

## 1. Project Overview
JobFlow AI is a **production-grade career orchestration platform** that transforms resume analysis into strategic job discovery campaigns. It employs AI-driven market mapping, dual-score ranking (Match + HireProb), salary benchmarking with confidence indicators, and ghost job detection to deliver recruiter-level intelligence to individual job seekers.

### Key Differentiators
- **Resume-First Intelligence:** No manual skill entry—AI extracts tech stack and seniority
- **Strategic Matrix:** 10 hubs × 8 titles = 80 targeted search vectors
- **Financial Transparency:** Explicit salary extraction + AI-inferred ranges with confidence scores
- **Integrity Auditing:** Ghost job detection via posting age, URL patterns, and reachability checks
- **Recede Logic:** Clicked jobs visually de-emphasize and sink to bottom of SERP

---

## 2. Technical Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI Framework** | Streamlit 1.30+ | Rapid prototyping, built-in session state |
| **Data Validation** | Pydantic 2.5+ | Type-safe schemas (UserProfile, SearchMatrix, JobOpportunity) |
| **Persistence** | SQLAlchemy 2.0 + SQLite | ORM with async support, WAL mode for concurrency |
| **LLM Orchestration** | google-generativeai 0.3+ | Gemini Flash (strategy) + Pro (scoring) |
| **Authentication** | streamlit-authenticator 0.2+ | Google OAuth2 integration |
| **Encryption** | cryptography 41.0+ | AES-256-GCM for API key storage |
| **Document Parsing** | PyPDF2, python-docx | Resume text extraction |
| **Data Export** | pandas, openpyxl | Excel export with conditional formatting |
| **HTTP Client** | httpx | Async URL validation (HEAD requests) |

---

## 3. Module Architecture

### 3.1 `models.py` (Data Schemas)
**Pydantic Models:**
```python
UserProfile       # user_id, raw_text, extracted_skills, seniority
SearchMatrix      # user_id, suggested_hubs[10], optimized_titles[8]
JobOpportunity    # job_id, title, company, hub, salary_range, is_verified_salary,
                  # salary_confidence, match_score, hire_probability, url,
                  # post_date, is_ghost_job, viewed_at, clicked_at
```

**SQLAlchemy ORM Tables:**
```python
User              # Maps to users table
Session           # Maps to sessions table
DiscoveredJob     # Maps to discovered_jobs table
```

### 3.2 `engine.py` (Intelligence Core)
**Functions:**
```python
analyze_profile(raw_text: str) -> Tuple[List[str], str]
    # Extract skills + seniority via Gemini Flash

generate_search_matrix(profile: UserProfile) -> SearchMatrix
    # Create 10 hubs × 8 titles via Gemini Flash

calculate_match_score(user_skills: List[str], job_desc: str, user_seniority: str) -> float
    # 50% TechStack + 30% Seniority + 20% Ecosystem

calculate_hire_probability(user_profile: UserProfile, job: JobOpportunity) -> float
    # 40% MarketSaturation + 40% StrategicValue + 20% DomainFit

extract_salary(job_description: str) -> Optional[str]
    # Regex extraction of explicit salary ranges

infer_salary(hub: str, title: str, seniority: str) -> Tuple[str, float]
    # Gemini-based inference with confidence score

detect_ghost_job(job: JobOpportunity) -> bool
    # Check posting age, URL patterns, reachability
```

### 3.3 `database.py` (Persistence Layer)
**Functions:**
```python
init_db() -> None
    # Create tables with indexes

save_user(user: UserProfile) -> None
create_session(user_id: str, matrix: SearchMatrix) -> str
save_jobs(session_id: str, jobs: List[JobOpportunity]) -> None
get_jobs_for_session(session_id: str, include_clicked: bool = True) -> List[JobOpportunity]
mark_job_clicked(job_id: str) -> None
encrypt_api_key(key: str, user_id: str) -> str
decrypt_api_key(encrypted: str, user_id: str) -> str
```

### 3.4 `app.py` (Streamlit UI)
**Pages:**
```python
page_login()           # Google OAuth2 flow
page_upload_resume()   # PDF/DOCX upload or text paste
page_edit_matrix()     # Editable 10×8 grid (st.data_editor)
page_serp()            # Job results with Recede Logic
page_profile()         # User settings, API key management
```

**UI Components:**
```python
render_job_card(job: JobOpportunity, is_clicked: bool) -> None
    # Display title, company, hub, salary, scores, buttons

export_to_excel(jobs: List[JobOpportunity]) -> bytes
    # Pandas DataFrame with conditional formatting
```

---

## 4. AI Orchestration Strategy

### 4.1 Profile Analysis (Gemini Flash)
**Prompt Template:**
```
You are a senior technical recruiter. Analyze the following resume and extract:
1. All technical skills (languages, frameworks, tools, cloud platforms)
2. Seniority level: Junior (<2 yrs), Mid (2-5 yrs), Senior (5-8 yrs), Lead (8-12 yrs), Principal (12+ yrs)

Resume:
{raw_text}

Return JSON:
{
  "skills": ["Python", "React", "AWS", ...],
  "seniority": "Senior"
}
```

### 4.2 Strategic Matrix Generation (Gemini Flash)
**Prompt Template:**
```
Given this profile:
- Skills: {skills}
- Seniority: {seniority}

Generate:
1. 10 geographic hubs with high demand for this profile (prioritize salary transparency regions)
2. 8 optimized job titles that bypass ATS filters and align with seniority

Return JSON:
{
  "hubs": ["Berlin", "Toronto", "Singapore", ...],
  "titles": ["Senior Backend Engineer", "Platform Engineer", ...]
}
```

### 4.3 Dual-Score Calculation (Gemini Pro)
**Match Score Prompt:**
```
User Skills: {user_skills}
User Seniority: {user_seniority}
Job Description: {job_description}

Calculate technical alignment (0-100):
- 50% weight: Skill overlap (Jaccard similarity)
- 30% weight: Seniority fit (penalize if job requires >2 years beyond user)
- 20% weight: Ecosystem tools (bonus for domain-specific tech)

Return JSON: {"match_score": 87.5}
```

**Hiring Probability Prompt:**
```
User Profile: {profile_summary}
Job: {title} at {company} in {hub}
Job Description: {job_description}

Estimate hiring probability (0-100):
- 40% weight: Market saturation (applicant-to-opening ratio)
- 40% weight: Strategic value (user's past wins solve company pain points)
- 20% weight: Domain fit (industry vertical alignment)

Return JSON: {"hire_probability": 72.3}
```

### 4.4 Salary Inference (Gemini Flash)
**Prompt Template:**
```
Estimate 2026 salary range for:
- Title: {title}
- Seniority: {seniority}
- Location: {hub}

Return JSON:
{
  "range": "$130K-$170K USD",
  "confidence": 78.5  // 0-100 based on data availability
}

Use mandatory disclosure laws (CA, EU, NYC) for high confidence.
Flag uncertainty if hub data is sparse.
```

---

## 5. Implementation Workflow

### Phase 1: Foundation (Day 1-2)
1. **Setup:**
   - Create virtual environment: `python -m venv venv`
   - Install dependencies: `pip install streamlit sqlalchemy pydantic google-generativeai cryptography httpx pandas openpyxl PyPDF2 python-docx streamlit-authenticator`
   - Initialize Git: `git init`

2. **Database Schema:**
   - Implement `database.py` with SQLAlchemy models
   - Create `init_db()` with indexes on `user_id`, `session_id`, `hire_probability`
   - Test encryption/decryption functions

3. **Data Models:**
   - Define Pydantic schemas in `models.py`
   - Add validation rules (e.g., `match_score` must be 0-100)

### Phase 2: Intelligence Engine (Day 3-4)
4. **Profile Analyzer:**
   - Implement `analyze_profile()` with Gemini Flash
   - Test with sample resumes (Junior, Senior, Principal)

5. **Strategic Mapper:**
   - Implement `generate_search_matrix()`
   - Validate 10 hubs × 8 titles output

6. **Scoring Heuristics:**
   - Implement `calculate_match_score()` with weighted formula
   - Implement `calculate_hire_probability()` with LLM prompts
   - Unit test edge cases (100% match, 0% match)

7. **Financial Benchmarker:**
   - Implement `extract_salary()` with regex patterns
   - Implement `infer_salary()` with confidence scoring
   - Test with job descriptions from CA, EU, NYC (high confidence expected)

8. **Integrity Auditor:**
   - Implement `detect_ghost_job()` with async URL checks
   - Create blocklist of known scam domains

### Phase 3: UI Development (Day 5-6)
9. **Authentication:**
   - Integrate `streamlit-authenticator` with Google OAuth2
   - Implement session state management

10. **Resume Upload:**
    - Add PDF/DOCX parsers
    - Display extracted text for user verification

11. **Matrix Editor:**
    - Use `st.data_editor` for 10×8 grid
    - Add/remove rows functionality

12. **SERP:**
    - Implement `render_job_card()` with conditional styling
    - Add Recede Logic (grayscale + opacity for clicked jobs)
    - Implement "Copy Link" button

13. **Excel Export:**
    - Create `export_to_excel()` with conditional formatting
    - Green cells for match_score >80, hire_probability >70

### Phase 4: Integration & Testing (Day 7)
14. **End-to-End Flow:**
    - Test: Upload resume → Analyze → Edit matrix → Discover jobs → Click job → Verify recede
    - Validate database persistence across sessions

15. **Performance Optimization:**
    - Add async job discovery (httpx for parallel API calls)
    - Implement caching for repeated LLM calls (same resume)

16. **Security Audit:**
    - Verify API key encryption
    - Test URL sanitization
    - Check SQL injection prevention (SQLAlchemy ORM handles this)

---

## 6. Data Flow Diagram

```
┌─────────────┐
│ User Uploads│
│   Resume    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Profile Analyzer    │ ← Gemini Flash
│ (extract skills +   │
│  seniority)         │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Strategic Mapper    │ ← Gemini Flash
│ (10 hubs × 8 titles)│
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ User Edits Matrix   │
│ (st.data_editor)    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Job Discovery APIs  │ (LinkedIn, Indeed, Adzuna)
│ (async parallel)    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ For Each Job:       │
│ 1. Match Score      │ ← Gemini Pro
│ 2. Hire Probability │ ← Gemini Pro
│ 3. Salary Extract   │ (Regex)
│ 4. Salary Infer     │ ← Gemini Flash (if needed)
│ 5. Ghost Detection  │ (Async HEAD request)
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Save to Database    │
│ (discovered_jobs)   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ SERP Rendering      │
│ (sorted by unclicked│
│  + hire_probability)│
└─────────────────────┘
```

---

## 7. Environment Variables

Create `.env` file:
```bash
GOOGLE_CLIENT_ID=your_oauth_client_id
GOOGLE_CLIENT_SECRET=your_oauth_client_secret
GEMINI_API_KEY=your_gemini_api_key  # Fallback if user doesn't provide own
DATABASE_URL=sqlite:///jobflow.db
ENCRYPTION_MASTER_KEY=your_32_byte_key  # For API key encryption
```

---

## 8. Deployment Checklist

- [ ] Set `st.set_page_config(layout="wide", page_title="JobFlow AI")`
- [ ] Enable dark mode theme in `.streamlit/config.toml`
- [ ] Add database backup cron job (daily SQLite dump)
- [ ] Implement rate limiting for LLM calls (avoid quota exhaustion)
- [ ] Add error logging (Sentry or similar)
- [ ] Create user documentation (README with screenshots)
- [ ] Set up CI/CD (GitHub Actions for linting + tests)

---

## 9. Future Enhancements

1. **Multi-Resume Support:** Allow users to maintain multiple profiles (e.g., "Backend Focus" vs. "ML Focus")
2. **Job Alerts:** Email notifications for new high-probability matches
3. **Application Tracking:** Mark jobs as "Applied" → move to separate pipeline view
4. **Salary Negotiation Assistant:** LLM-powered counter-offer generator based on market data
5. **Interview Prep:** Auto-generate technical questions based on job description
6. **Company Research:** Scrape Glassdoor/Blind for culture insights
7. **Referral Finder:** LinkedIn API integration to find mutual connections at target companies

---

## 10. Maintenance Protocol

### Documentation Updates (MANDATORY)
Before implementing ANY new feature:
1. Update `SYSTEM_SPECIFICATION.md` with architectural changes
2. Update this `PROJECT_GUIDE.md` with implementation details
3. Add changelog entry at top of both files

### Code Quality Standards
- **Type Hints:** All functions must have type annotations
- **Docstrings:** Google-style docstrings for all public functions
- **Error Handling:** Try-except blocks with specific exceptions (no bare `except`)
- **Logging:** Use `logging` module (DEBUG for dev, INFO for prod)
- **Testing:** Minimum 80% code coverage (pytest + pytest-cov)

### Git Workflow
- **Branch Naming:** `feature/salary-benchmarking`, `fix/ghost-job-detection`
- **Commit Messages:** `feat: Add salary confidence indicators`, `fix: Handle missing job URLs`
- **PR Template:** Include "Spec Updated: Yes/No" checkbox

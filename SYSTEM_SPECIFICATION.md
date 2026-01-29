# System Specification: JobFlow AI Career Discovery Engine
**Version:** 2.0  
**Architecture:** Python 3.11+ | Streamlit | SQLAlchemy | Pydantic | Google GenAI SDK  
**Last Updated:** 2026-01-29

---

## 1. Executive Summary
JobFlow is a production-grade career orchestration platform that transforms professional profiles into strategic job discovery campaigns. Unlike traditional job boards, it employs a **Resume-First Intelligence Model** where uploaded resume text serves as the analytical foundation for AI-driven market mapping, dual-score ranking, salary benchmarking, and ghost job detection.

---

## 2. Data Architecture (models.py)

### 2.1 Pydantic Schemas

#### UserProfile
```python
class UserProfile(BaseModel):
    user_id: str  # Google OAuth2 UID
    raw_text: str  # Extracted resume content
    extracted_skills: List[str]  # Tech stack (e.g., ["Python", "React", "AWS"])
    seniority: str  # Enum: ["Junior", "Mid", "Senior", "Lead", "Principal"]
    created_at: datetime
    updated_at: datetime
```

#### SearchMatrix
```python
class SearchMatrix(BaseModel):
    user_id: str
    suggested_hubs: List[str]  # 10 geographic regions (e.g., ["Berlin", "Toronto", "Singapore"])
    optimized_titles: List[str]  # 8 job titles (e.g., ["Senior Backend Engineer", "ML Platform Engineer"])
    is_editable: bool = True
    generated_at: datetime
```

#### JobOpportunity
```python
class JobOpportunity(BaseModel):
    job_id: str  # UUID
    title: str
    company: str
    hub: str  # Geographic location
    salary_range: Optional[str]  # e.g., "$120K-$160K USD"
    is_verified_salary: bool  # True if extracted from job text, False if inferred
    salary_confidence: Optional[float]  # 0-100% (only for inferred salaries)
    match_score: float  # 0-100 (Technical Alignment)
    hire_probability: float  # 0-100 (Success Prediction)
    url: str
    post_date: datetime
    is_ghost_job: bool  # Flagged if posting is >60 days old or URL is suspicious
    viewed_at: Optional[datetime]
    clicked_at: Optional[datetime]
```

---

## 3. Intelligence & Salary Engine (engine.py)

### 3.1 Profile Analyzer
**Input:** `raw_text` from UserProfile  
**Output:** `extracted_skills`, `seniority`  
**Method:** Google Gemini Flash with structured prompt:
```
Extract technical skills and determine seniority level (Junior/Mid/Senior/Lead/Principal) 
from the following resume. Return JSON: {"skills": [...], "seniority": "..."}
```

### 3.2 Strategic Mapper
**Input:** UserProfile  
**Output:** SearchMatrix (10 hubs × 8 titles)  
**Logic:**
- Analyze skill density and seniority to recommend high-demand markets
- Generate role titles that bypass ATS filters (e.g., "Platform Engineer" vs. "DevOps Engineer")
- Prioritize hubs with verified salary transparency laws (CA, EU, NYC)

### 3.3 The Auditor (Dual-Score Heuristic)

#### Match Score (0-100)
```
Match = 0.50 × TechStackAlignment + 0.30 × SeniorityFit + 0.20 × EcosystemTools
```
- **TechStackAlignment:** Jaccard similarity between user skills and job requirements
- **SeniorityFit:** Penalize if job requires >2 years beyond user's level
- **EcosystemTools:** Bonus for domain-specific tools (e.g., Kubernetes for DevOps)

#### Hiring Probability (0-100)
```
HireProb = 0.40 × (1 - MarketSaturation) + 0.40 × StrategicValue + 0.20 × DomainFit
```
- **MarketSaturation:** Estimated applicant-to-opening ratio for hub+title
- **StrategicValue:** LLM-assessed alignment between user's past projects and company pain points
- **DomainFit:** Industry vertical match (FinTech, HealthTech, SaaS, etc.)

### 3.4 Financial Benchmarker

#### Explicit Salary Extraction
```python
def extract_salary(job_description: str) -> Optional[str]:
    # Regex patterns for "$120K-$160K", "€80,000-€100,000", etc.
    # Return None if not found
```

#### Inferred Salary Range
**Fallback Logic (if explicit salary missing):**
```python
def infer_salary(hub: str, title: str, seniority: str) -> Tuple[str, float]:
    prompt = f"""
    Estimate salary range for {title} ({seniority}) in {hub}.
    Return JSON: {{"range": "$X-$Y", "confidence": 0-100}}
    Use 2026 market data. Flag uncertainty if hub data is sparse.
    """
    # Returns: ("$130K-$170K", 78.5)
```

**Confidence Indicators:**
- 90-100%: Hub has mandatory salary disclosure laws
- 70-89%: Strong market data available
- 50-69%: Estimated from regional averages
- <50%: High uncertainty (displayed with warning icon)

### 3.5 Integrity Audit (Ghost Job Detection)

**Flagging Criteria:**
1. **Stale Posting:** `post_date` > 60 days ago
2. **URL Patterns:** Matches known "evergreen posting" domains
3. **Repost Detection:** Same company+title posted >3 times in 90 days
4. **Unreachable Links:** HTTP status ≠ 200 (checked via async HEAD requests)

**Action:** Jobs flagged as `is_ghost_job=True` are visually de-emphasized (grayed out, moved to bottom)

---

## 4. Persistence & UI (database.py & app.py)

### 4.1 Database Schema (SQLAlchemy)

#### Tables
```sql
users (
    user_id TEXT PRIMARY KEY,
    email TEXT,
    raw_resume TEXT,
    encrypted_api_key TEXT,  -- AES-256 encrypted Gemini API key
    created_at TIMESTAMP
)

sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(user_id),
    search_matrix JSON,  -- Serialized SearchMatrix
    created_at TIMESTAMP
)

discovered_jobs (
    job_id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES sessions(session_id),
    title TEXT,
    company TEXT,
    hub TEXT,
    salary_range TEXT,
    is_verified_salary BOOLEAN,
    salary_confidence FLOAT,
    match_score FLOAT,
    hire_probability FLOAT,
    url TEXT,
    post_date TIMESTAMP,
    is_ghost_job BOOLEAN,
    viewed_at TIMESTAMP,
    clicked_at TIMESTAMP
)
```

### 4.2 Recede Logic
**Behavior:** When a job URL is clicked:
1. Update `clicked_at` timestamp
2. Re-sort SERP: `ORDER BY clicked_at IS NULL DESC, hire_probability DESC`
3. Apply visual styling: `opacity: 0.6; filter: grayscale(50%)`

### 4.3 Streamlit UI (Dark Mode)

#### Layout
```
┌─────────────────────────────────────────┐
│  🎯 JobFlow AI  |  [Profile] [Logout]   │
├─────────────────────────────────────────┤
│  📄 Upload Resume  OR  🔗 Paste URL     │
│  [Analyze Profile]                      │
├─────────────────────────────────────────┤
│  ✏️ Edit Search Matrix (10×8 Grid)      │
│  [Start Discovery] [Export to Excel]    │
├─────────────────────────────────────────┤
│  🔍 SERP (High-Density Cards)           │
│  ┌─────────────────────────────────┐   │
│  │ Senior ML Engineer @ DeepMind   │   │
│  │ 🇬🇧 London | Posted 2h ago       │   │
│  │ 💰 £110K-£150K ✓ (Verified)     │   │
│  │ Match: 94% | Hire: 87%          │   │
│  │ [View Job] [Copy Link]          │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

#### Features
- **Google OAuth2:** Streamlit-authenticator integration
- **API Key Storage:** Encrypted with user-specific salt, stored in `users.encrypted_api_key`
- **Excel Export:** Pandas DataFrame → `.xlsx` with conditional formatting (high scores = green)
- **Copy Link:** Clipboard.js integration for one-click URL copying

---

## 5. Execution Process

### Phase 1: Profile Ingestion
1. User uploads resume (PDF/DOCX) or pastes text
2. Extract text → Store in `users.raw_resume`
3. Call Profile Analyzer → Extract skills + seniority

### Phase 2: Strategic Configuration
4. Generate SearchMatrix (10 hubs × 8 titles)
5. Display editable grid (Streamlit `st.data_editor`)
6. User modifies/approves → Save to `sessions.search_matrix`

### Phase 3: Async Job Discovery
7. For each (hub, title) pair:
   - Query job APIs (LinkedIn, Indeed, Adzuna, etc.)
   - Extract job metadata
   - Run Auditor (Match + HireProb scoring)
   - Run Financial Benchmarker (salary extraction/inference)
   - Run Integrity Audit (ghost job detection)
8. Store results in `discovered_jobs`

### Phase 4: SERP Rendering
9. Sort jobs: `unclicked DESC, hire_probability DESC`
10. Apply Recede Logic for previously clicked jobs
11. Display with salary confidence indicators and ghost job warnings

---

## 6. Security & Privacy

### 6.1 Encryption
- **API Keys:** AES-256-GCM with user-specific salt (derived from `user_id`)
- **Storage:** SQLite with WAL mode, file permissions `0600`

### 6.2 Data Retention
- Resume text: Retained until user deletion
- Job data: Auto-purge after 90 days (configurable)
- Session logs: Anonymized after 30 days

### 6.3 URL Validation
- All external URLs sanitized via `urllib.parse`
- HEAD requests timeout after 3s
- Suspicious domains (known scam sites) blocklisted

---

## 7. Technology Constraints

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Python | 3.11+ |
| UI Framework | Streamlit | 1.30+ |
| ORM | SQLAlchemy | 2.0+ |
| Validation | Pydantic | 2.5+ |
| LLM SDK | google-generativeai | 0.3+ |
| Auth | streamlit-authenticator | 0.2+ |
| Encryption | cryptography | 41.0+ |

---

## 8. Performance Targets

- **Profile Analysis:** <5s (Gemini Flash)
- **Matrix Generation:** <3s
- **Job Discovery:** <30s for 80 (hub, title) pairs (async parallelization)
- **SERP Rendering:** <1s for 500 jobs
- **Database Queries:** <100ms (indexed on `user_id`, `session_id`, `hire_probability`)

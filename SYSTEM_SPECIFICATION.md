# System Specification: JobFlow AI Career Discovery Engine
**Version:** 2.0  
**Architecture:** Python 3.11+ | Streamlit | SQLAlchemy | Pydantic | Google GenAI SDK  
**Last Updated:** 2026-01-29

---

## 1. Executive Summary
JobFlow is a production-grade career orchestration platform that transforms professional profiles into strategic job discovery campaigns. Unlike traditional job boards, it employs a **Resume-First Intelligence Model** where uploaded resume text serves as the analytical foundation for AI-driven market mapping, dual-score ranking, salary benchmarking, and ghost job detection.

---

## 2. UI/UX Design System - "Liquid Glass" Aesthetic

### 2.1 Design Philosophy

**Visual Language:** Liquid Glass (Glassmorphism + Depth)
- **Core Principle:** Premium, calming interface that feels like an AI co-pilot
- **Zero-UI Philosophy:** Anticipate user needs, adapt dynamically based on session history
- **Functional Minimalism:** Every element serves a purpose, no decorative bloat

### 2.2 Glassmorphism Specifications

**Glass Card Properties:**
```css
.glass-card {
    background: rgba(30, 37, 48, 0.7);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    box-shadow: 
        0 8px 32px 0 rgba(0, 0, 0, 0.37),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
}
```

**Frosted Background Layers:**
- **Layer 1 (Base):** `#0A0E14` (Deep space black)
- **Layer 2 (Gradient):** Radial gradient from `#1a1f2e` to `#0f1419`
- **Layer 3 (Noise):** Subtle grain texture (opacity: 0.03)
- **Layer 4 (Glow):** Accent color glow at 15% opacity

**Translucent Borders:**
- Default: `rgba(255, 255, 255, 0.1)`
- Hover: `rgba(76, 175, 80, 0.3)` (accent green)
- Active: `rgba(76, 175, 80, 0.5)`

### 2.3 Color Palette (WCAG 2026 Compliant)

**Primary Colors:**
- **Accent Green:** `#4CAF50` (AAA contrast on dark backgrounds)
- **Deep Space:** `#0A0E14` (background base)
- **Frosted Glass:** `rgba(30, 37, 48, 0.7)`

**Semantic Colors:**
- **Success:** `#66BB6A` (verified salary, high scores)
- **Warning:** `#FFB74D` (inferred salary, medium scores)
- **Error:** `#EF5350` (ghost jobs, low scores)
- **Info:** `#42A5F5` (neutral information)

**Text Hierarchy:**
- **Primary:** `#FAFAFA` (AAA contrast: 18.5:1)
- **Secondary:** `#B0BEC5` (AA contrast: 11.2:1)
- **Tertiary:** `#78909C` (AA contrast: 7.8:1)
- **Disabled:** `#546E7A` (minimum AA: 4.5:1)

### 2.4 Typography System

**Font Stack:**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
```

**Type Scale (1.250 - Major Third):**
- **H1:** 2.441rem (39px) - Page titles
- **H2:** 1.953rem (31px) - Section headers
- **H3:** 1.563rem (25px) - Card titles
- **Body:** 1rem (16px) - Default text
- **Small:** 0.8rem (13px) - Metadata, captions

**Font Weights:**
- **Light:** 300 (large headings only)
- **Regular:** 400 (body text)
- **Medium:** 500 (emphasis)
- **Semibold:** 600 (buttons, labels)
- **Bold:** 700 (critical alerts)

### 2.5 Spacing System (8px Base Unit)

**Scale:**
- **xs:** 4px (0.25rem)
- **sm:** 8px (0.5rem)
- **md:** 16px (1rem)
- **lg:** 24px (1.5rem)
- **xl:** 32px (2rem)
- **2xl:** 48px (3rem)
- **3xl:** 64px (4rem)

**Component Padding:**
- **Cards:** 24px (lg)
- **Buttons:** 12px 24px (sm lg)
- **Input Fields:** 16px (md)
- **Modals:** 32px (xl)

### 2.6 Micro-Interactions

**Animation Principles:**
- **Duration:** 200-300ms (snappy, not sluggish)
- **Easing:** `cubic-bezier(0.4, 0.0, 0.2, 1)` (Material Design standard)
- **Purpose:** Confirm actions, guide focus, provide feedback

**Interaction States:**
```css
/* Hover */
.interactive:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(76, 175, 80, 0.2);
    transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

/* Active/Click */
.interactive:active {
    transform: translateY(0);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

/* Focus (Accessibility) */
.interactive:focus-visible {
    outline: 2px solid #4CAF50;
    outline-offset: 4px;
}
```

**Loading States:**
- **Skeleton Screens:** Animated gradient shimmer
- **Spinners:** Circular progress with accent color
- **Progress Bars:** Smooth width transitions

### 2.7 Universal Intelligence Ingestor (Primary Component)

**Visual Hierarchy:**
1. **Search Bar (Hero Element):**
   - Width: 100% (max 800px)
   - Height: 64px
   - Glass effect with prominent border glow
   - Centered on page with 3xl vertical spacing

2. **Tab Selector:**
   - Pill-style tabs with glass background
   - Active tab: Solid accent color
   - Inactive tabs: Translucent with hover glow

3. **Input Area:**
   - Dynamic height based on content
   - Placeholder text with subtle animation
   - Auto-focus on page load

4. **Action Buttons:**
   - Primary: Solid accent green with white text
   - Secondary: Glass with accent border
   - Icon + Text for clarity

**Multimodal Input Indicators:**
- **Text:** ⚡ Lightning icon (instant)
- **File:** 💾 Disk icon (local)
- **URL:** ☁️ Cloud icon (remote)

### 2.8 Accessibility (WCAG 2026 Compliance)

**Color Contrast:**
- All text meets AAA standard (7:1 minimum)
- Interactive elements meet AA standard (4.5:1 minimum)
- Glassmorphic overlays tested with contrast analyzers

**Keyboard Navigation:**
- Tab order follows visual hierarchy
- Focus indicators visible on all interactive elements
- Escape key closes modals/overlays
- Arrow keys navigate lists

**Screen Reader Support:**
- ARIA labels on all dynamic content
- Live regions for status updates
- Semantic HTML5 elements
- Skip navigation links

**Motion Preferences:**
```css
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

### 2.9 Performance Targets

**Initial Paint:** <1s
- Critical CSS inlined
- Fonts preloaded
- Images lazy-loaded

**Interaction Response:** <100ms
- Debounced input handlers
- Optimistic UI updates
- Background data fetching

**Animation Frame Rate:** 60fps
- GPU-accelerated transforms
- Will-change hints for animated elements
- Throttled scroll handlers

---

## 3. Data Architecture (models.py)

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

### Phase 1: Multi-Modal Profile Ingestion

#### 1.1 Universal Ingestor Architecture
The ingestion layer supports three distinct input vectors, each with dedicated preprocessing pipelines:

**Input Vectors:**
1. **TEXT**: Direct string input (paste/type)
2. **FILES**: Local document uploads (PDF, DOCX)
3. **URLS**: External resources (web portfolios, Google Docs, cloud PDFs)

#### 1.2 Ingestion Logic Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    UNIVERSAL INGESTOR                        │
├─────────────────────────────────────────────────────────────┤
│  Input Type Detection → Route to Specialized Handler        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ TEXT Handler │  │ FILE Handler │  │  URL Handler │      │
│  │              │  │              │  │              │      │
│  │ • Trim       │  │ • PDF Extract│  │ • httpx GET  │      │
│  │ • Normalize  │  │ • DOCX Parse │  │ • BeautifulSp│      │
│  │ • Validate   │  │ • Decrypt    │  │ • GDrive API │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           ▼                                 │
│              ┌────────────────────────┐                     │
│              │  Preprocessing Layer   │                     │
│              │  • Markdown Normalize  │                     │
│              │  • Sanitize HTML       │                     │
│              │  • Remove PII Markers  │                     │
│              └────────────┬───────────┘                     │
│                           ▼                                 │
│              ┌────────────────────────┐                     │
│              │  Verification Display  │                     │
│              │  (User Approval Step)  │                     │
│              └────────────┬───────────┘                     │
│                           ▼                                 │
│              ┌────────────────────────┐                     │
│              │  Profile Analyzer      │                     │
│              │  (Gemini Flash)        │                     │
│              └────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

#### 1.3 Handler Specifications

**TEXT Handler (`ingest_text`)**
- Input: Raw string from `st.text_area`
- Processing:
  - Strip leading/trailing whitespace
  - Normalize line endings (`\r\n` → `\n`)
  - Validate minimum length (100 chars)
- Output: Clean UTF-8 string

**FILE Handler (`ingest_file`)**
- Supported Formats: `.pdf`, `.docx`
- Libraries:
  - PDF: `PyPDF2.PdfReader` (fallback to `pdfplumber` for encrypted PDFs)
  - DOCX: `python-docx.Document`
- Error Cases:
  - Password-protected PDFs → Prompt for password or reject
  - Corrupted files → Return specific error message
  - Unsupported formats → Display allowed extensions
- Output: Extracted text with preserved formatting markers

**URL Handler (`ingest_url`)**
- Supported Schemes: `http://`, `https://`, `docs.google.com`
- Processing Pipeline:
  1. **URL Validation** (`urllib.parse.urlparse`)
     - Reject: `file://`, `javascript:`, `data:` schemes
     - Sanitize: Remove tracking parameters
  2. **Type Detection**
     - Google Docs: Extract document ID → Use Google Drive API
     - PDF URLs: Download with `httpx` → Pass to FILE handler
     - Web Pages: Fetch HTML → Extract with BeautifulSoup
  3. **Network Call** (`httpx.AsyncClient`)
     - Timeout: 5 seconds
     - Follow redirects: Max 3 hops
     - User-Agent: `JobFlowAI/2.0 (Resume Parser)`
  4. **Content Extraction**
     - HTML: `BeautifulSoup.get_text()` with separator=`\n`
     - PDF: Binary download → `PyPDF2`
     - Google Docs: API response → Plain text conversion
- Error Cases:
  - Unreachable URL (timeout/404) → Display network error
  - SSL certificate errors → Warn user, allow override
  - Rate limiting (429) → Suggest retry after delay

#### 1.4 Preprocessing Layer

**Markdown Normalization:**
```python
def normalize_to_markdown(raw_text: str) -> str:
    """
    Convert extracted text to clean Markdown format.
    - Preserve headings (## Experience, ## Education)
    - Convert bullet points to Markdown lists
    - Remove excessive whitespace (>2 consecutive newlines)
    """
```

**HTML Sanitization:**
- Remove: `<script>`, `<style>`, `<iframe>` tags
- Preserve: Semantic structure (`<h1>`, `<p>`, `<ul>`)
- Library: `bleach.clean()` with allowed tags whitelist

**PII Marker Removal:**
- Strip: Email signatures, phone number formatting artifacts
- Preserve: Actual contact information content

#### 1.5 Verification Step (UI)

**Display Components:**
- Collapsible text preview (first 500 chars + "Show More")
- Character count badge
- Detected language indicator (via `langdetect`)
- **Action Buttons:**
  - ✅ "Confirm & Analyze" → Proceed to Profile Analyzer
  - ✏️ "Edit Text" → Return to input with pre-filled content
  - 🗑️ "Discard & Restart" → Clear session state

#### 1.6 Error Handling Matrix

| Error Type | User Feedback | Recovery Action |
|------------|---------------|-----------------|
| Empty input | "Resume text cannot be empty" | Re-prompt input |
| File too large (\u003e10MB) | "File exceeds 10MB limit" | Suggest compression |
| Unsupported format | "Only PDF and DOCX supported" | Display format list |
| URL timeout | "Could not reach URL after 5s" | Retry button + manual paste option |
| Encrypted PDF | "PDF is password-protected" | Password input field |
| Google Docs private | "Document not publicly accessible" | Share settings guide |
| Network error | "Connection failed. Check internet." | Offline mode suggestion |

#### 1.7 Data Flow Summary

1. **Input Reception** → Detect type (text/file/URL)
2. **Specialized Extraction** → Route to appropriate handler
3. **Preprocessing** → Normalize to Markdown
4. **Verification Display** → User approval checkpoint
5. **Storage** → Save to `users.raw_resume`
6. **Analysis Trigger** → Call Profile Analyzer (Gemini Flash)

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

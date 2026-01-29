# 🎯 JobFlow AI - Career Discovery Engine

**Version:** 2.0  
**Architecture:** Python 3.11+ | Streamlit | SQLAlchemy | Pydantic | Google GenAI  
**Status:** Production-Ready

---

## 📋 Overview

JobFlow AI is a **production-grade career orchestration platform** that transforms resume analysis into strategic job discovery campaigns. Unlike traditional job boards, it employs AI-driven market mapping, dual-score ranking, salary benchmarking with confidence indicators, and ghost job detection.

### Key Features

✅ **Resume-First Intelligence** - AI extracts tech stack and seniority automatically  
✅ **Strategic Matrix** - 10 hubs × 8 titles = 80 targeted search vectors  
✅ **Dual-Score Ranking** - Match Score (Technical Alignment) + Hiring Probability (Success Prediction)  
✅ **Salary Benchmarking** - Explicit extraction + AI-inferred ranges with confidence scores  
✅ **Ghost Job Detection** - Filter out stale/suspicious postings via posting age, URL patterns, and reachability checks  
✅ **Recede Logic** - Clicked jobs visually de-emphasize and sink to bottom of SERP  
✅ **Dark Mode UI** - Premium Streamlit interface with gradient cards and responsive design  
✅ **Excel Export** - Download results with conditional formatting

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        app.py (Streamlit UI)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Upload Resume│  │ Edit Matrix  │  │ SERP Results │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌────────────────┐ ┌────────────┐ ┌──────────────┐
│   models.py    │ │ engine.py  │ │ database.py  │
│  (Pydantic)    │ │ (Gemini AI)│ │ (SQLAlchemy) │
└────────────────┘ └────────────┘ └──────────────┘
```

### Core Modules

| Module | Purpose |
|--------|---------|
| `models.py` | Pydantic schemas (UserProfile, SearchMatrix, JobOpportunity) + SQLAlchemy ORM |
| `engine.py` | AI orchestration (profile analysis, scoring, salary inference, ghost detection) |
| `database.py` | Persistence layer with encryption and Recede Logic sorting |
| `app.py` | Streamlit UI with dark mode theme and interactive components |

---

## 🚀 Installation

### Prerequisites

- **Python 3.11+**
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/Job-flow.git
   cd Job-flow
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   ```bash
   # Copy example file
   cp .env.example .env
   
   # Edit .env and add your Gemini API key
   # GEMINI_API_KEY=your_actual_api_key_here
   ```

5. **Initialize database:**
   ```bash
   python -c "from database import init_db; init_db()"
   ```

6. **Run the application:**
   ```bash
   streamlit run app.py
   ```

7. **Open browser:**
   Navigate to `http://localhost:8501`

---

## 📖 Usage Guide

### Step 1: Authentication
- Enter your **Google Gemini API Key**
- Provide an email for session tracking
- Click **Start Discovery**

### Step 2: Upload Resume
- **Option A:** Upload PDF/DOCX file
- **Option B:** Paste resume text directly
- Click **Analyze Profile**
- Verify extracted skills and seniority

### Step 3: Generate Search Matrix
- Navigate to **Edit Matrix** in sidebar
- Click **Generate Strategic Matrix**
- Review 10 geographic hubs and 8 job titles
- Edit/add/remove entries as needed
- Click **Save Matrix**

### Step 4: Discover Jobs
- Navigate to **Job Results**
- Click **Start Discovery** (simulated in demo)
- Filter by:
  - Minimum Match Score
  - Show/Hide Clicked Jobs
  - Hide Ghost Jobs
- Click **View Job** to open posting (marks as clicked)
- Click **Copy Link** to get URL
- Export results to Excel

---

## 🧠 AI Intelligence

### Profile Analyzer (Gemini Flash)
Extracts:
- **Technical Skills:** Languages, frameworks, tools, cloud platforms
- **Seniority Level:** Junior | Mid | Senior | Lead | Principal

### Strategic Mapper (Gemini Flash)
Generates:
- **10 Geographic Hubs:** High-demand markets with salary transparency
- **8 Optimized Titles:** ATS-bypass job titles aligned with seniority

### Dual-Score Heuristic (Gemini Pro)

#### Match Score (0-100)
```
Match = 50% × TechStackAlignment + 30% × SeniorityFit + 20% × EcosystemTools
```

#### Hiring Probability (0-100)
```
HireProb = 40% × (1 - MarketSaturation) + 40% × StrategicValue + 20% × DomainFit
```

### Financial Benchmarker

#### Explicit Salary Extraction
- Regex patterns for `$120K-$160K`, `€80K-€100K`, `£110K-£150K`
- Marked as **Verified** if found in job description

#### Inferred Salary (Gemini Flash)
- Fallback when explicit salary missing
- Returns: `(salary_range, confidence_score)`
- Confidence indicators:
  - **90-100%:** Mandatory disclosure laws (CA, EU, NYC)
  - **70-89%:** Strong market data
  - **50-69%:** Regional averages
  - **<50%:** High uncertainty (⚠️ warning icon)

### Ghost Job Detection

Flags jobs if:
1. **Stale Posting:** >60 days old
2. **Suspicious URL:** Matches known scam domains
3. **Unreachable:** HTTP status ≠ 200 (async HEAD request)

**Action:** Grayed out, moved to bottom, marked with ⚠️

---

## 🎨 UI Features

### Dark Mode Theme
- **Background:** `#0E1117` (deep charcoal)
- **Cards:** Gradient `#1E2530` → `#252D3A`
- **Accent:** `#4CAF50` (vibrant green)
- **Hover Effects:** Smooth transitions with glow

### Job Cards
- **Title & Company:** Prominent display
- **Metadata:** Location, posting date, salary
- **Score Badges:** Color-coded (green/orange/red)
- **Ghost Warning:** Red badge for flagged jobs
- **Recede Logic:** Clicked jobs = 60% opacity + grayscale

### Excel Export
- Conditional formatting (high scores = green cells)
- Auto-adjusted column widths
- Includes all metadata (scores, salary, URL)

---

## 🔒 Security

### API Key Encryption
- **Algorithm:** AES-256-GCM
- **Key Derivation:** PBKDF2 with user-specific salt
- **Storage:** Encrypted in SQLite `users.encrypted_api_key`

### Data Privacy
- Resume text retained until user deletion
- Job data auto-purged after 90 days (configurable)
- Session logs anonymized after 30 days

### URL Validation
- All external URLs sanitized via `urllib.parse`
- HEAD requests timeout after 3s
- Known scam domains blocklisted

---

## 📊 Database Schema

```sql
users (
    user_id TEXT PRIMARY KEY,
    email TEXT,
    raw_resume TEXT,
    encrypted_api_key TEXT,
    created_at TIMESTAMP
)

sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(user_id),
    search_matrix JSON,
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

**Indexes:**
- `idx_sessions_user_id` on `sessions(user_id)`
- `idx_jobs_session_id` on `discovered_jobs(session_id)`
- `idx_jobs_hire_probability` on `discovered_jobs(hire_probability DESC)`
- `idx_jobs_clicked_at` on `discovered_jobs(clicked_at)`

---

## 🧪 Testing

```bash
# Install test dependencies
pip install pytest pytest-cov pytest-asyncio

# Run tests
pytest tests/ -v --cov=. --cov-report=html

# View coverage report
open htmlcov/index.html
```

---

## 🚢 Deployment

### Streamlit Cloud
1. Push code to GitHub
2. Connect repository to [Streamlit Cloud](https://streamlit.io/cloud)
3. Add secrets in dashboard:
   ```toml
   GEMINI_API_KEY = "your_key"
   ENCRYPTION_MASTER_KEY = "your_32_byte_key"
   ```
4. Deploy!

### Docker
```bash
# Build image
docker build -t jobflow-ai .

# Run container
docker run -p 8501:8501 \
  -e GEMINI_API_KEY=your_key \
  -e ENCRYPTION_MASTER_KEY=your_key \
  jobflow-ai
```

---

## 📝 Documentation

- **System Specification:** `SYSTEM_SPECIFICATION.md`
- **Project Guide:** `PROJECT_GUIDE.md`
- **API Reference:** See docstrings in `engine.py`, `database.py`

---

## 🛠️ Development

### Code Quality Standards
- **Type Hints:** All functions annotated
- **Docstrings:** Google-style for public functions
- **Error Handling:** Specific exceptions (no bare `except`)
- **Logging:** `logging` module (DEBUG for dev, INFO for prod)
- **Testing:** Minimum 80% code coverage

### Git Workflow
- **Branch Naming:** `feature/salary-benchmarking`, `fix/ghost-job-detection`
- **Commit Messages:** `feat: Add salary confidence indicators`, `fix: Handle missing job URLs`
- **PR Template:** Include "Spec Updated: Yes/No" checkbox

---

## 🗺️ Roadmap

- [ ] **Multi-Resume Support:** Maintain multiple profiles (e.g., "Backend Focus" vs. "ML Focus")
- [ ] **Job Alerts:** Email notifications for new high-probability matches
- [ ] **Application Tracking:** Mark jobs as "Applied" → separate pipeline view
- [ ] **Salary Negotiation Assistant:** LLM-powered counter-offer generator
- [ ] **Interview Prep:** Auto-generate technical questions from job descriptions
- [ ] **Company Research:** Scrape Glassdoor/Blind for culture insights
- [ ] **Referral Finder:** LinkedIn API integration for mutual connections

---

## 📄 License

MIT License - See `LICENSE` file for details

---

## 🙏 Acknowledgments

- **Google Gemini:** AI-powered intelligence engine
- **Streamlit:** Rapid UI development framework
- **SQLAlchemy:** Robust ORM for data persistence
- **Pydantic:** Type-safe data validation

---

## 📧 Contact

For questions or support, please open an issue on GitHub.

**Built with ❤️ for job seekers navigating the modern tech market**

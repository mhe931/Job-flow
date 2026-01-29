# JobFlow AI - Changelog

## Version 2.0 - Complete Python Rewrite (2026-01-29)

### 🎯 Major Architectural Changes

#### Framework Migration
- **FROM:** React 19 + TypeScript + Tailwind CSS
- **TO:** Python 3.11+ + Streamlit + SQLAlchemy + Pydantic

#### Data Architecture
**NEW:** Production-grade data models with type safety
- `models.py`: Pydantic schemas (UserProfile, SearchMatrix, JobOpportunity) + SQLAlchemy ORM
- Validation rules for all fields (e.g., seniority must be in predefined enum)
- Proper relationships between User → Session → DiscoveredJob tables

#### Intelligence Engine
**NEW:** `engine.py` with comprehensive AI orchestration
- **Profile Analyzer:** Extract skills + seniority from resume text (Gemini Flash)
- **Strategic Mapper:** Generate 10 hubs × 8 titles matrix (Gemini Flash)
- **Dual-Score Heuristic:**
  - Match Score: 50% TechStack + 30% Seniority + 20% Ecosystem
  - Hiring Probability: 40% MarketSaturation + 40% StrategicValue + 20% DomainFit
- **Financial Benchmarker:**
  - Explicit salary extraction via regex ($120K-$160K, €80K-€100K, £110K-£150K)
  - AI-inferred salary with confidence scores (90-100% for disclosure law regions)
- **Ghost Job Detection:**
  - Stale postings (>60 days)
  - Suspicious URL patterns
  - Async reachability checks (HTTP HEAD requests)

#### Persistence Layer
**NEW:** `database.py` with SQLAlchemy + encryption
- **AES-256-GCM encryption** for API keys with user-specific salts (PBKDF2)
- **Recede Logic:** Clicked jobs sorted to bottom via `ORDER BY clicked_at IS NULL DESC`
- **Indexes:** Optimized queries on user_id, session_id, hire_probability
- **Auto-purge:** Jobs older than 90 days (configurable)

#### User Interface
**NEW:** `app.py` Streamlit application with dark mode
- **Pages:**
  - Login (API key setup)
  - Upload Resume (PDF/DOCX or text paste)
  - Edit Matrix (10×8 editable grid with `st.data_editor`)
  - SERP (job cards with Recede Logic)
- **Styling:**
  - Dark mode: `#0E1117` background, `#4CAF50` accent
  - Gradient job cards with hover effects
  - Color-coded score badges (green/orange/red)
  - Ghost job warnings (red badge)
  - Clicked jobs: 60% opacity + grayscale filter
- **Features:**
  - Excel export with conditional formatting
  - Copy link buttons
  - Filters (min match score, show/hide clicked, hide ghost jobs)

---

### 📝 Documentation Updates

#### SYSTEM_SPECIFICATION.md
**UPDATED:** Complete rewrite to reflect Python architecture
- Added Pydantic schema definitions with code examples
- Documented dual-score formulas with mathematical notation
- Added salary inference confidence tiers (90-100%, 70-89%, 50-69%, <50%)
- Documented ghost job detection criteria
- Added database schema with SQL table definitions
- Added performance targets (<5s profile analysis, <30s job discovery)

#### PROJECT_GUIDE.md
**UPDATED:** Comprehensive development guide
- Added module architecture breakdown (models, engine, database, app)
- Documented AI orchestration strategy with prompt templates
- Added 7-day implementation workflow (Phase 1-4)
- Included data flow diagram
- Added environment variables template
- Deployment checklist (Streamlit Cloud, Docker)
- Code quality standards (type hints, docstrings, error handling)
- Git workflow guidelines

#### README.md
**UPDATED:** User-facing documentation
- Installation instructions (virtual environment, dependencies)
- Usage guide (4-step process: auth → upload → matrix → discover)
- AI intelligence explanation (analyzers, mappers, scorers)
- UI features showcase (dark mode, job cards, Excel export)
- Security details (encryption, data retention, URL validation)
- Database schema visualization
- Testing and deployment instructions

---

### 🔧 Configuration Files

#### NEW: requirements.txt
Production dependencies:
- streamlit>=1.30.0
- pydantic>=2.5.0
- sqlalchemy>=2.0.0
- google-generativeai>=0.3.0
- cryptography>=41.0.0
- PyPDF2, python-docx, pandas, openpyxl, httpx

#### NEW: .env.example
Environment variables template:
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (OAuth2)
- GEMINI_API_KEY
- DATABASE_URL (SQLite)
- ENCRYPTION_MASTER_KEY (32-byte key)

#### NEW: .streamlit/config.toml
Dark mode theme configuration:
- Primary color: #4CAF50 (green)
- Background: #0E1117 (charcoal)
- Secondary background: #1E2530 (slate)
- Text color: #FAFAFA (off-white)

#### UPDATED: .gitignore
Python-specific patterns:
- Virtual environments (venv/, env/)
- Database files (*.db, *.sqlite)
- Python cache (__pycache__/, *.pyc)
- Legacy React/TypeScript files excluded

---

### 🚀 New Features

1. **Resume Upload Options**
   - PDF parsing (PyPDF2)
   - DOCX parsing (python-docx)
   - Direct text paste

2. **Salary Transparency**
   - Explicit extraction from job descriptions
   - AI-inferred ranges with confidence percentages
   - Visual indicators (✓ for verified, 📊/⚠️ for inferred)

3. **Ghost Job Protection**
   - Multi-criteria detection (age, URL, reachability)
   - Visual warnings (⚠️ badge)
   - Auto-sort to bottom of SERP

4. **Recede Logic**
   - Clicked jobs visually de-emphasize (grayscale + opacity)
   - Automatic re-sorting to bottom
   - Preserves interaction history

5. **Excel Export**
   - Pandas DataFrame generation
   - Conditional formatting (green for high scores)
   - Auto-adjusted column widths
   - Includes all metadata (scores, salary, URL)

---

### 🔐 Security Enhancements

1. **API Key Encryption**
   - AES-256-GCM with user-specific salts
   - PBKDF2 key derivation (100,000 iterations)
   - Encrypted storage in SQLite

2. **URL Validation**
   - Sanitization via urllib.parse
   - Async HEAD requests with 3s timeout
   - Scam domain blocklist

3. **Data Retention**
   - Resume text: User-controlled deletion
   - Job data: Auto-purge after 90 days
   - Session logs: Anonymized after 30 days

---

### 🗑️ Removed/Deprecated

- React 19 frontend (App.tsx, components/)
- TypeScript type definitions (types.ts)
- Vite build configuration (vite.config.ts)
- localStorage-based "SQLite Mirror" (replaced with real SQLite)
- Node.js dependencies (package.json)

---

### 📊 Performance Metrics

**Target Performance:**
- Profile Analysis: <5s (Gemini Flash)
- Matrix Generation: <3s (Gemini Flash)
- Job Discovery: <30s for 80 (hub, title) pairs (async parallelization)
- SERP Rendering: <1s for 500 jobs
- Database Queries: <100ms (indexed on user_id, session_id, hire_probability)

---

### 🧪 Testing Infrastructure

**NEW:** Test framework setup
- pytest for unit tests
- pytest-cov for coverage reports
- pytest-asyncio for async function testing
- Target: 80% code coverage

---

### 🚢 Deployment Options

**NEW:** Multiple deployment paths
1. **Streamlit Cloud:** One-click deployment with secrets management
2. **Docker:** Containerized deployment with environment variables
3. **Local:** Virtual environment with SQLite database

---

### 📚 Developer Experience

**NEW:** Comprehensive development guidelines
- Type hints mandatory for all functions
- Google-style docstrings for public functions
- Specific exception handling (no bare `except`)
- Logging module (DEBUG for dev, INFO for prod)
- Git workflow (branch naming, commit messages, PR template)

---

### 🔮 Roadmap (Future Enhancements)

Planned features:
- [ ] Multi-resume support (multiple profiles per user)
- [ ] Job alerts (email notifications)
- [ ] Application tracking ("Applied" status)
- [ ] Salary negotiation assistant (LLM-powered)
- [ ] Interview prep (auto-generate technical questions)
- [ ] Company research (Glassdoor/Blind scraping)
- [ ] Referral finder (LinkedIn API integration)

---

## Migration Notes

### For Developers

**Breaking Changes:**
- All React/TypeScript code is deprecated
- New Python environment required (Python 3.11+)
- Google Gemini API key now mandatory (no fallback)
- Database schema incompatible with old localStorage structure

**Migration Steps:**
1. Archive old React codebase (create `legacy/` branch)
2. Set up Python virtual environment
3. Install dependencies from `requirements.txt`
4. Configure `.env` with API keys
5. Initialize database: `python -c "from database import init_db; init_db()"`
6. Run application: `streamlit run app.py`

### For Users

**No Action Required:**
- Old localStorage data will not be migrated (fresh start)
- New login flow with API key entry
- Resume must be re-uploaded for analysis

---

## Acknowledgments

**Rewrite Completed By:** Senior AI & Data Engineer  
**Date:** 2026-01-29  
**Frameworks Used:** Python, Streamlit, SQLAlchemy, Pydantic, Google GenAI SDK  
**Documentation Standard:** Master's-level technical writing with zero conversational filler

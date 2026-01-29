# JobFlow AI - Deployment Guide

## 🚀 Quick Start (3 Options)

### Option 1: Local Development (Recommended for Testing)
### Option 2: Docker (Recommended for Production)
### Option 3: Streamlit Cloud (Easiest Deployment)

---

## 📦 Option 1: Local Development

### Prerequisites
- **Python 3.11+** ([Download](https://www.python.org/downloads/))
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))

### Step-by-Step Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/Job-flow.git
cd Job-flow
```

#### 2. Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 4. Configure Environment Variables
```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

Edit `.env` file:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
ENCRYPTION_MASTER_KEY=your_32_byte_encryption_key_here
DATABASE_URL=sqlite:///jobflow.db
```

**Generate Encryption Key:**
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

#### 5. Initialize Database
```bash
python -c "from database import init_db; init_db()"
```

#### 6. Run the Application
```bash
streamlit run app.py
```

#### 7. Open Browser
Navigate to: **http://localhost:8501**

---

## 🐳 Option 2: Docker Deployment

### Prerequisites
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop))
- **Docker Compose** (included with Docker Desktop)

### Method A: Docker Compose (Recommended)

#### 1. Clone Repository
```bash
git clone https://github.com/yourusername/Job-flow.git
cd Job-flow
```

#### 2. Create Environment File
```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

Edit `.env`:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
ENCRYPTION_MASTER_KEY=your_32_byte_encryption_key_here
```

#### 3. Build and Run
```bash
docker-compose up -d
```

#### 4. Check Status
```bash
docker-compose ps
docker-compose logs -f jobflow
```

#### 5. Access Application
Navigate to: **http://localhost:8501**

#### 6. Stop Application
```bash
docker-compose down
```

#### 7. Stop and Remove Data
```bash
docker-compose down -v  # WARNING: Deletes database!
```

---

### Method B: Docker CLI (Manual)

#### 1. Build Image
```bash
docker build -t jobflow-ai:latest .
```

#### 2. Create Volume for Database
```bash
docker volume create jobflow-data
```

#### 3. Run Container
```bash
docker run -d \
  --name jobflow-ai \
  -p 8501:8501 \
  -e GEMINI_API_KEY=your_api_key_here \
  -e ENCRYPTION_MASTER_KEY=your_encryption_key_here \
  -v jobflow-data:/app/data \
  --restart unless-stopped \
  jobflow-ai:latest
```

#### 4. View Logs
```bash
docker logs -f jobflow-ai
```

#### 5. Stop Container
```bash
docker stop jobflow-ai
docker rm jobflow-ai
```

---

## ☁️ Option 3: Streamlit Cloud

### Prerequisites
- **GitHub Account**
- **Streamlit Cloud Account** ([Sign up](https://streamlit.io/cloud))

### Deployment Steps

#### 1. Push Code to GitHub
```bash
git add .
git commit -m "feat: Production-ready JobFlow AI"
git push origin main
```

#### 2. Connect to Streamlit Cloud
1. Go to [share.streamlit.io](https://share.streamlit.io)
2. Click **"New app"**
3. Select your repository: `yourusername/Job-flow`
4. Set **Main file path:** `app.py`
5. Click **"Advanced settings"**

#### 3. Add Secrets
In the **Secrets** section, add:
```toml
GEMINI_API_KEY = "your_actual_gemini_api_key_here"
ENCRYPTION_MASTER_KEY = "your_32_byte_encryption_key_here"
DATABASE_URL = "sqlite:///jobflow.db"
```

#### 4. Deploy
Click **"Deploy!"**

#### 5. Access Your App
Your app will be available at: `https://yourusername-job-flow-app-xxxxx.streamlit.app`

---

## 🔧 Configuration Options

### Streamlit Configuration (.streamlit/config.toml)

```toml
[theme]
primaryColor="#4CAF50"
backgroundColor="#0E1117"
secondaryBackgroundColor="#1E2530"
textColor="#FAFAFA"
font="sans serif"

[server]
headless = true
port = 8501
enableCORS = false
enableXsrfProtection = true
maxUploadSize = 10  # MB

[browser]
gatherUsageStats = false
```

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | ✅ Yes | None |
| `ENCRYPTION_MASTER_KEY` | 32-byte encryption key | ✅ Yes | None |
| `DATABASE_URL` | SQLite database path | ❌ No | `sqlite:///jobflow.db` |
| `GOOGLE_CLIENT_ID` | OAuth2 client ID (future) | ❌ No | None |
| `GOOGLE_CLIENT_SECRET` | OAuth2 secret (future) | ❌ No | None |

---

## 🧪 Testing the Deployment

### 1. Health Check (Docker)
```bash
# Docker Compose
docker-compose exec jobflow curl http://localhost:8501/_stcore/health

# Docker CLI
docker exec jobflow-ai curl http://localhost:8501/_stcore/health
```

Expected response: `{"status": "ok"}`

### 2. Database Verification
```bash
# Local
python -c "from database import get_user; print('DB OK' if get_user('test') is None else 'DB ERROR')"

# Docker
docker-compose exec jobflow python -c "from database import init_db; init_db(); print('DB Initialized')"
```

### 3. API Key Test
```bash
# Local
python -c "from engine import set_api_key; set_api_key('test'); print('API Key Set')"
```

---

## 📊 Monitoring & Logs

### Local Development
```bash
# Streamlit logs are displayed in terminal
streamlit run app.py
```

### Docker Compose
```bash
# View real-time logs
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100

# View specific service
docker-compose logs -f jobflow
```

### Docker CLI
```bash
# View logs
docker logs -f jobflow-ai

# View last 50 lines
docker logs --tail=50 jobflow-ai
```

---

## 🔄 Updating the Application

### Local Development
```bash
git pull origin main
pip install -r requirements.txt
streamlit run app.py
```

### Docker Compose
```bash
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Docker CLI
```bash
git pull origin main
docker stop jobflow-ai
docker rm jobflow-ai
docker build -t jobflow-ai:latest .
docker run -d \
  --name jobflow-ai \
  -p 8501:8501 \
  -e GEMINI_API_KEY=your_api_key \
  -e ENCRYPTION_MASTER_KEY=your_key \
  -v jobflow-data:/app/data \
  --restart unless-stopped \
  jobflow-ai:latest
```

### Streamlit Cloud
1. Push changes to GitHub: `git push origin main`
2. Streamlit Cloud auto-deploys (usually within 1-2 minutes)

---

## 🛡️ Security Best Practices

### 1. API Key Management
- **Never commit** `.env` file to Git
- Use **environment variables** or **secrets management** (Docker secrets, Streamlit secrets)
- Rotate keys regularly (every 90 days)

### 2. Encryption Key
- Generate unique key per deployment:
  ```bash
  python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
  ```
- Store securely (password manager, secrets vault)

### 3. Database Backup
```bash
# Local
cp jobflow.db jobflow_backup_$(date +%Y%m%d).db

# Docker
docker cp jobflow-ai:/app/data/jobflow.db ./jobflow_backup_$(date +%Y%m%d).db
```

### 4. HTTPS (Production)
- Use reverse proxy (Nginx, Caddy) with SSL certificate
- Or deploy to Streamlit Cloud (HTTPS included)

---

## 🐛 Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'streamlit'"
**Solution:**
```bash
# Ensure virtual environment is activated
pip install -r requirements.txt
```

### Issue: "Database is locked"
**Solution:**
```bash
# Stop all instances of the app
# Delete jobflow.db and reinitialize
python -c "from database import init_db; init_db()"
```

### Issue: "Invalid API key"
**Solution:**
- Verify your Gemini API key at [Google AI Studio](https://makersuite.google.com/app/apikey)
- Check `.env` file has correct key (no quotes, no spaces)

### Issue: Docker container exits immediately
**Solution:**
```bash
# Check logs
docker-compose logs jobflow

# Common causes:
# 1. Missing environment variables
# 2. Port 8501 already in use
# 3. Database initialization failed
```

### Issue: "Permission denied" (Linux/macOS)
**Solution:**
```bash
# Fix database directory permissions
sudo chown -R $USER:$USER .
chmod 755 .
```

---

## 📈 Performance Optimization

### 1. Database Optimization
```bash
# Enable WAL mode (already configured)
# Vacuum database periodically
python -c "from database import SessionLocal; db = SessionLocal(); db.execute('VACUUM'); db.close()"
```

### 2. Docker Image Size
```bash
# Check image size
docker images jobflow-ai

# Optimize by removing build dependencies
# (already done in multi-stage Dockerfile)
```

### 3. Streamlit Caching
```python
# Already implemented in app.py
@st.cache_data
def expensive_function():
    pass
```

---

## 🚀 Production Deployment Checklist

- [ ] Environment variables configured (`.env` or secrets)
- [ ] Encryption key generated and stored securely
- [ ] Database initialized (`init_db()`)
- [ ] Health check endpoint responding (`/_stcore/health`)
- [ ] HTTPS enabled (reverse proxy or Streamlit Cloud)
- [ ] Database backup strategy in place
- [ ] Monitoring/logging configured
- [ ] API rate limits considered (Gemini API)
- [ ] Error handling tested (invalid API key, network issues)
- [ ] User documentation updated (README.md)

---

## 📞 Support

- **Documentation:** `README.md`, `SYSTEM_SPECIFICATION.md`, `PROJECT_GUIDE.md`
- **Issues:** [GitHub Issues](https://github.com/yourusername/Job-flow/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/Job-flow/discussions)

---

**Last Updated:** 2026-01-29  
**Version:** 2.0

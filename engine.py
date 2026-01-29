"""
JobFlow AI - Intelligence Engine
Profile analysis, strategic mapping, dual-score heuristics, salary benchmarking, and ghost job detection.
"""

import os
import re
import json
import asyncio
from datetime import datetime, timedelta
from typing import List, Tuple, Optional, Dict
from urllib.parse import urlparse
import httpx
from google import genai
from models import UserProfile, SearchMatrix, JobOpportunity
from google.genai.types import GenerateContentConfig

# ============================================================================
# CONFIGURATION
# ============================================================================

# Ghost job detection patterns
GHOST_JOB_DOMAINS = [
    'fake-jobs.com',
    'scam-careers.net',
    # Add known scam domains
]

GHOST_JOB_AGE_DAYS = 60

# ============================================================================
# MODEL MANAGEMENT
# ============================================================================

def get_prioritized_models(api_key: str) -> List[str]:
    """
    Return a list of available models sorted by priority.
    """
    if not api_key:
        return ['gemini-1.5-flash']

    client = genai.Client(api_key=api_key)
    try:
        available_models = []
        full_model_names = []
        print(f"DEBUG: Listing models for key ending in ...{api_key[-4:] if api_key else 'None'}")
        
        for m in client.models.list():
            # Handle unified SDK attribute variations
            supports_generation = False
            
            # Check for supported_generation_methods (snake_case)
            if hasattr(m, 'supported_generation_methods'):
                 if 'generateContent' in m.supported_generation_methods:
                     supports_generation = True
            # Check for supportedGenerationMethods (camelCase)
            elif hasattr(m, 'supportedGenerationMethods'):
                 if 'generateContent' in m.supportedGenerationMethods:
                     supports_generation = True
            # Fallback: Assume Gemini models support generation if we can't tell
            elif 'gemini' in m.name:
                supports_generation = True
                
            if supports_generation:
                full_model_names.append(m.name)
                name = m.name.replace('models/', '')
                available_models.append(name)

        priority_queue = [
            'gemini-3-flash',
            'gemini-2.5-pro',
            'gemini-1.5-flash-latest',
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'gemini-1.5-flash-001',
            'gemini-1.5-flash-002',
            'gemini-2.0-flash-exp',
            'gemini-pro',
            'gemini-1.0-pro'
        ]

        # Build prioritized list of usable models
        usable_models = []
        
        # 1. Add priority matches
        for model in priority_queue:
            if model in available_models:
                usable_models.append(model)
        
            # Try full name variant
            full_target = f"models/{model}"
            if full_target in full_model_names:
                usable_models.append(full_target)

        # 2. Add remaining Gemini models
        for m in available_models:
            if 'gemini' in m and m not in usable_models:
                usable_models.append(m)

        # 3. Add absolute fallback
        if not usable_models and available_models:
            usable_models.append(available_models[0])
            
        if not usable_models:
            return ['gemini-1.5-flash']
            
        return usable_models
        
    except Exception as e:
        print(f"ERROR: Model list failed: {e}")
        return ['gemini-1.5-flash']


def get_best_model(api_key: str) -> str:
    """Wrapper to get just the top model (for backward compatibility)."""
    models = get_prioritized_models(api_key)
    return models[0] if models else 'gemini-1.5-flash'


def generate_with_retry(client: genai.Client, prompt: str, api_key: str, config=None) -> Any:
    """
    Attempt generation with the best model, falling back to others on quota error (429).
    """
    candidates = get_prioritized_models(api_key)
    last_error = None
    
    for model in candidates:
        try:
            print(f"DEBUG: Attempting generation with {model}...")
            if config:
                return client.models.generate_content(model=model, contents=prompt, config=config)
            else:
                return client.models.generate_content(model=model, contents=prompt)
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                print(f"WARN: Quota exceeded for {model}. Falling back to next candidate...")
                last_error = e
                continue
            else:
                # Non-quota error (e.g. block refusal), don't retry extensively
                raise e
    
    if last_error:
        raise last_error
    raise ValueError("No models available for generation.")

def _generate_json_content(client: genai.Client, prompt: str, api_key: str) -> Optional[Dict]:
    """Helper to generate JSON content safely using retry logic."""
    try:
        response = generate_with_retry(
            client=client,
            prompt=prompt,
            api_key=api_key,
            config=GenerateContentConfig(response_mime_type="application/json")
        )
        return json.loads(response.text.strip())
    except Exception as e:
        # Fallback to text parsing if JSON mode fails or returns text
        try:
             # Retry without strict JSON mode if needed or just parse text
             # If the first failed, it might be a block refusal or network error
             if hasattr(e, 'message'):
                print(f"GenAI Error: {e.message}")
             return None
        except:
            return None


# ============================================================================
# UNIVERSAL INGESTOR - MULTI-MODAL RESUME INGESTION
# ============================================================================

import PyPDF2
import pdfplumber
from docx import Document
from bs4 import BeautifulSoup
import bleach
from io import BytesIO


def ingest_text(raw_input: str) -> str:
    """
    Process direct text input.
    
    Args:
        raw_input: Raw string from st.text_area
        
    Returns:
        Clean UTF-8 string
        
    Raises:
        ValueError: If input is empty or too short (<100 chars)
    """
    # Strip whitespace
    text = raw_input.strip()
    
    # Normalize line endings
    text = text.replace('\r\n', '\n')
    
    # Validate minimum length
    if len(text) < 100:
        raise ValueError("Resume must be at least 100 characters")
        
    return text


def ingest_file(uploaded_file, password: Optional[str] = None) -> str:
    """
    Extract text from PDF or DOCX files.
    
    Args:
        uploaded_file: Streamlit UploadedFile object
        password: Optional password for encrypted PDFs
        
    Returns:
        Extracted text content
        
    Raises:
        ValueError: Unsupported format, corrupted file, or password required
    """
    file_extension = uploaded_file.name.split('.')[-1].lower()
    
    if file_extension == 'pdf':
        return _extract_pdf(uploaded_file, password)
    elif file_extension == 'docx':
        return _extract_docx(uploaded_file)
    else:
        raise ValueError(f"Unsupported format: .{file_extension}. Only PDF and DOCX allowed.")


def _extract_pdf(file, password: Optional[str] = None) -> str:
    """Extract text from PDF file."""
    try:
        reader = PyPDF2.PdfReader(file)
        
        # Check if encrypted
        if reader.is_encrypted:
            if password:
                reader.decrypt(password)
            else:
                raise ValueError("PDF is password-protected. Please provide password.")
        
        # Extract text from all pages
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
            
        # Fallback to pdfplumber if PyPDF2 fails
        if len(text.strip()) < 50:
            file.seek(0)
            with pdfplumber.open(file) as pdf:
                text = "\n".join(page.extract_text() or "" for page in pdf.pages)
                
        if len(text.strip()) < 50:
            raise ValueError("Could not extract readable text from PDF")
            
        return text.strip()
        
    except Exception as e:
        if "password" in str(e).lower():
            raise ValueError("PDF is password-protected. Please provide password.")
        raise ValueError(f"Failed to extract PDF: {str(e)}")


def _extract_docx(file) -> str:
    """Extract text from DOCX file."""
    try:
        doc = Document(file)
        text = "\n".join(paragraph.text for paragraph in doc.paragraphs)
        
        if len(text.strip()) < 50:
            raise ValueError("Could not extract readable text from DOCX")
            
        return text.strip()
    except Exception as e:
        raise ValueError(f"Failed to extract DOCX: {str(e)}")


async def ingest_url(url: str) -> str:
    """
    Fetch and extract text from URLs (web pages, PDFs, Google Docs).
    
    Args:
        url: URL to fetch
        
    Returns:
        Extracted text content
        
    Raises:
        ValueError: Invalid URL, unreachable, or unsupported content
    """
    # Validate and sanitize URL
    validated_url = _validate_url(url)
    
    # Detect URL type
    url_type = _detect_url_type(validated_url)
    
    # Route to appropriate extractor
    if url_type == "google_docs":
        return await _fetch_google_docs(validated_url)
    elif url_type == "pdf":
        return await _fetch_pdf_url(validated_url)
    else:  # web page
        return await _fetch_web_page(validated_url)


def _validate_url(url: str) -> str:
    """Validate and sanitize URL."""
    parsed = urlparse(url)
    
    # Reject dangerous schemes
    if parsed.scheme not in ['http', 'https']:
        raise ValueError(f"Unsupported URL scheme: {parsed.scheme}. Only HTTP/HTTPS allowed.")
    
    # Remove tracking parameters
    clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
    if parsed.query:
        # Keep only essential params (e.g., Google Docs ID)
        clean_url += f"?{parsed.query}"
        
    return clean_url


def _detect_url_type(url: str) -> str:
    """Detect URL content type."""
    if "docs.google.com" in url:
        return "google_docs"
    elif url.lower().endswith('.pdf'):
        return "pdf"
    else:
        return "web_page"


async def _fetch_web_page(url: str) -> str:
    """Fetch and extract text from HTML page."""
    async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
        try:
            response = await client.get(
                url,
                headers={"User-Agent": "JobFlowAI/2.0 (Resume Parser)"}
            )
            response.raise_for_status()
            
            # Parse HTML
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script and style tags
            for tag in soup(['script', 'style', 'iframe', 'nav', 'footer', 'header']):
                tag.decompose()
            
            # Extract text
            text = soup.get_text(separator='\n', strip=True)
            
            if len(text.strip()) < 100:
                raise ValueError("Insufficient content extracted from webpage")
                
            return text
            
        except httpx.TimeoutException:
            raise ValueError(f"URL timeout after 5 seconds: {url}")
        except httpx.HTTPStatusError as e:
            raise ValueError(f"HTTP {e.response.status_code}: Could not fetch URL")
        except Exception as e:
            raise ValueError(f"Network error: {str(e)}")


async def _fetch_pdf_url(url: str) -> str:
    """Download PDF from URL and extract text."""
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            
            # Create in-memory file-like object
            pdf_file = BytesIO(response.content)
            
            # Use existing PDF extractor
            return _extract_pdf(pdf_file)
            
        except Exception as e:
            raise ValueError(f"Failed to download PDF: {str(e)}")


async def _fetch_google_docs(url: str) -> str:
    """
    Extract text from Google Docs.
    Note: Requires document to be publicly accessible.
    """
    # Extract document ID
    match = re.search(r'/document/d/([a-zA-Z0-9-_]+)', url)
    if not match:
        raise ValueError("Invalid Google Docs URL")
    
    doc_id = match.group(1)
    
    # Use export URL for plain text
    export_url = f"https://docs.google.com/document/d/{doc_id}/export?format=txt"
    
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            response = await client.get(export_url)
            response.raise_for_status()
            
            text = response.text.strip()
            
            if len(text) < 100:
                raise ValueError("Insufficient content extracted from Google Doc")
                
            return text
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 403:
                raise ValueError("Document not publicly accessible. Please adjust sharing settings.")
            raise ValueError(f"Failed to fetch Google Doc: HTTP {e.response.status_code}")


def normalize_to_markdown(raw_text: str) -> str:
    """
    Normalize extracted text to clean Markdown format.
    
    Args:
        raw_text: Text from any ingestion handler
        
    Returns:
        Clean Markdown-formatted text
    """
    # Remove excessive whitespace
    text = re.sub(r'\n{3,}', '\n\n', raw_text)
    
    # Normalize bullet points
    text = re.sub(r'^[\u2022\u25CF\u25E6]\s+', '- ', text, flags=re.MULTILINE)
    
    # Remove HTML if present
    text = bleach.clean(text, tags=[], strip=True)
    
    # Trim
    return text.strip()



# ============================================================================
# PROFILE ANALYZER
# ============================================================================

def analyze_profile(raw_text: str, api_key: str) -> Tuple[List[str], str]:
    """
    Extract technical skills and seniority from resume text using BYOK.
    
    Args:
        raw_text: Resume content
        api_key: User provided API key
    
    Returns:
        (skills, seniority) tuple
    """
    client = genai.Client(api_key=api_key)
    model = get_best_model(api_key)
    
    prompt = f"""
You are a senior technical recruiter. Analyze the following resume and extract:

1. All technical skills (languages, frameworks, tools, cloud platforms, databases)
2. Seniority level based on years of experience:
   - Junior: <2 years
   - Mid: 2-5 years
   - Senior: 5-8 years
   - Lead: 8-12 years
   - Principal: 12+ years

Resume:
{raw_text}

Return ONLY valid JSON in this exact format:
{{
  "skills": ["Python", "React", "AWS", ...],
  "seniority": "Senior"
}}
"""
    
    try:
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=GenerateContentConfig(response_mime_type="application/json")
        )
        result = json.loads(response.text.strip())
        
        skills = result.get('skills', [])
        seniority = result.get('seniority', 'Mid')
        
        # Validate seniority
        if seniority not in ['Junior', 'Mid', 'Senior', 'Lead', 'Principal']:
            seniority = 'Mid'  # Default fallback
        
        return skills, seniority
    
    except (json.JSONDecodeError, KeyError, AttributeError, Exception) as e:
        raise ValueError(f"Failed to parse LLM response: {e}")


# ============================================================================
# STRATEGIC MAPPER
# ============================================================================

def generate_search_matrix(profile: UserProfile, api_key: str) -> SearchMatrix:
    """
    Generate 10 hubs × 8 titles search matrix using BYOK.
    
    Args:
        profile: UserProfile Pydantic model
        api_key: User provided API key
    """
    client = genai.Client(api_key=api_key)
    model = get_best_model(api_key)

    skills_str = ', '.join(profile.extracted_skills)
    
    prompt = f"""
You are a career strategist. Given this technical profile:
- Skills: {skills_str}
- Seniority: {profile.seniority}

Generate:
1. **10 geographic hubs** with high demand for this profile. Prioritize:
   - Salary transparency regions (California, EU, NYC)
   - Tech hubs with strong job markets
   - Diversity of continents

2. **8 optimized job titles** that:
   - Align with the seniority level
   - Bypass ATS filters (avoid generic terms like "Developer")
   - Match the skill set precisely

Return ONLY valid JSON in this exact format:
{{
  "hubs": ["Berlin", "Toronto", "Singapore", "London", "Amsterdam", "New York", "San Francisco", "Austin", "Seattle", "Dublin"],
  "titles": ["Senior Backend Engineer", "Platform Engineer", "ML Platform Engineer", "Senior Python Developer", "Backend Architect", "Senior Software Engineer", "API Platform Engineer", "Senior Cloud Engineer"]
}}
"""
    
    try:
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=GenerateContentConfig(response_mime_type="application/json")
        )
        result = json.loads(response.text.strip())
        
        hubs = result.get('hubs', [])[:10]  # Ensure exactly 10
        titles = result.get('titles', [])[:8]  # Ensure exactly 8
        
        # Pad if insufficient
        while len(hubs) < 10:
            hubs.append(f"Hub_{len(hubs)+1}")
        while len(titles) < 8:
            titles.append(f"Title_{len(titles)+1}")
        
        return SearchMatrix(
            user_id=profile.user_id,
            suggested_hubs=hubs,
            optimized_titles=titles,
            is_editable=True
        )
    
    except (json.JSONDecodeError, KeyError, AttributeError, Exception) as e:
        raise ValueError(f"Failed to parse LLM response: {e}")


# ============================================================================
# THE AUDITOR (DUAL-SCORE HEURISTIC)
# ============================================================================

def calculate_match_score(
    user_skills: List[str],
    job_description: str,
    user_seniority: str,
    api_key: str
) -> float:
    """
    Calculate Match Score (0-100).
    """
    client = genai.Client(api_key=api_key)
    # Use pro model for complex reasoning if available
    model = get_best_model(api_key) 
    
    prompt = f"""
User Skills: {', '.join(user_skills)}
User Seniority: {user_seniority}

Job Description:
{job_description}

Calculate technical alignment (0-100) using this formula:
- 50% weight: Skill overlap (Jaccard similarity between user skills and job requirements)
- 30% weight: Seniority fit (100 if perfect match, penalize if job requires >2 years beyond user)
- 20% weight: Ecosystem tools (bonus for domain-specific tech like Kubernetes, Docker, etc.)

Return ONLY valid JSON:
{{
  "match_score": 87.5
}}
"""
    
    try:
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=GenerateContentConfig(response_mime_type="application/json")
        )
        result = json.loads(response.text.strip())
        score = float(result.get('match_score', 50.0))
        return max(0.0, min(100.0, score))  # Clamp to [0, 100]
    
    except (json.JSONDecodeError, KeyError, ValueError, AttributeError, Exception):
        return 50.0  # Default neutral score


def calculate_hire_probability(
    profile: UserProfile,
    job: JobOpportunity,
    job_description: str,
    api_key: str
) -> float:
    """
    Calculate Hiring Probability (0-100).
    """
    client = genai.Client(api_key=api_key)
    client = genai.Client(api_key=api_key)
    # model = get_best_model(api_key)

    skills_str = ', '.join(profile.extracted_skills)
    
    prompt = f"""
User Profile:
- Skills: {skills_str}
- Seniority: {profile.seniority}

Job:
- Title: {job.title}
- Company: {job.company}
- Location: {job.hub}

Job Description:
{job_description}

Estimate hiring probability (0-100) using this formula:
- 40% weight: Market saturation (lower saturation = higher probability)
  * Consider applicant-to-opening ratio for this role in this location
- 40% weight: Strategic value (how well user's past experience solves company pain points)
  * Infer from job description what problems they're trying to solve
- 20% weight: Domain fit (industry vertical alignment: FinTech, HealthTech, SaaS, etc.)

Return ONLY valid JSON:
{{
  "hire_probability": 72.3
}}
"""
    
    try:
        response = generate_with_retry(
            client=client,
            prompt=prompt,
            api_key=api_key,
            config=GenerateContentConfig(response_mime_type="application/json")
        )
        result = json.loads(response.text.strip())
        score = float(result.get('hire_probability', 50.0))
        return max(0.0, min(100.0, score))  # Clamp to [0, 100]
    
    except (json.JSONDecodeError, KeyError, ValueError, AttributeError, Exception):
        return 50.0  # Default neutral score


# ============================================================================
# FINANCIAL BENCHMARKER
# ============================================================================

def extract_salary(job_description: str) -> Optional[str]:
    """
    Extract explicit salary range from job description using regex.
    """
    # Patterns for various salary formats
    patterns = [
        r'\$\s*(\d{1,3}(?:,\d{3})*(?:K|k)?)\s*-\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:K|k)?)',  # $120K-$160K
        r'€\s*(\d{1,3}(?:,\d{3})*(?:K|k)?)\s*-\s*€?\s*(\d{1,3}(?:,\d{3})*(?:K|k)?)',  # €80K-€100K
        r'£\s*(\d{1,3}(?:,\d{3})*(?:K|k)?)\s*-\s*£?\s*(\d{1,3}(?:,\d{3})*(?:K|k)?)',  # £110K-£150K
    ]
    
    for pattern in patterns:
        match = re.search(pattern, job_description, re.IGNORECASE)
        if match:
            low, high = match.groups()
            
            # Normalize to K format
            low = low.replace(',', '')
            high = high.replace(',', '')
            
            if not low.endswith(('K', 'k')):
                low = f"{int(low)//1000}K"
            if not high.endswith(('K', 'k')):
                high = f"{int(high)//1000}K"
            
            # Determine currency
            currency = '$' if '$' in match.group() else ('€' if '€' in match.group() else '£')
            
            return f"{currency}{low.upper()}-{currency}{high.upper()}"
    
    return None


def infer_salary(hub: str, title: str, seniority: str, api_key: str) -> Tuple[str, float]:
    """
    Infer salary range using Gemini when explicit salary is missing.
    """
    client = genai.Client(api_key=api_key)
    client = genai.Client(api_key=api_key)
    # model = get_best_model(api_key)

    prompt = f"""
Estimate 2026 salary range for:
- Title: {title}
- Seniority: {seniority}
- Location: {hub}

Consider:
- Mandatory salary disclosure laws (California, EU, NYC) = high confidence
- Tech hub market data (SF, Seattle, London, Berlin) = medium-high confidence
- Sparse data regions = low confidence

Return ONLY valid JSON:
{{
  "range": "$130K-$170K USD",
  "confidence": 78.5
}}

Confidence scale:
- 90-100: Hub has mandatory disclosure laws
- 70-89: Strong market data available
- 50-69: Estimated from regional averages
- <50: High uncertainty
"""
    
    try:
        response = generate_with_retry(
            client=client,
            prompt=prompt,
            api_key=api_key,
            config=GenerateContentConfig(response_mime_type="application/json")
        )
        result = json.loads(response.text.strip())
        
        salary_range = result.get('range', 'Not Available')
        confidence = float(result.get('confidence', 50.0))
        
        return salary_range, max(0.0, min(100.0, confidence))
    
    except (json.JSONDecodeError, KeyError, ValueError, AttributeError, Exception):
        return 'Not Available', 0.0


# ============================================================================
# INTEGRITY AUDIT (GHOST JOB DETECTION)
# ============================================================================

async def check_url_reachability(url: str, timeout: float = 3.0) -> bool:
    """Async HEAD request to check if URL is reachable."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.head(url, timeout=timeout, follow_redirects=True)
            return response.status_code == 200
    except (httpx.RequestError, httpx.HTTPStatusError):
        return False


def detect_ghost_job(job: JobOpportunity, job_url_reachable: bool = True) -> bool:
    """Detect ghost jobs using multiple heuristics."""
    # Check 1: Stale posting
    age_days = (datetime.utcnow() - job.post_date).days
    if age_days > GHOST_JOB_AGE_DAYS:
        return True
    
    # Check 2: Known scam domains
    domain = urlparse(job.url).netloc
    if any(scam in domain for scam in GHOST_JOB_DOMAINS):
        return True
    
    # Check 3: Unreachable URL
    if not job_url_reachable:
        return True
    
    return False


# ============================================================================
# BATCH PROCESSING
# ============================================================================

async def process_job_batch(
    profile: UserProfile,
    jobs_raw: List[Dict],
    api_key: str,
    check_urls: bool = True
) -> List[JobOpportunity]:
    """
    Process batch of raw job data with scoring and validation.
    
    Args:
        profile: UserProfile Pydantic model
        jobs_raw: List of raw job dictionaries
        api_key: User provided API key
        check_urls: Whether to perform async URL reachability checks
    """
    processed_jobs = []
    
    # Async URL checks
    if check_urls:
        url_tasks = [check_url_reachability(job['url']) for job in jobs_raw]
        url_results = await asyncio.gather(*url_tasks)
    else:
        url_results = [True] * len(jobs_raw)
    
    for job_data, url_reachable in zip(jobs_raw, url_results):
        # Extract or infer salary
        salary_range = extract_salary(job_data.get('description', ''))
        is_verified = salary_range is not None
        confidence = None
        
        if not is_verified:
            salary_range, confidence = infer_salary(
                job_data['hub'],
                job_data['title'],
                profile.seniority,
                api_key
            )
        
        # Calculate scores
        match_score = calculate_match_score(
            profile.extracted_skills,
            job_data.get('description', ''),
            profile.seniority,
            api_key
        )
        
        job_opportunity = JobOpportunity(
            job_id=f"job_{hash(job_data['url'])}",
            title=job_data['title'],
            company=job_data['company'],
            hub=job_data['hub'],
            salary_range=salary_range,
            is_verified_salary=is_verified,
            salary_confidence=confidence,
            match_score=match_score,
            hire_probability=0.0,
            url=job_data['url'],
            post_date=job_data['post_date'],
            is_ghost_job=False 
        )
        
        # Calculate hire probability
        hire_prob = calculate_hire_probability(
            profile,
            job_opportunity,
            job_data.get('description', ''),
            api_key
        )
        job_opportunity.hire_probability = hire_prob
        
        # Ghost job detection
        is_ghost = detect_ghost_job(job_opportunity, url_reachable)
        job_opportunity.is_ghost_job = is_ghost
        
        processed_jobs.append(job_opportunity)
    
    return processed_jobs


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def test_api_key(api_key: str):
    '''Test if the provided API key is valid using client.models.list().'''
    try:
        if not api_key:
             return False, ' API key is empty.'

        client = genai.Client(api_key=api_key)
        
        # Simple test: List models
        # This confirms we can authenticate and reach the service
        models = list(client.models.list())
        
        if models:
            return True, ' API key validated successfully!'
        else:
            return True, ' API key valid (no models returned via list, but auth worked).'
    
    except Exception as e:
        error_msg = str(e).lower()
        
        if 'api_key' in error_msg or 'invalid' in error_msg or 'authentication' in error_msg:
            return False, ' Invalid API key. Please check your key and try again.'
        elif 'quota' in error_msg or 'limit' in error_msg:
            return False, ' API quota exceeded. Please check your Google AI Studio quota.'
        elif 'permission' in error_msg or 'forbidden' in error_msg:
            return False, ' Permission denied. Ensure your API key has Gemini API access enabled.'
        elif 'network' in error_msg or 'connection' in error_msg:
            return False, ' Network error. Please check your internet connection.'
        else:
            return False, f' API key test failed: {str(e)}'

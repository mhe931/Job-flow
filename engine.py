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
import google.generativeai as genai
from models import UserProfile, SearchMatrix, JobOpportunity

# ============================================================================
# CONFIGURATION
# ============================================================================

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
genai.configure(api_key=GEMINI_API_KEY)

# Model selection
FLASH_MODEL = genai.GenerativeModel('gemini-1.5-flash')
PRO_MODEL = genai.GenerativeModel('gemini-1.5-pro')

# Ghost job detection patterns
GHOST_JOB_DOMAINS = [
    'fake-jobs.com',
    'scam-careers.net',
    # Add known scam domains
]

GHOST_JOB_AGE_DAYS = 60


# ============================================================================
# PROFILE ANALYZER
# ============================================================================

def analyze_profile(raw_text: str) -> Tuple[List[str], str]:
    """
    Extract technical skills and seniority from resume text.
    
    Args:
        raw_text: Resume content
    
    Returns:
        (skills, seniority) tuple
        skills: List of technical skills
        seniority: One of ['Junior', 'Mid', 'Senior', 'Lead', 'Principal']
    
    Raises:
        ValueError: If LLM response is invalid
    """
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
        response = FLASH_MODEL.generate_content(prompt)
        result = json.loads(response.text.strip())
        
        skills = result.get('skills', [])
        seniority = result.get('seniority', 'Mid')
        
        # Validate seniority
        if seniority not in ['Junior', 'Mid', 'Senior', 'Lead', 'Principal']:
            seniority = 'Mid'  # Default fallback
        
        return skills, seniority
    
    except (json.JSONDecodeError, KeyError, AttributeError) as e:
        raise ValueError(f"Failed to parse LLM response: {e}")


# ============================================================================
# STRATEGIC MAPPER
# ============================================================================

def generate_search_matrix(profile: UserProfile) -> SearchMatrix:
    """
    Generate 10 hubs × 8 titles search matrix.
    
    Args:
        profile: UserProfile Pydantic model
    
    Returns:
        SearchMatrix with suggested hubs and optimized titles
    
    Raises:
        ValueError: If LLM response is invalid
    """
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
        response = FLASH_MODEL.generate_content(prompt)
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
    
    except (json.JSONDecodeError, KeyError, AttributeError) as e:
        raise ValueError(f"Failed to parse LLM response: {e}")


# ============================================================================
# THE AUDITOR (DUAL-SCORE HEURISTIC)
# ============================================================================

def calculate_match_score(
    user_skills: List[str],
    job_description: str,
    user_seniority: str
) -> float:
    """
    Calculate Match Score (0-100) using weighted formula:
    50% TechStack + 30% Seniority + 20% Ecosystem
    
    Args:
        user_skills: List of user's technical skills
        job_description: Job posting text
        user_seniority: User's seniority level
    
    Returns:
        Match score (0-100)
    """
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
        response = PRO_MODEL.generate_content(prompt)
        result = json.loads(response.text.strip())
        score = float(result.get('match_score', 50.0))
        return max(0.0, min(100.0, score))  # Clamp to [0, 100]
    
    except (json.JSONDecodeError, KeyError, ValueError, AttributeError):
        return 50.0  # Default neutral score


def calculate_hire_probability(
    profile: UserProfile,
    job: JobOpportunity,
    job_description: str
) -> float:
    """
    Calculate Hiring Probability (0-100) using weighted formula:
    40% MarketSaturation + 40% StrategicValue + 20% DomainFit
    
    Args:
        profile: UserProfile Pydantic model
        job: JobOpportunity Pydantic model
        job_description: Job posting text
    
    Returns:
        Hiring probability (0-100)
    """
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
        response = PRO_MODEL.generate_content(prompt)
        result = json.loads(response.text.strip())
        score = float(result.get('hire_probability', 50.0))
        return max(0.0, min(100.0, score))  # Clamp to [0, 100]
    
    except (json.JSONDecodeError, KeyError, ValueError, AttributeError):
        return 50.0  # Default neutral score


# ============================================================================
# FINANCIAL BENCHMARKER
# ============================================================================

def extract_salary(job_description: str) -> Optional[str]:
    """
    Extract explicit salary range from job description using regex.
    
    Args:
        job_description: Job posting text
    
    Returns:
        Salary range string (e.g., "$120K-$160K USD") or None
    
    Examples:
        "$120,000 - $160,000" -> "$120K-$160K USD"
        "€80K-€100K" -> "€80K-€100K"
        "£110,000-£150,000" -> "£110K-£150K"
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


def infer_salary(hub: str, title: str, seniority: str) -> Tuple[str, float]:
    """
    Infer salary range using Gemini when explicit salary is missing.
    
    Args:
        hub: Geographic location
        title: Job title
        seniority: Seniority level
    
    Returns:
        (salary_range, confidence) tuple
        salary_range: e.g., "$130K-$170K USD"
        confidence: 0-100 based on data availability
    """
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
        response = FLASH_MODEL.generate_content(prompt)
        result = json.loads(response.text.strip())
        
        salary_range = result.get('range', 'Not Available')
        confidence = float(result.get('confidence', 50.0))
        
        return salary_range, max(0.0, min(100.0, confidence))
    
    except (json.JSONDecodeError, KeyError, ValueError, AttributeError):
        return 'Not Available', 0.0


# ============================================================================
# INTEGRITY AUDIT (GHOST JOB DETECTION)
# ============================================================================

async def check_url_reachability(url: str, timeout: float = 3.0) -> bool:
    """
    Async HEAD request to check if URL is reachable.
    
    Args:
        url: Job posting URL
        timeout: Request timeout in seconds
    
    Returns:
        True if URL returns 200, False otherwise
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.head(url, timeout=timeout, follow_redirects=True)
            return response.status_code == 200
    except (httpx.RequestError, httpx.HTTPStatusError):
        return False


def detect_ghost_job(job: JobOpportunity, job_url_reachable: bool = True) -> bool:
    """
    Detect ghost jobs using multiple heuristics.
    
    Flagging Criteria:
    1. Stale posting: post_date > 60 days ago
    2. URL patterns: Matches known scam domains
    3. Unreachable links: HTTP status ≠ 200
    
    Args:
        job: JobOpportunity Pydantic model
        job_url_reachable: Result from check_url_reachability()
    
    Returns:
        True if job is likely a ghost posting
    """
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
    check_urls: bool = True
) -> List[JobOpportunity]:
    """
    Process batch of raw job data with scoring and validation.
    
    Args:
        profile: UserProfile Pydantic model
        jobs_raw: List of raw job dictionaries with keys:
                  {title, company, hub, url, post_date, description}
        check_urls: Whether to perform async URL reachability checks
    
    Returns:
        List of JobOpportunity Pydantic models with scores
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
                profile.seniority
            )
        
        # Calculate scores
        match_score = calculate_match_score(
            profile.extracted_skills,
            job_data.get('description', ''),
            profile.seniority
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
            hire_probability=0.0,  # Placeholder, calculated next
            url=job_data['url'],
            post_date=job_data['post_date'],
            is_ghost_job=False  # Placeholder
        )
        
        # Calculate hire probability (requires JobOpportunity object)
        hire_prob = calculate_hire_probability(
            profile,
            job_opportunity,
            job_data.get('description', '')
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

def set_api_key(api_key: str) -> None:
    """
    Update Gemini API key at runtime.
    
    Args:
        api_key: Google Gemini API key
    """
    global GEMINI_API_KEY
    GEMINI_API_KEY = api_key
    genai.configure(api_key=api_key)

"""
JobFlow AI - Streamlit Application
Production-grade career orchestration platform with dark mode UI.
"""

import streamlit as st
import pandas as pd
from datetime import datetime
from io import BytesIO
import PyPDF2
import docx
from typing import List, Optional

# Local imports
from models import UserProfile, SearchMatrix, JobOpportunity
from database import (
    init_db, save_user, get_user, create_session,
    save_jobs, get_jobs_for_session, mark_job_clicked
)
from engine import (
    analyze_profile, generate_search_matrix,
    process_job_batch, set_api_key
)

# ============================================================================
# PAGE CONFIGURATION
# ============================================================================

st.set_page_config(
    page_title="JobFlow AI - Career Discovery Engine",
    page_icon="🎯",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Dark mode CSS with Liquid Glass aesthetic
st.markdown("""
<style>
    /* ============================================
       LIQUID GLASS DESIGN SYSTEM
       ============================================ */
    
    /* Base Layer - Deep Space Background */
    .stApp {
        background: linear-gradient(135deg, #0A0E14 0%, #0f1419 50%, #1a1f2e 100%);
        color: #FAFAFA;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }
    
    /* Add subtle noise texture */
    .stApp::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        opacity: 0.03;
        pointer-events: none;
        z-index: 1;
    }
    
    /* Glass Card Base */
    .glass-card {
        background: rgba(30, 37, 48, 0.7) !important;
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        border-radius: 16px !important;
        box-shadow: 
            0 8px 32px 0 rgba(0, 0, 0, 0.37),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.05) !important;
        transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
    }
    
    /* Enhanced Job Cards */
    .job-card {
        background: rgba(30, 37, 48, 0.7);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border-radius: 16px;
        padding: 24px;
        margin: 16px 0;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-left: 4px solid #4CAF50;
        box-shadow: 
            0 8px 32px 0 rgba(0, 0, 0, 0.37),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
        transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        position: relative;
        overflow: hidden;
    }
    
    /* Glow effect on hover */
    .job-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle at 50% 50%, rgba(76, 175, 80, 0.15), transparent 70%);
        opacity: 0;
        transition: opacity 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        pointer-events: none;
    }
    
    .job-card:hover {
        transform: translateY(-4px);
        box-shadow: 
            0 12px 40px rgba(76, 175, 80, 0.2),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
        border-color: rgba(76, 175, 80, 0.3);
    }
    
    .job-card:hover::before {
        opacity: 1;
    }
    
    .job-card-clicked {
        opacity: 0.6;
        filter: grayscale(50%);
        border-left-color: #78909C;
    }
    
    /* Typography */
    .job-title {
        font-size: 1.563rem;
        font-weight: 600;
        color: #4CAF50;
        margin-bottom: 8px;
        letter-spacing: -0.02em;
    }
    
    .job-company {
        font-size: 1.1rem;
        color: #B0BEC5;
        margin-bottom: 12px;
        font-weight: 500;
    }
    
    .job-meta {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
        margin: 12px 0;
        font-size: 0.95rem;
        color: #78909C;
    }
    
    .job-meta-item {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    
    /* Score Badges with Glass Effect */
    .score-badge {
        display: inline-block;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.9rem;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
    }
    
    .score-badge:hover {
        transform: scale(1.05);
    }
    
    .score-high {
        background: linear-gradient(135deg, rgba(76, 175, 80, 0.8), rgba(102, 187, 106, 0.8));
        color: white;
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
    }
    
    .score-medium {
        background: linear-gradient(135deg, rgba(255, 152, 0, 0.8), rgba(255, 183, 77, 0.8));
        color: white;
        box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
    }
    
    .score-low {
        background: linear-gradient(135deg, rgba(244, 67, 54, 0.8), rgba(239, 83, 80, 0.8));
        color: white;
        box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
    }
    
    /* Salary Display */
    .salary-verified {
        color: #66BB6A;
        font-weight: 600;
        text-shadow: 0 0 10px rgba(102, 187, 106, 0.3);
    }
    
    .salary-inferred {
        color: #FFB74D;
        font-weight: 500;
    }
    
    .ghost-job-warning {
        background: linear-gradient(135deg, rgba(239, 83, 80, 0.9), rgba(244, 67, 54, 0.9));
        color: white;
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 600;
        display: inline-block;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
    }
    
    /* Enhanced Buttons */
    .stButton>button {
        background: linear-gradient(135deg, #4CAF50, #66BB6A);
        color: white;
        border: none;
        border-radius: 12px;
        padding: 12px 24px;
        font-weight: 600;
        font-size: 1rem;
        transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        backdrop-filter: blur(10px);
    }
    
    .stButton>button:hover {
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4);
        background: linear-gradient(135deg, #66BB6A, #4CAF50);
    }
    
    .stButton>button:active {
        transform: translateY(0) scale(0.98);
        box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);
    }
    
    .stButton>button:focus-visible {
        outline: 2px solid #4CAF50;
        outline-offset: 4px;
    }
    
    /* Input Fields with Glass Effect */
    .stTextInput>div>div>input,
    .stTextArea>div>div>textarea {
        background: rgba(30, 37, 48, 0.5) !important;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        border-radius: 12px !important;
        color: #FAFAFA !important;
        padding: 16px !important;
        font-size: 1rem !important;
        transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
    }
    
    .stTextInput>div>div>input:focus,
    .stTextArea>div>div>textarea:focus {
        border-color: rgba(76, 175, 80, 0.5) !important;
        box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1) !important;
        background: rgba(30, 37, 48, 0.7) !important;
    }
    
    /* Tabs with Glass Effect */
    .stTabs [data-baseweb="tab-list"] {
        background: rgba(30, 37, 48, 0.5);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 8px;
        gap: 8px;
    }
    
    .stTabs [data-baseweb="tab"] {
        background: transparent;
        border-radius: 8px;
        color: #B0BEC5;
        font-weight: 500;
        padding: 12px 24px;
        transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
    }
    
    .stTabs [data-baseweb="tab"]:hover {
        background: rgba(76, 175, 80, 0.1);
        color: #4CAF50;
    }
    
    .stTabs [aria-selected="true"] {
        background: linear-gradient(135deg, #4CAF50, #66BB6A) !important;
        color: white !important;
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
    }
    
    /* Sidebar Glass Effect */
    [data-testid="stSidebar"] {
        background: rgba(20, 25, 35, 0.8);
        backdrop-filter: blur(20px);
        border-right: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    /* Expander with Glass Effect */
    .streamlit-expanderHeader {
        background: rgba(30, 37, 48, 0.5);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
    }
    
    .streamlit-expanderHeader:hover {
        background: rgba(30, 37, 48, 0.7);
        border-color: rgba(76, 175, 80, 0.3);
    }
    
    /* Metrics with Glass Cards */
    [data-testid="stMetricValue"] {
        font-size: 1.953rem;
        font-weight: 600;
        color: #4CAF50;
    }
    
    /* Loading Spinner */
    .stSpinner > div {
        border-color: #4CAF50 transparent transparent transparent !important;
    }
    
    /* Reduced Motion Support */
    @media (prefers-reduced-motion: reduce) {
        * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
    }
    
    /* Scrollbar Styling */
    ::-webkit-scrollbar {
        width: 12px;
    }
    
    ::-webkit-scrollbar-track {
        background: rgba(30, 37, 48, 0.3);
        border-radius: 6px;
    }
    
    ::-webkit-scrollbar-thumb {
        background: rgba(76, 175, 80, 0.5);
        border-radius: 6px;
        border: 2px solid rgba(30, 37, 48, 0.3);
    }
    
    ::-webkit-scrollbar-thumb:hover {
        background: rgba(76, 175, 80, 0.7);
    }
</style>
""", unsafe_allow_html=True)

# SESSION STATE INITIALIZATION
# ============================================================================

# Core authentication and user state
if 'authenticated' not in st.session_state:
    st.session_state.authenticated = False
if 'user_id' not in st.session_state:
    st.session_state.user_id = None
if 'profile' not in st.session_state:
    st.session_state.profile = None
if 'search_matrix' not in st.session_state:
    st.session_state.search_matrix = None
if 'current_session_id' not in st.session_state:
    st.session_state.current_session_id = None
if 'jobs' not in st.session_state:
    st.session_state.jobs = []

# Ingestion flow state machine
if 'ingestion_step' not in st.session_state:
    st.session_state.ingestion_step = 'input'  # 'input' | 'verify' | 'analyzing' | 'complete'

# UI state for resume ingestion
if 'show_full_text' not in st.session_state:
    st.session_state.show_full_text = False
if 'normalized_text' not in st.session_state:
    st.session_state.normalized_text = None
if 'extracted_text' not in st.session_state:
    st.session_state.extracted_text = None
if 'source_type' not in st.session_state:
    st.session_state.source_type = None

# Initialize database
init_db()

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def extract_text_from_pdf(file) -> str:
    """Extract text from uploaded PDF."""
    pdf_reader = PyPDF2.PdfReader(file)
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text()
    return text


def extract_text_from_docx(file) -> str:
    """Extract text from uploaded DOCX."""
    doc = docx.Document(file)
    text = "\n".join([para.text for para in doc.paragraphs])
    return text


def get_score_class(score: float) -> str:
    """Return CSS class based on score."""
    if score >= 75:
        return "score-high"
    elif score >= 50:
        return "score-medium"
    else:
        return "score-low"


def export_to_excel(jobs: List[JobOpportunity]) -> bytes:
    """
    Export jobs to Excel with conditional formatting.
    
    Args:
        jobs: List of JobOpportunity models
    
    Returns:
        Excel file as bytes
    """
    df = pd.DataFrame([
        {
            'Title': job.title,
            'Company': job.company,
            'Location': job.hub,
            'Salary': job.salary_range or 'Not Available',
            'Salary Type': 'Verified' if job.is_verified_salary else f'Inferred ({job.salary_confidence:.0f}%)',
            'Match Score': f"{job.match_score:.1f}%",
            'Hire Probability': f"{job.hire_probability:.1f}%",
            'Posted': job.post_date.strftime('%Y-%m-%d'),
            'Ghost Job': 'Yes' if job.is_ghost_job else 'No',
            'URL': job.url
        }
        for job in jobs
    ])
    
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='JobFlow Results')
        
        # Apply conditional formatting
        workbook = writer.book
        worksheet = writer.sheets['JobFlow Results']
        
        # Auto-adjust column widths
        for column in worksheet.columns:
            max_length = 0
            column = [cell for cell in column]
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(cell.value)
                except:
                    pass
            adjusted_width = min(max_length + 2, 50)
            worksheet.column_dimensions[column[0].column_letter].width = adjusted_width
    
    return output.getvalue()


# ============================================================================
# CALLBACK FUNCTIONS FOR UI INTERACTIONS
# ============================================================================

def on_show_full_toggle():
    """Callback for 'Show full text' checkbox toggle."""
    st.session_state.show_full_text = st.session_state.show_full_checkbox


def on_confirm_analyze():
    """Callback for 'Confirm & Analyze' button."""
    st.session_state.ingestion_step = 'analyzing'


def on_edit_text():
    """Callback for 'Edit Text' button."""
    st.session_state.ingestion_step = 'input'
    st.session_state.extracted_text = None
    st.session_state.normalized_text = None


def on_discard_restart():
    """Callback for 'Discard & Restart' button."""
    keys_to_clear = [
        'profile', 'normalized_text', 'extracted_text', 
        'source_type', 'show_full_text'
    ]
    for key in keys_to_clear:
        if key in st.session_state:
            if key == 'show_full_text':
                st.session_state[key] = False
            else:
                st.session_state[key] = None
    st.session_state.ingestion_step = 'input'


# ============================================================================
# UI COMPONENTS
# ============================================================================

def render_job_card(job: JobOpportunity, is_clicked: bool = False):
    """
    Render individual job card with scores and metadata.
    
    Args:
        job: JobOpportunity Pydantic model
        is_clicked: Whether job has been clicked
    """
    card_class = "job-card job-card-clicked" if is_clicked else "job-card"
    
    # Salary display
    if job.is_verified_salary:
        salary_html = f'<span class="salary-verified">💰 {job.salary_range} ✓ (Verified)</span>'
    elif job.salary_range and job.salary_range != 'Not Available':
        confidence_icon = '⚠️' if job.salary_confidence < 70 else '📊'
        salary_html = f'<span class="salary-inferred">{confidence_icon} {job.salary_range} (Inferred: {job.salary_confidence:.0f}%)</span>'
    else:
        salary_html = '<span style="color: #666;">Salary not disclosed</span>'
    
    # Ghost job warning
    ghost_warning = '<div class="ghost-job-warning">⚠️ Potential Ghost Job</div>' if job.is_ghost_job else ''
    
    # Time since posting
    days_ago = (datetime.utcnow() - job.post_date).days
    if days_ago == 0:
        time_str = "Posted today"
    elif days_ago == 1:
        time_str = "Posted yesterday"
    else:
        time_str = f"Posted {days_ago} days ago"
    
    st.markdown(f"""
    <div class="{card_class}">
        <div class="job-title">{job.title}</div>
        <div class="job-company">@ {job.company}</div>
        
        <div class="job-meta">
            <div class="job-meta-item">📍 {job.hub}</div>
            <div class="job-meta-item">🕒 {time_str}</div>
        </div>
        
        <div style="margin: 15px 0;">
            {salary_html}
        </div>
        
        <div style="display: flex; gap: 15px; margin: 15px 0;">
            <span class="score-badge {get_score_class(job.match_score)}">
                Match: {job.match_score:.0f}%
            </span>
            <span class="score-badge {get_score_class(job.hire_probability)}">
                Hire Prob: {job.hire_probability:.0f}%
            </span>
        </div>
        
        {ghost_warning}
    </div>
    """, unsafe_allow_html=True)
    
    # Action buttons
    col1, col2, col3 = st.columns([2, 2, 6])
    with col1:
        if st.button("🔗 View Job", key=f"view_{job.job_id}"):
            mark_job_clicked(job.job_id)
            st.markdown(f'<a href="{job.url}" target="_blank">Opening job...</a>', unsafe_allow_html=True)
            st.rerun()
    
    with col2:
        if st.button("📋 Copy Link", key=f"copy_{job.job_id}"):
            st.code(job.url, language=None)
            st.success("Link displayed above!")


# ============================================================================
# PAGES
# ============================================================================

def page_login():
    """Login page with API key setup - Liquid Glass Design."""
    
    # Hero section
    st.markdown("""
    <div style="text-align: center; margin-bottom: 3rem;">
        <h1 style="font-size: 3rem; font-weight: 700; color: #4CAF50; margin-bottom: 0.5rem; letter-spacing: -0.02em;">
            🎯 JobFlow AI
        </h1>
        <p style="font-size: 1.5rem; color: #B0BEC5; font-weight: 300;">
            Career Discovery Engine
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    # Login form
    with st.form("login_form"):
        st.markdown("#### 🔑 Authentication")
        
        user_email = st.text_input(
            "Email (for session tracking)",
            placeholder="your.email@example.com",
            help="Used to track your session and save your preferences"
        )
        
        api_key = st.text_input(
            "Google Gemini API Key",
            type="password",
            placeholder="Enter your API key",
            help="Required for AI-powered profile analysis"
        )
        
        # Prominent link to Google AI Studio
        st.markdown("""
        <div style="
            background: rgba(66, 165, 245, 0.1);
            border-left: 4px solid #42A5F5;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
        ">
            <p style="margin: 0; color: #B0BEC5; font-size: 0.95rem;">
                <strong style="color: #42A5F5;">💡 Need an API Key?</strong><br>
                Get your free Gemini API key from Google AI Studio:
            </p>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" style="
                display: inline-block;
                margin-top: 0.5rem;
                padding: 0.5rem 1rem;
                background: linear-gradient(135deg, #42A5F5, #64B5F6);
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
            ">
                🔗 Get API Key →
            </a>
        </div>
        """, unsafe_allow_html=True)
        
        submitted = st.form_submit_button("🚀 Start Discovery", use_container_width=True)
        
        if submitted:
            if api_key and user_email:
                # Test API key first
                with st.spinner("🔍 Validating API key..."):
                    from engine import test_api_key
                    is_valid, message = test_api_key(api_key)
                
                if is_valid:
                    # Set API key
                    set_api_key(api_key)
                    
                    # Create mock user ID (replace with real OAuth in production)
                    user_id = f"user_{hash(user_email)}"
                    
                    st.session_state.authenticated = True
                    st.session_state.user_id = user_id
                    st.session_state.user_email = user_email
                    st.session_state.api_key = api_key
                    
                    st.success(message)
                    st.success("✅ Authenticated! Redirecting...")
                    st.rerun()
                else:
                    # Show error message
                    st.error(message)
                    
                    # Provide guidance based on error type
                    if "Invalid" in message or "authentication" in message.lower():
                        st.markdown("""
                        <div style="
                            background: rgba(244, 67, 54, 0.1);
                            border-left: 4px solid #F44336;
                            padding: 1rem;
                            border-radius: 8px;
                            margin: 1rem 0;
                        ">
                            <p style="margin: 0; color: #B0BEC5; font-size: 0.95rem;">
                                <strong style="color: #F44336;">🔧 How to fix this:</strong><br>
                                1. Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color: #42A5F5;">Google AI Studio</a><br>
                                2. Click "Create API Key"<br>
                                3. Copy the key and paste it above<br>
                                4. Make sure you're using a <strong>Gemini API key</strong>, not a Google Cloud API key
                            </p>
                        </div>
                        """, unsafe_allow_html=True)
                    elif "quota" in message.lower():
                        st.markdown("""
                        <div style="
                            background: rgba(255, 152, 0, 0.1);
                            border-left: 4px solid #FF9800;
                            padding: 1rem;
                            border-radius: 8px;
                            margin: 1rem 0;
                        ">
                            <p style="margin: 0; color: #B0BEC5; font-size: 0.95rem;">
                                <strong style="color: #FF9800;">📊 Quota Issue:</strong><br>
                                Your API key has exceeded its quota. Check your usage at 
                                <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color: #42A5F5;">Google AI Studio</a>.
                                <br><br>
                                Free tier limits: 15 requests/minute, 1,500 requests/day
                            </p>
                        </div>
                        """, unsafe_allow_html=True)
                    elif "network" in message.lower():
                        st.info("💡 **Tip:** Check your internet connection and try again.")
            else:
                st.error("❌ Please provide both API key and email.")
    
    # Feature highlights
    st.markdown("<div style='margin-top: 3rem;'></div>", unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown("""
        <div style="text-align: center; padding: 1.5rem;">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🧠</div>
            <h4 style="color: #4CAF50; margin-bottom: 0.5rem;">AI-Powered</h4>
            <p style="color: #78909C; font-size: 0.9rem;">
                Extract skills & seniority automatically from your resume
            </p>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown("""
        <div style="text-align: center; padding: 1.5rem;">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎯</div>
            <h4 style="color: #4CAF50; margin-bottom: 0.5rem;">Strategic Matrix</h4>
            <p style="color: #78909C; font-size: 0.9rem;">
                10 hubs × 8 titles = 80 targeted job searches
            </p>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown("""
        <div style="text-align: center; padding: 1.5rem;">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">💰</div>
            <h4 style="color: #4CAF50; margin-bottom: 0.5rem;">Salary Intel</h4>
            <p style="color: #78909C; font-size: 0.9rem;">
                Verified + AI-inferred salary ranges with confidence scores
            </p>
        </div>
        """, unsafe_allow_html=True)
    
    # Additional features
    st.markdown("<div style='margin-top: 2rem;'></div>", unsafe_allow_html=True)
    
    with st.expander("✨ More Features"):
        st.markdown("""
        - **Dual-Score Ranking** - Match Score + Hiring Probability
        - **Ghost Job Detection** - Filter out stale/suspicious postings
        - **Multi-Modal Ingestion** - Text, File Upload, or Cloud URL
        - **Excel Export** - Download results with conditional formatting
        - **Recede Logic** - Clicked jobs automatically sorted to bottom
        """)


def page_upload_resume():
    """Universal Ingestor - Multi-modal resume input page."""
    st.title("📄 Resume Ingestion")
    st.markdown("Upload your resume via **text paste**, **cloud URL**, or **local file**.")
    
    # Import ingestion functions
    from engine import ingest_text, ingest_file, ingest_url, normalize_to_markdown
    import asyncio
    
    # Only show input tabs if in 'input' step
    if st.session_state.ingestion_step == 'input':
        # Tabbed interface
        tab1, tab2, tab3 = st.tabs(["⚡ Fast Paste", "☁️ Cloud Sync", "💾 Local Asset"])
        
        # ========== TAB 1: TEXT INPUT ==========
        with tab1:
            st.subheader("Paste Resume Text")
            text_input = st.text_area(
                "Paste your resume here",
                height=300,
                placeholder="Paste your resume text directly...",
                key="text_input_area"
            )
            
            if st.button("Process Text", key="btn_text", type="primary"):
                if text_input and text_input.strip():
                    try:
                        extracted_text = ingest_text(text_input)
                        # Store in session state immediately
                        st.session_state.extracted_text = extracted_text
                        st.session_state.source_type = "text"
                        st.session_state.ingestion_step = 'verify'
                        st.success("✅ Text processed successfully")
                        st.rerun()
                    except ValueError as e:
                        st.error(f"❌ {str(e)}")
                else:
                    st.warning("Please paste some text first.")
        
        # ========== TAB 2: URL INPUT ==========
        with tab2:
            st.subheader("Import from URL")
            st.markdown("""
            **Supported sources:**
            - 🌐 Web portfolios (HTML pages)
            - 📄 Direct PDF links
            - 📝 Google Docs (must be publicly accessible)
            """)
            
            url_input = st.text_input(
                "Enter URL",
                placeholder="https://example.com/resume.pdf or https://docs.google.com/document/d/...",
                key="url_input_field"
            )
            
            if st.button("Fetch from URL", key="btn_url", type="primary"):
                if url_input:
                    try:
                        with st.spinner("Fetching content from URL..."):
                            # Run async function
                            extracted_text = asyncio.run(ingest_url(url_input))
                            # Store in session state immediately
                            st.session_state.extracted_text = extracted_text
                            st.session_state.source_type = "url"
                            st.session_state.ingestion_step = 'verify'
                        st.success("✅ Content fetched successfully")
                        st.rerun()
                    except ValueError as e:
                        st.error(f"❌ {str(e)}")
                        
                        # Provide recovery suggestions
                        if "timeout" in str(e).lower():
                            st.info("💡 **Suggestion:** The URL might be slow. Try downloading the file and uploading it in the 'Local Asset' tab.")
                        elif "403" in str(e) or "not publicly accessible" in str(e).lower():
                            st.info("💡 **Suggestion:** For Google Docs, go to Share → Change to 'Anyone with the link can view'")
                        elif "network" in str(e).lower():
                            st.info("💡 **Suggestion:** Check your internet connection or try pasting the content directly in the 'Fast Paste' tab.")
                else:
                    st.warning("Please enter a URL first.")
        
        # ========== TAB 3: FILE UPLOAD ==========
        with tab3:
            st.subheader("Upload Local File")
            st.markdown("**Supported formats:** PDF, DOCX (max 10MB)")
            
            uploaded_file = st.file_uploader(
                "Choose PDF or DOCX",
                type=['pdf', 'docx'],
                help="Maximum file size: 10MB",
                key="file_uploader"
            )
            
            # Password input for encrypted PDFs
            pdf_password = None
            if uploaded_file and uploaded_file.name.endswith('.pdf'):
                with st.expander("🔒 PDF Password (if encrypted)"):
                    pdf_password = st.text_input("Enter password", type="password", key="pdf_password")
            
            if uploaded_file and st.button("Extract Text", key="btn_file", type="primary"):
                try:
                    # Check file size
                    if uploaded_file.size > 10 * 1024 * 1024:
                        st.error("❌ File exceeds 10MB limit")
                        st.info("💡 **Suggestion:** Try compressing the PDF or converting to a lighter format.")
                    else:
                        with st.spinner(f"Extracting text from {uploaded_file.name}..."):
                            extracted_text = ingest_file(uploaded_file, pdf_password)
                            # Store in session state immediately
                            st.session_state.extracted_text = extracted_text
                            st.session_state.source_type = "file"
                            st.session_state.ingestion_step = 'verify'
                        st.success(f"✅ Text extracted from {uploaded_file.name}")
                        st.rerun()
                except ValueError as e:
                    st.error(f"❌ {str(e)}")
                    
                    # Provide recovery suggestions
                    if "password" in str(e).lower():
                        st.info("💡 **Suggestion:** Enter the PDF password in the field above and try again.")
                    elif "unsupported format" in str(e).lower():
                        st.info("💡 **Suggestion:** Only PDF and DOCX files are supported. Convert your file or paste the text directly.")
                    elif "readable text" in str(e).lower():
                        st.info("💡 **Suggestion:** The file might be scanned/image-based. Try using OCR or paste the text manually.")
    
    # ========== VERIFICATION STEP ==========
    if st.session_state.ingestion_step in ['verify', 'analyzing', 'complete'] and st.session_state.extracted_text:
        st.divider()
        st.subheader("🔍 Verification Step")
        st.markdown("Review the extracted content before analysis.")
        
        # Normalize text (only once)
        if not st.session_state.normalized_text:
            normalized_text = normalize_to_markdown(st.session_state.extracted_text)
            st.session_state.normalized_text = normalized_text
        else:
            normalized_text = st.session_state.normalized_text
        
        # Display preview in expander
        with st.expander("📝 Preview Extracted Text", expanded=True):
            # Show first 500 chars by default
            preview_text = normalized_text[:500]
            if len(normalized_text) > 500:
                preview_text += f"\n\n... ({len(normalized_text) - 500} more characters)"
            
            st.text_area(
                "Extracted Content Preview",
                value=preview_text,
                height=200,
                key="preview_text",
                disabled=True
            )
            
            # Show full text option - Fixed with callback
            st.checkbox(
                "Show full text", 
                key="show_full_checkbox",
                value=st.session_state.show_full_text,
                on_change=on_show_full_toggle
            )
            
            if st.session_state.show_full_text:
                st.text_area(
                    "Full Extracted Content",
                    value=normalized_text,
                    height=400,
                    key="full_text",
                    disabled=True
                )
        
        # Metadata display
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Character Count", f"{len(normalized_text):,}")
        with col2:
            word_count = len(normalized_text.split())
            st.metric("Word Count", f"{word_count:,}")
        with col3:
            # Language detection (optional)
            try:
                from langdetect import detect
                lang = detect(normalized_text)
                st.metric("Detected Language", lang.upper())
            except:
                st.metric("Detected Language", "N/A")
        
        # Source indicator
        source_icons = {
            "text": "⚡ Direct Text",
            "url": "☁️ Cloud URL",
            "file": "💾 Local File"
        }
        if st.session_state.source_type:
            st.info(f"**Source:** {source_icons.get(st.session_state.source_type, 'Unknown')}")
        
        st.divider()
        
        # Action buttons with callbacks - only show if not analyzing or complete
        if st.session_state.ingestion_step == 'verify':
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.button(
                    "✅ Confirm & Analyze", 
                    type="primary", 
                    key="btn_confirm", 
                    use_container_width=True,
                    on_click=on_confirm_analyze
                )
            
            with col2:
                st.button(
                    "✏️ Edit Text", 
                    key="btn_edit", 
                    use_container_width=True,
                    on_click=on_edit_text
                )
            
            with col3:
                st.button(
                    "🗑️ Discard & Restart", 
                    key="btn_discard", 
                    use_container_width=True,
                    on_click=on_discard_restart
                )
    
    # ========== ANALYSIS EXECUTION ==========
    if st.session_state.ingestion_step == 'analyzing' and st.session_state.normalized_text:
        with st.spinner("Analyzing resume with Gemini Flash..."):
            try:
                skills, seniority = analyze_profile(st.session_state.normalized_text)
                
                profile = UserProfile(
                    user_id=st.session_state.user_id,
                    raw_text=st.session_state.normalized_text,
                    extracted_skills=skills,
                    seniority=seniority
                )
                
                st.session_state.profile = profile
                
                # Save to database
                save_user(profile, st.session_state.user_email, st.session_state.api_key)
                
                st.success(f"✅ Profile analyzed! Seniority: **{seniority}**")
                st.write(f"**Extracted Skills:** {', '.join(skills)}")
                
                st.info("✨ Proceed to **'Edit Matrix'** in the sidebar to generate your search strategy.")
                
                # Mark as complete
                st.session_state.ingestion_step = 'complete'
            
            except Exception as e:
                st.error(f"❌ Analysis failed: {e}")
                st.info("💡 **Suggestion:** Check your API key or try with a different resume format.")
                # Return to verify step on error
                st.session_state.ingestion_step = 'verify'



def page_edit_matrix():
    """Search matrix editor (10 hubs × 8 titles)."""
    st.title("✏️ Edit Search Matrix")
    
    if not st.session_state.profile:
        st.warning("Please upload and analyze your resume first.")
        return
    
    if not st.session_state.search_matrix:
        if st.button("🎯 Generate Strategic Matrix"):
            with st.spinner("Generating 10 hubs × 8 titles with Gemini Flash..."):
                try:
                    matrix = generate_search_matrix(st.session_state.profile)
                    st.session_state.search_matrix = matrix
                    st.success("✅ Matrix generated!")
                    st.rerun()
                except Exception as e:
                    st.error(f"Matrix generation failed: {e}")
    
    if st.session_state.search_matrix:
        matrix = st.session_state.search_matrix
        
        st.markdown("### 🌍 Geographic Hubs (10)")
        hubs_df = pd.DataFrame({'Hub': matrix.suggested_hubs})
        edited_hubs = st.data_editor(hubs_df, num_rows="dynamic", use_container_width=True)
        
        st.markdown("### 💼 Job Titles (8)")
        titles_df = pd.DataFrame({'Title': matrix.optimized_titles})
        edited_titles = st.data_editor(titles_df, num_rows="dynamic", use_container_width=True)
        
        col1, col2 = st.columns([1, 4])
        with col1:
            if st.button("💾 Save Matrix"):
                matrix.suggested_hubs = edited_hubs['Hub'].tolist()[:10]
                matrix.optimized_titles = edited_titles['Title'].tolist()[:8]
                st.session_state.search_matrix = matrix
                st.success("✅ Matrix saved!")
        
        with col2:
            st.info(f"**Total Search Vectors:** {len(matrix.suggested_hubs)} × {len(matrix.optimized_titles)} = {len(matrix.suggested_hubs) * len(matrix.optimized_titles)}")


def page_serp():
    """Search Engine Results Page with job cards."""
    st.title("🔍 Job Discovery Results")
    
    if not st.session_state.profile or not st.session_state.search_matrix:
        st.warning("Please complete profile analysis and matrix generation first.")
        return
    
    # Filters
    col1, col2, col3 = st.columns(3)
    with col1:
        min_match = st.slider("Min Match Score", 0, 100, 0)
    with col2:
        show_clicked = st.checkbox("Show Clicked Jobs", value=True)
    with col3:
        hide_ghost = st.checkbox("Hide Ghost Jobs", value=True)
    
    # Export button
    if st.session_state.jobs:
        excel_data = export_to_excel(st.session_state.jobs)
        st.download_button(
            label="📊 Export to Excel",
            data=excel_data,
            file_name=f"jobflow_results_{datetime.now().strftime('%Y%m%d')}.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    
    # Display jobs
    if st.session_state.current_session_id:
        jobs = get_jobs_for_session(
            st.session_state.current_session_id,
            include_clicked=show_clicked,
            min_match_score=min_match
        )
        
        # Filter ghost jobs
        if hide_ghost:
            jobs = [j for j in jobs if not j.is_ghost_job]
        
        st.markdown(f"### Found {len(jobs)} opportunities")
        
        for job in jobs:
            is_clicked = job.clicked_at is not None
            render_job_card(job, is_clicked)
    
    else:
        st.info("Click 'Start Discovery' to begin searching for jobs.")


# ============================================================================
# MAIN APP
# ============================================================================

def main():
    """Main application router."""
    
    if not st.session_state.authenticated:
        page_login()
        return
    
    # Sidebar navigation
    st.sidebar.title("🎯 JobFlow AI")
    st.sidebar.markdown(f"**User:** {st.session_state.get('user_email', 'N/A')}")
    
    page = st.sidebar.radio(
        "Navigation",
        ["📄 Upload Resume", "✏️ Edit Matrix", "🔍 Job Results"]
    )
    
    if st.sidebar.button("🚪 Logout"):
        st.session_state.clear()
        st.rerun()
    
    # Route to pages
    if page == "📄 Upload Resume":
        page_upload_resume()
    elif page == "✏️ Edit Matrix":
        page_edit_matrix()
    elif page == "🔍 Job Results":
        page_serp()


if __name__ == "__main__":
    main()

"""
JobFlow AI - Streamlit Application
Production-grade career orchestration platform with dark mode UI.
"""

import streamlit as st
import pandas as pd
from datetime import datetime
from io import BytesIO
import asyncio
from typing import List, Optional

# Local imports
from models import UserProfile, SearchMatrix, JobOpportunity
from database import (
    init_db, save_user, get_user, create_session,
    save_jobs, get_jobs_for_session, mark_job_clicked
)
from engine import (
    analyze_profile, generate_search_matrix,
    process_job_batch, test_api_key,
    ingest_text, ingest_file, ingest_url, normalize_to_markdown
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
    }
    
    /* Enhanced Job Cards */
    .job-card {
        background: rgba(30, 37, 48, 0.7);
        backdrop-filter: blur(20px) saturate(180%);
        border-radius: 16px;
        padding: 24px;
        margin: 16px 0;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-left: 4px solid #4CAF50;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        transition: all 0.3s ease;
    }
    
    .job-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 40px rgba(76, 175, 80, 0.2);
        border-color: rgba(76, 175, 80, 0.3);
    }
    
    /* Typography */
    .job-title {
        font-size: 1.563rem;
        font-weight: 600;
        color: #4CAF50;
        margin-bottom: 8px;
    }
    
    .job-company {
        font-size: 1.1rem;
        color: #B0BEC5;
        margin-bottom: 12px;
        font-weight: 500;
    }
    
    /* Badges */
    .score-badge {
        display: inline-block;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.9rem;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .score-high { background: rgba(76, 175, 80, 0.2); color: #81C784; }
    .score-medium { background: rgba(255, 152, 0, 0.2); color: #FFB74D; }
    .score-low { background: rgba(244, 67, 54, 0.2); color: #E57373; }
    
    /* Inputs */
    .stTextInput>div>div>input {
        background: rgba(30, 37, 48, 0.5);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 12px;
    }
    
    /* Buttons */
    .stButton>button {
        background: linear-gradient(135deg, #4CAF50, #66BB6A);
        color: white;
        border: none;
        border-radius: 12px;
        padding: 12px 24px;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    
    .stButton>button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(76, 175, 80, 0.3);
    }
</style>
""", unsafe_allow_html=True)

# ============================================================================
# SESSION STATE INITIALIZATION
# ============================================================================

if 'authenticated' not in st.session_state:
    st.session_state.authenticated = False
if 'user_id' not in st.session_state:
    st.session_state.user_id = None
if 'api_key' not in st.session_state:
    st.session_state.api_key = None
if 'profile' not in st.session_state:
    st.session_state.profile = None
if 'search_matrix' not in st.session_state:
    st.session_state.search_matrix = None
if 'ingestion_step' not in st.session_state:
    st.session_state.ingestion_step = 'input'  # 'input' | 'verify' | 'analyzing' | 'complete'
if 'extracted_text' not in st.session_state:
    st.session_state.extracted_text = None
if 'source_type' not in st.session_state:
    st.session_state.source_type = None
if 'show_full_text' not in st.session_state:
    st.session_state.show_full_text = False
if 'normalized_text' not in st.session_state:
    st.session_state.normalized_text = None
if 'user_email' not in st.session_state:
    st.session_state.user_email = ""
if 'jobs' not in st.session_state:
    st.session_state.jobs = []
if 'current_session_id' not in st.session_state:
    st.session_state.current_session_id = None

# Initialize database
init_db()

# ============================================================================
# CALLBACK FUNCTIONS
# ============================================================================

def on_login_submit():
    """Callback for login form submission."""
    # This acts as a conceptual callback, logic remains in main flow for simpler state updates
    pass 

def on_show_full_toggle():
    st.session_state.show_full_text = not st.session_state.show_full_text

def on_confirm_analyze():
    st.session_state.ingestion_step = 'analyzing'

def on_edit_text():
    st.session_state.ingestion_step = 'input'
    st.session_state.extracted_text = None
    st.session_state.normalized_text = None

def on_discard_restart():
    keys_to_clear = ['profile', 'normalized_text', 'extracted_text', 'source_type', 'show_full_text']
    for key in keys_to_clear:
        if key in st.session_state:
             st.session_state[key] = None if key != 'show_full_text' else False
    st.session_state.ingestion_step = 'input'


# ============================================================================
# PAGES
# ============================================================================

def page_login():
    """Minimalist Login / BYOK Entry."""
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown("""
        <div style="text-align: center; margin-bottom: 2rem; margin-top: 4rem;">
            <h1 style="font-size: 3rem; color: #4CAF50; margin: 0;">JobFlow AI</h1>
            <p style="color: #B0BEC5; font-size: 1.2rem;">Career Discovery Engine</p>
        </div>
        """, unsafe_allow_html=True)
        
        with st.form("login_form"):
            st.markdown("### 🔑 Access Configuration")
            
            user_email = st.text_input(
                "Email Address",
                placeholder="you@example.com",
                key="login_email"
            )
            
            api_key = st.text_input(
                "Gemini API Key",
                type="password",
                placeholder="AIzaSw...",
                key="login_api_key",
                help="Your key is used for this session only."
            )
            
            # API Key Link
            st.markdown("""
            <div style="margin-top: -10px; margin-bottom: 20px; font-size: 0.9em;">
                <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color: #42A5F5; text-decoration: none;">
                    Get a Gemini API Key →
                </a>
            </div>
            """, unsafe_allow_html=True)
            
            submitted = st.form_submit_button("Start Session 🚀", use_container_width=True)
            
            if submitted:
                if not user_email or not api_key:
                    st.error("Please provide both Email and API Key.")
                else:
                    with st.spinner("Verifying credentials..."):
                        is_valid, msg = test_api_key(api_key)
                        
                        if is_valid:
                            st.session_state.authenticated = True
                            st.session_state.user_id = f"user_{hash(user_email)}"
                            st.session_state.user_email = user_email
                            st.session_state.api_key = api_key
                            st.success(msg)
                            st.rerun()
                        else:
                            st.error(msg)
                            st.markdown("---")
                            st.info("Ensure you have enabled 'Gemini API' in Google AI Studio.")

def page_upload_resume():
    """Universal Ingestor - Multi-modal resume input."""
    st.title("📄 Resume Ingestion")
    
    # Analyze Logic
    if st.session_state.ingestion_step == 'analyzing' and st.session_state.normalized_text and st.session_state.api_key:
        with st.spinner("Analyzing profile with Gemini..."):
            try:
                skills, seniority = analyze_profile(st.session_state.normalized_text, st.session_state.api_key)
                
                profile = UserProfile(
                    user_id=st.session_state.user_id,
                    raw_text=st.session_state.normalized_text,
                    extracted_skills=skills,
                    seniority=seniority
                )
                
                st.session_state.profile = profile
                
                # Save user to DB (encrypted key)
                save_user(profile, st.session_state.user_email, st.session_state.api_key)
                
                st.session_state.ingestion_step = 'complete'
                st.success("Analysis Complete!")
                st.rerun()
            except Exception as e:
                st.error(f"Analysis failed: {e}")
                st.session_state.ingestion_step = 'verify'
                if st.button("Retry"):
                    st.rerun()
        return

    # Completion View
    if st.session_state.ingestion_step == 'complete' and st.session_state.profile:
        st.success(f"✅ Profile Locked: {st.session_state.profile.seniority} Level")
        st.markdown(f"**Skills:** {', '.join(st.session_state.profile.extracted_skills)}")
        st.info("Navigate to '✏️ Edit Matrix' to continue.")
        if st.button("Reset Profile"):
            on_discard_restart()
            st.rerun()
        return

    # Input View
    if st.session_state.ingestion_step == 'input':
        tab1, tab2, tab3 = st.tabs(["⚡ Fast Paste", "☁️ Cloud Link", "💾 Local File"])
        
        with tab1:
            text_input = st.text_area("Resume Text", height=300, key="txt_in")
            if st.button("Process Text", key="btn_txt_proc"):
                if len(text_input) > 50:
                    st.session_state.extracted_text = ingest_text(text_input)
                    st.session_state.source_type = "text"
                    st.session_state.ingestion_step = 'verify'
                    st.rerun()
                else:
                    st.warning("Text too short.")

        with tab2:
            url_input = st.text_input("Document URL", key="url_in")
            if st.button("Fetch URL", key="btn_url_proc"):
                 try:
                    text = asyncio.run(ingest_url(url_input))
                    st.session_state.extracted_text = text
                    st.session_state.source_type = "url"
                    st.session_state.ingestion_step = 'verify'
                    st.rerun()
                 except Exception as e:
                    st.error(str(e))

        with tab3:
            uploaded = st.file_uploader("Upload PDF/DOCX", type=['pdf', 'docx'], key="file_in")
            if uploaded and st.button("Extract File", key="btn_file_proc"):
                try:
                    text = ingest_file(uploaded)
                    st.session_state.extracted_text = text
                    st.session_state.source_type = "file"
                    st.session_state.ingestion_step = 'verify'
                    st.rerun()
                except Exception as e:
                    st.error(str(e))

    # Verification View
    if st.session_state.ingestion_step == 'verify' and st.session_state.extracted_text:
        st.divider()
        st.subheader("🔍 Verification")
        
        if not st.session_state.normalized_text:
             st.session_state.normalized_text = normalize_to_markdown(st.session_state.extracted_text)
        
        # Checkbox with callback
        st.checkbox("Show full text", value=st.session_state.show_full_text, on_change=on_show_full_toggle)
        
        if st.session_state.show_full_text:
            st.text_area("Content", st.session_state.normalized_text, height=400, disabled=True)
        else:
            st.text_area("Preview", st.session_state.normalized_text[:500] + "...", height=200, disabled=True)
            
        col1, col2, col3 = st.columns(3)
        with col1:
            st.button("✅ Confirm & Analyze", type="primary", use_container_width=True, on_click=on_confirm_analyze)
        with col2:
            st.button("✏️ Edit Text", use_container_width=True, on_click=on_edit_text)
        with col3:
            st.button("🗑️ Discard", use_container_width=True, on_click=on_discard_restart)


def page_edit_matrix():
    """Search Matrix Logic."""
    st.title("✏️ Edit Search Matrix")
    
    if not st.session_state.profile:
        st.warning("Please upload resume first.")
        return

    if not st.session_state.search_matrix:
        if st.button("Generate Matrix"):
            with st.spinner("Generating Search Strategy..."):
                try:
                    matrix = generate_search_matrix(st.session_state.profile, st.session_state.api_key)
                    st.session_state.search_matrix = matrix
                    st.rerun()
                except Exception as e:
                    st.error(f"Generation failed: {e}")
    else:
        matrix = st.session_state.search_matrix
        
        col1, col2 = st.columns(2)
        with col1:
            st.subheader("Target Hubs")
            hubs = st.data_editor(pd.DataFrame({'Hub': matrix.suggested_hubs}), num_rows="dynamic", use_container_width=True, key="ed_hubs")
        with col2:
            st.subheader("Job Titles")
            titles = st.data_editor(pd.DataFrame({'Title': matrix.optimized_titles}), num_rows="dynamic", use_container_width=True, key="ed_titles")
            
        if st.button("💾 Save Configuration"):
            matrix.suggested_hubs = hubs['Hub'].tolist()
            matrix.optimized_titles = titles['Title'].tolist()
            st.session_state.search_matrix = matrix
            
            # Create Session
            st.session_state.current_session_id = create_session(st.session_state.user_id, matrix)
            st.success("Configuration Saved!")

def page_serp():
    """Results Page."""
    st.title("🔍 Job Discovery")
    if not st.session_state.current_session_id:
        st.info("Please generate and save your matrix first.")
        return

    # Note: Actual scraping logic would go here. For now we just show stored jobs if any.
    jobs = get_jobs_for_session(st.session_state.current_session_id)
    
    if jobs:
        st.write(f"Found {len(jobs)} jobs.")
        # Render jobs...
    else:
        st.info("No jobs found in this session yet. (Search integration pending)")


# ============================================================================
# MAIN
# ============================================================================

def main():
    if not st.session_state.authenticated:
        page_login()
    else:
        with st.sidebar:
            st.title("JobFlow AI")
            st.caption(f"User: {st.session_state.user_email}")
            nav = st.radio("Navigate", ["📄 Upload Resume", "✏️ Edit Matrix", "🔍 Job Results"])
            if st.button("Log Out"):
                st.session_state.clear()
                st.rerun()
        
        if nav == "📄 Upload Resume":
            page_upload_resume()
        elif nav == "✏️ Edit Matrix":
            page_edit_matrix()
        elif nav == "🔍 Job Results":
            page_serp()

if __name__ == "__main__":
    main()

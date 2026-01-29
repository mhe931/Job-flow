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

# Dark mode CSS
st.markdown("""
<style>
    /* Dark mode theme */
    .stApp {
        background-color: #0E1117;
        color: #FAFAFA;
    }
    
    /* Job card styling */
    .job-card {
        background: linear-gradient(135deg, #1E2530 0%, #252D3A 100%);
        border-radius: 12px;
        padding: 20px;
        margin: 15px 0;
        border-left: 4px solid #4CAF50;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
    }
    
    .job-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(76, 175, 80, 0.2);
    }
    
    .job-card-clicked {
        opacity: 0.6;
        filter: grayscale(50%);
        border-left-color: #666;
    }
    
    .job-title {
        font-size: 1.4em;
        font-weight: 700;
        color: #4CAF50;
        margin-bottom: 8px;
    }
    
    .job-company {
        font-size: 1.1em;
        color: #B0BEC5;
        margin-bottom: 12px;
    }
    
    .job-meta {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
        margin: 12px 0;
        font-size: 0.95em;
    }
    
    .job-meta-item {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    
    .score-badge {
        display: inline-block;
        padding: 6px 12px;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.9em;
    }
    
    .score-high {
        background: linear-gradient(135deg, #4CAF50, #66BB6A);
        color: white;
    }
    
    .score-medium {
        background: linear-gradient(135deg, #FF9800, #FFB74D);
        color: white;
    }
    
    .score-low {
        background: linear-gradient(135deg, #F44336, #EF5350);
        color: white;
    }
    
    .salary-verified {
        color: #4CAF50;
        font-weight: 600;
    }
    
    .salary-inferred {
        color: #FF9800;
    }
    
    .ghost-job-warning {
        background: #FF5252;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-weight: 600;
        display: inline-block;
    }
    
    /* Matrix editor */
    .matrix-grid {
        background: #1E2530;
        border-radius: 8px;
        padding: 20px;
    }
    
    /* Buttons */
    .stButton>button {
        background: linear-gradient(135deg, #4CAF50, #66BB6A);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 24px;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    
    .stButton>button:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
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
if 'profile' not in st.session_state:
    st.session_state.profile = None
if 'search_matrix' not in st.session_state:
    st.session_state.search_matrix = None
if 'current_session_id' not in st.session_state:
    st.session_state.current_session_id = None
if 'jobs' not in st.session_state:
    st.session_state.jobs = []

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
    """Login page with API key setup."""
    st.title("🎯 JobFlow AI")
    st.subheader("Career Discovery Engine")
    
    st.markdown("""
    ### Welcome to JobFlow AI
    
    Transform your resume into strategic job discovery campaigns with:
    - **AI-Powered Profile Analysis** - Extract skills & seniority automatically
    - **Strategic Matrix** - 10 hubs × 8 titles = 80 targeted searches
    - **Dual-Score Ranking** - Match Score + Hiring Probability
    - **Salary Benchmarking** - Verified + AI-inferred ranges with confidence
    - **Ghost Job Detection** - Filter out stale/suspicious postings
    """)
    
    with st.form("login_form"):
        st.markdown("#### Enter Your Gemini API Key")
        api_key = st.text_input("Google Gemini API Key", type="password")
        user_email = st.text_input("Email (for session tracking)")
        
        submitted = st.form_submit_button("🚀 Start Discovery")
        
        if submitted:
            if api_key and user_email:
                # Set API key
                set_api_key(api_key)
                
                # Create mock user ID (replace with real OAuth in production)
                user_id = f"user_{hash(user_email)}"
                
                st.session_state.authenticated = True
                st.session_state.user_id = user_id
                st.session_state.user_email = user_email
                st.session_state.api_key = api_key
                
                st.success("✅ Authenticated! Redirecting...")
                st.rerun()
            else:
                st.error("Please provide both API key and email.")


def page_upload_resume():
    """Resume upload and analysis page."""
    st.title("📄 Upload Resume")
    
    tab1, tab2 = st.tabs(["Upload File", "Paste Text"])
    
    with tab1:
        uploaded_file = st.file_uploader(
            "Upload your resume (PDF or DOCX)",
            type=['pdf', 'docx']
        )
        
        if uploaded_file:
            if uploaded_file.type == "application/pdf":
                raw_text = extract_text_from_pdf(uploaded_file)
            else:
                raw_text = extract_text_from_docx(uploaded_file)
            
            st.text_area("Extracted Text (verify accuracy)", raw_text, height=200)
            
            if st.button("🔍 Analyze Profile"):
                with st.spinner("Analyzing resume with Gemini Flash..."):
                    try:
                        skills, seniority = analyze_profile(raw_text)
                        
                        profile = UserProfile(
                            user_id=st.session_state.user_id,
                            raw_text=raw_text,
                            extracted_skills=skills,
                            seniority=seniority
                        )
                        
                        st.session_state.profile = profile
                        
                        # Save to database
                        save_user(profile, st.session_state.user_email, st.session_state.api_key)
                        
                        st.success(f"✅ Profile analyzed! Seniority: **{seniority}**")
                        st.write(f"**Extracted Skills:** {', '.join(skills)}")
                        
                        st.info("Proceed to 'Generate Matrix' in the sidebar.")
                    
                    except Exception as e:
                        st.error(f"Analysis failed: {e}")
    
    with tab2:
        raw_text = st.text_area("Paste your resume text here", height=300)
        
        if st.button("🔍 Analyze Profile"):
            if raw_text:
                with st.spinner("Analyzing resume with Gemini Flash..."):
                    try:
                        skills, seniority = analyze_profile(raw_text)
                        
                        profile = UserProfile(
                            user_id=st.session_state.user_id,
                            raw_text=raw_text,
                            extracted_skills=skills,
                            seniority=seniority
                        )
                        
                        st.session_state.profile = profile
                        save_user(profile, st.session_state.user_email, st.session_state.api_key)
                        
                        st.success(f"✅ Profile analyzed! Seniority: **{seniority}**")
                        st.write(f"**Extracted Skills:** {', '.join(skills)}")
                        
                        st.info("Proceed to 'Generate Matrix' in the sidebar.")
                    
                    except Exception as e:
                        st.error(f"Analysis failed: {e}")
            else:
                st.warning("Please paste resume text first.")


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

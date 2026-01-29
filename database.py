"""
JobFlow AI - Database Layer
SQLAlchemy persistence with encryption and session management.
"""

import json
import os
from datetime import datetime, timedelta
from typing import List, Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
from sqlalchemy import create_engine, desc
from sqlalchemy.orm import sessionmaker, Session as DBSession
from models import Base, User, Session, DiscoveredJob, UserProfile, SearchMatrix, JobOpportunity

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///jobflow.db')
ENCRYPTION_MASTER_KEY = os.getenv('ENCRYPTION_MASTER_KEY', 'default_32_byte_key_change_this!!')

engine = create_engine(
    DATABASE_URL,
    connect_args={'check_same_thread': False},  # For SQLite
    echo=False  # Set to True for SQL query logging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ============================================================================
# INITIALIZATION
# ============================================================================

def init_db() -> None:
    """
    Create all tables with indexes.
    Safe to call multiple times (idempotent).
    """
    Base.metadata.create_all(bind=engine)
    
    # Create indexes for performance
    with engine.connect() as conn:
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_sessions_user_id 
            ON sessions(user_id)
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_jobs_session_id 
            ON discovered_jobs(session_id)
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_jobs_hire_probability 
            ON discovered_jobs(hire_probability DESC)
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_jobs_clicked_at 
            ON discovered_jobs(clicked_at)
        """)
        conn.commit()


# ============================================================================
# ENCRYPTION UTILITIES
# ============================================================================

def _derive_key(user_id: str) -> bytes:
    """Derive encryption key from user_id using PBKDF2."""
    kdf = PBKDF2(
        algorithm=hashes.SHA256(),
        length=32,
        salt=ENCRYPTION_MASTER_KEY.encode()[:16],
        iterations=100000
    )
    return kdf.derive(user_id.encode())


def encrypt_api_key(key: str, user_id: str) -> str:
    """Encrypt API key with user-specific salt."""
    fernet = Fernet(_derive_key(user_id))
    encrypted = fernet.encrypt(key.encode())
    return encrypted.decode()


def decrypt_api_key(encrypted: str, user_id: str) -> str:
    """Decrypt API key with user-specific salt."""
    fernet = Fernet(_derive_key(user_id))
    decrypted = fernet.decrypt(encrypted.encode())
    return decrypted.decode()


# ============================================================================
# USER OPERATIONS
# ============================================================================

def save_user(profile: UserProfile, email: str, api_key: Optional[str] = None) -> None:
    """
    Create or update user record.
    
    Args:
        profile: UserProfile Pydantic model
        email: User's email from OAuth
        api_key: Optional Gemini API key to encrypt and store
    """
    db: DBSession = SessionLocal()
    try:
        user = db.query(User).filter(User.user_id == profile.user_id).first()
        
        if user:
            # Update existing
            user.raw_resume = profile.raw_text
            user.updated_at = datetime.utcnow()
            if api_key:
                user.encrypted_api_key = encrypt_api_key(api_key, profile.user_id)
        else:
            # Create new
            user = User(
                user_id=profile.user_id,
                email=email,
                raw_resume=profile.raw_text,
                encrypted_api_key=encrypt_api_key(api_key, profile.user_id) if api_key else None
            )
            db.add(user)
        
        db.commit()
    finally:
        db.close()


def get_user(user_id: str) -> Optional[User]:
    """Retrieve user by ID."""
    db: DBSession = SessionLocal()
    try:
        return db.query(User).filter(User.user_id == user_id).first()
    finally:
        db.close()


def get_user_api_key(user_id: str) -> Optional[str]:
    """Retrieve and decrypt user's API key."""
    db: DBSession = SessionLocal()
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if user and user.encrypted_api_key:
            return decrypt_api_key(user.encrypted_api_key, user_id)
        return None
    finally:
        db.close()


# ============================================================================
# SESSION OPERATIONS
# ============================================================================

def create_session(user_id: str, matrix: SearchMatrix) -> str:
    """
    Create new search session.
    
    Args:
        user_id: User's unique ID
        matrix: SearchMatrix Pydantic model
    
    Returns:
        session_id: Unique session identifier
    """
    db: DBSession = SessionLocal()
    try:
        session_id = f"session_{user_id}_{int(datetime.utcnow().timestamp())}"
        
        session = Session(
            session_id=session_id,
            user_id=user_id,
            search_matrix=matrix.model_dump_json()  # Pydantic v2 method
        )
        db.add(session)
        db.commit()
        
        return session_id
    finally:
        db.close()


def get_user_sessions(user_id: str, limit: int = 10) -> List[Session]:
    """Get user's recent sessions."""
    db: DBSession = SessionLocal()
    try:
        return db.query(Session)\
            .filter(Session.user_id == user_id)\
            .order_by(desc(Session.created_at))\
            .limit(limit)\
            .all()
    finally:
        db.close()


# ============================================================================
# JOB OPERATIONS
# ============================================================================

def save_jobs(session_id: str, jobs: List[JobOpportunity]) -> None:
    """
    Bulk save discovered jobs.
    
    Args:
        session_id: Session identifier
        jobs: List of JobOpportunity Pydantic models
    """
    db: DBSession = SessionLocal()
    try:
        for job in jobs:
            db_job = DiscoveredJob(
                job_id=job.job_id,
                session_id=session_id,
                title=job.title,
                company=job.company,
                hub=job.hub,
                salary_range=job.salary_range,
                is_verified_salary=job.is_verified_salary,
                salary_confidence=job.salary_confidence,
                match_score=job.match_score,
                hire_probability=job.hire_probability,
                url=job.url,
                post_date=job.post_date,
                is_ghost_job=job.is_ghost_job,
                viewed_at=job.viewed_at,
                clicked_at=job.clicked_at
            )
            db.add(db_job)
        
        db.commit()
    finally:
        db.close()


def get_jobs_for_session(
    session_id: str,
    include_clicked: bool = True,
    min_match_score: float = 0.0
) -> List[JobOpportunity]:
    """
    Retrieve jobs for a session with Recede Logic sorting.
    
    Args:
        session_id: Session identifier
        include_clicked: If False, exclude clicked jobs
        min_match_score: Minimum match score filter
    
    Returns:
        List of JobOpportunity Pydantic models, sorted by:
        1. Unclicked first (clicked_at IS NULL)
        2. Hire probability descending
    """
    db: DBSession = SessionLocal()
    try:
        query = db.query(DiscoveredJob)\
            .filter(DiscoveredJob.session_id == session_id)\
            .filter(DiscoveredJob.match_score >= min_match_score)
        
        if not include_clicked:
            query = query.filter(DiscoveredJob.clicked_at.is_(None))
        
        # Recede Logic: unclicked first, then by hire_probability
        query = query.order_by(
            DiscoveredJob.clicked_at.is_(None).desc(),
            desc(DiscoveredJob.hire_probability)
        )
        
        db_jobs = query.all()
        
        # Convert to Pydantic models
        return [
            JobOpportunity(
                job_id=job.job_id,
                title=job.title,
                company=job.company,
                hub=job.hub,
                salary_range=job.salary_range,
                is_verified_salary=job.is_verified_salary,
                salary_confidence=job.salary_confidence,
                match_score=job.match_score,
                hire_probability=job.hire_probability,
                url=job.url,
                post_date=job.post_date,
                is_ghost_job=job.is_ghost_job,
                viewed_at=job.viewed_at,
                clicked_at=job.clicked_at
            )
            for job in db_jobs
        ]
    finally:
        db.close()


def mark_job_clicked(job_id: str) -> None:
    """
    Mark job as clicked (for Recede Logic).
    
    Args:
        job_id: Job identifier
    """
    db: DBSession = SessionLocal()
    try:
        job = db.query(DiscoveredJob).filter(DiscoveredJob.job_id == job_id).first()
        if job:
            job.clicked_at = datetime.utcnow()
            db.commit()
    finally:
        db.close()


def mark_job_viewed(job_id: str) -> None:
    """
    Mark job as viewed (for analytics).
    
    Args:
        job_id: Job identifier
    """
    db: DBSession = SessionLocal()
    try:
        job = db.query(DiscoveredJob).filter(DiscoveredJob.job_id == job_id).first()
        if job and not job.viewed_at:
            job.viewed_at = datetime.utcnow()
            db.commit()
    finally:
        db.close()


# ============================================================================
# CLEANUP OPERATIONS
# ============================================================================

def purge_old_jobs(days: int = 90) -> int:
    """
    Delete jobs older than specified days.
    
    Args:
        days: Age threshold in days
    
    Returns:
        Number of jobs deleted
    """
    db: DBSession = SessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(days=days)
        deleted = db.query(DiscoveredJob)\
            .filter(DiscoveredJob.post_date < cutoff)\
            .delete()
        db.commit()
        return deleted
    finally:
        db.close()

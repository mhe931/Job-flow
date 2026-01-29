"""
JobFlow AI - Data Models
Pydantic schemas and SQLAlchemy ORM models for type-safe data handling.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, validator
from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey, String, Text, create_engine
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

# ============================================================================
# PYDANTIC SCHEMAS (API/Business Logic Layer)
# ============================================================================

class UserProfile(BaseModel):
    """User profile extracted from resume analysis."""
    user_id: str = Field(..., description="Google OAuth2 UID")
    raw_text: str = Field(..., description="Extracted resume content")
    extracted_skills: List[str] = Field(
        default_factory=list,
        description="Tech stack (e.g., ['Python', 'React', 'AWS'])"
    )
    seniority: str = Field(
        ...,
        description="Junior | Mid | Senior | Lead | Principal"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @validator('seniority')
    def validate_seniority(cls, v):
        allowed = ['Junior', 'Mid', 'Senior', 'Lead', 'Principal']
        if v not in allowed:
            raise ValueError(f'Seniority must be one of {allowed}')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "google_oauth_123",
                "raw_text": "Senior Software Engineer with 7 years...",
                "extracted_skills": ["Python", "Django", "PostgreSQL", "AWS"],
                "seniority": "Senior",
                "created_at": "2026-01-29T10:00:00Z",
                "updated_at": "2026-01-29T10:00:00Z"
            }
        }


class SearchMatrix(BaseModel):
    """10 hubs × 8 titles search configuration."""
    user_id: str
    suggested_hubs: List[str] = Field(
        ...,
        min_length=10,
        max_length=10,
        description="10 geographic regions (e.g., ['Berlin', 'Toronto'])"
    )
    optimized_titles: List[str] = Field(
        ...,
        min_length=8,
        max_length=8,
        description="8 job titles (e.g., ['Senior Backend Engineer'])"
    )
    is_editable: bool = True
    generated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "google_oauth_123",
                "suggested_hubs": [
                    "Berlin", "Toronto", "Singapore", "London", "Amsterdam",
                    "New York", "San Francisco", "Austin", "Seattle", "Dublin"
                ],
                "optimized_titles": [
                    "Senior Backend Engineer",
                    "Platform Engineer",
                    "ML Platform Engineer",
                    "Senior Python Developer",
                    "Backend Architect",
                    "Senior Software Engineer",
                    "API Platform Engineer",
                    "Senior Cloud Engineer"
                ],
                "is_editable": True,
                "generated_at": "2026-01-29T10:05:00Z"
            }
        }


class JobOpportunity(BaseModel):
    """Individual job opportunity with dual scores and salary data."""
    job_id: str = Field(..., description="UUID")
    title: str
    company: str
    hub: str = Field(..., description="Geographic location")
    salary_range: Optional[str] = Field(
        None,
        description="e.g., '$120K-$160K USD'"
    )
    is_verified_salary: bool = Field(
        False,
        description="True if extracted from job text, False if inferred"
    )
    salary_confidence: Optional[float] = Field(
        None,
        ge=0,
        le=100,
        description="0-100% (only for inferred salaries)"
    )
    match_score: float = Field(..., ge=0, le=100, description="Technical Alignment")
    hire_probability: float = Field(..., ge=0, le=100, description="Success Prediction")
    url: str
    post_date: datetime
    is_ghost_job: bool = Field(
        False,
        description="Flagged if posting is >60 days old or URL is suspicious"
    )
    viewed_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "uuid-1234",
                "title": "Senior ML Engineer",
                "company": "DeepMind",
                "hub": "London",
                "salary_range": "£110K-£150K",
                "is_verified_salary": True,
                "salary_confidence": None,
                "match_score": 94.5,
                "hire_probability": 87.2,
                "url": "https://careers.deepmind.com/job/123",
                "post_date": "2026-01-29T08:00:00Z",
                "is_ghost_job": False,
                "viewed_at": None,
                "clicked_at": None
            }
        }


# ============================================================================
# SQLALCHEMY ORM MODELS (Database Layer)
# ============================================================================

Base = declarative_base()


class User(Base):
    """User table with encrypted API key storage."""
    __tablename__ = 'users'

    user_id = Column(String, primary_key=True)
    email = Column(String, nullable=False)
    raw_resume = Column(Text, nullable=True)
    encrypted_api_key = Column(Text, nullable=True)  # AES-256 encrypted
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")


class Session(Base):
    """Search session with serialized SearchMatrix."""
    __tablename__ = 'sessions'

    session_id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey('users.user_id'), nullable=False)
    search_matrix = Column(Text, nullable=False)  # JSON serialized SearchMatrix
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="sessions")
    jobs = relationship("DiscoveredJob", back_populates="session", cascade="all, delete-orphan")


class DiscoveredJob(Base):
    """Discovered job with scores and interaction tracking."""
    __tablename__ = 'discovered_jobs'

    job_id = Column(String, primary_key=True)
    session_id = Column(String, ForeignKey('sessions.session_id'), nullable=False)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    hub = Column(String, nullable=False)
    salary_range = Column(String, nullable=True)
    is_verified_salary = Column(Boolean, default=False)
    salary_confidence = Column(Float, nullable=True)
    match_score = Column(Float, nullable=False)
    hire_probability = Column(Float, nullable=False)
    url = Column(Text, nullable=False)
    post_date = Column(DateTime, nullable=False)
    is_ghost_job = Column(Boolean, default=False)
    viewed_at = Column(DateTime, nullable=True)
    clicked_at = Column(DateTime, nullable=True)

    # Relationships
    session = relationship("Session", back_populates="jobs")

    # Indexes for performance
    __table_args__ = (
        {'sqlite_autoincrement': True}
    )

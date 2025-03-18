import pytest
import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.db.base import Base
from app.core.config import settings
from app.main import app
from app.models.household import HouseholdMember
from datetime import date
from dotenv import load_dotenv

# Load test environment variables
load_dotenv("src/backend/.env.test")

# Use environment variable for database URL
TEST_DATABASE_URL = os.getenv("DATABASE_URL")
if not TEST_DATABASE_URL:
    raise ValueError("DATABASE_URL must be set in .env.test file")

@pytest.fixture(scope="session")
def engine():
    """Create a test database engine."""
    engine = create_engine(TEST_DATABASE_URL)
    
    # Create all tables
    Base.metadata.drop_all(bind=engine)  # Clean start
    Base.metadata.create_all(bind=engine)
    
    yield engine
    
    # Clean up at end of session
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(engine) -> Generator:
    """Create a fresh database session for each test."""
    Session = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = Session()

    try:
        # Create a test household member that can be used by all tests
        birthday = date(1990, 1, 1)
        retirement_age_planned = 67
        retirement_age_possible = 63
        retirement_date_planned = date(
            birthday.year + retirement_age_planned,
            birthday.month,
            birthday.day
        )
        retirement_date_possible = date(
            birthday.year + retirement_age_possible,
            birthday.month,
            birthday.day
        )
        
        member = HouseholdMember(
            first_name="Test",
            last_name="User",
            birthday=birthday,
            retirement_age_planned=retirement_age_planned,
            retirement_age_possible=retirement_age_possible,
            retirement_date_planned=retirement_date_planned,
            retirement_date_possible=retirement_date_possible
        )
        session.add(member)
        session.commit()
    except Exception as e:
        session.rollback()
        raise Exception(f"Failed to create test member: {str(e)}")
    
    yield session
    
    try:
        # Clean up after each test
        session.rollback()  # Rollback any failed transaction
        
        # Delete all data except the test member
        for table in reversed(Base.metadata.sorted_tables):
            if table.name != 'household_members':  # Keep the test member
                session.execute(table.delete())
        session.commit()
    finally:
        session.close()

@pytest.fixture(scope="module")
def client() -> Generator:
    """Create a test client for API tests."""
    with TestClient(app) as test_client:
        yield test_client 
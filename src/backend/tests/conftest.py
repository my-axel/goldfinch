import pytest
import os
import sys
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from fastapi.testclient import TestClient
from pathlib import Path
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_project_root() -> Path:
    """Get the absolute project root directory."""
    # Start with the directory of this file
    current_dir = Path(__file__).resolve().parent
    
    # The project root is the parent of the 'tests' directory
    project_root = current_dir.parent
    
    # Log the paths for debugging
    logger.info(f"Current directory: {current_dir}")
    logger.info(f"Project root: {project_root}")
    
    # Make sure we have the right directory structure
    if not (project_root / "app").exists():
        logger.warning(f"Project root directory doesn't contain 'app' folder: {project_root}")
        # If we're running from an unexpected location, try to find the correct root
        if (current_dir.parent.parent / "backend" / "app").exists():
            project_root = current_dir.parent.parent / "backend"
            logger.info(f"Found alternative project root: {project_root}")
    
    # Add project root to sys.path if it's not already there
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))
        logger.info(f"Added {project_root} to sys.path")
    
    return project_root

# Get the project root
project_root = get_project_root()

# Try to import the models - do this after updating sys.path
try:
    # Import all models to ensure they're available for Base.metadata.create_all
    from app.db.base import Base
    from app.models.household import HouseholdMember
    from app.models.pension_state import PensionState, PensionStateStatement
    from app.models.enums import PensionStatus
    from app.main import app
except ImportError as e:
    logger.error(f"Failed to import models: {e}")
    logger.error(f"sys.path: {sys.path}")
    raise

# Load test environment
env_path = project_root / ".env.test"
if env_path.exists():
    logger.info(f"Loading environment from {env_path}")
    load_dotenv(env_path)
else:
    logger.warning(f"Test environment file not found at {env_path}")

# Test database URL - fallback to a default if not specified
TEST_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/goldfinch_test")
logger.info(f"Using database URL: {TEST_DATABASE_URL}")

# Make sure it's pointing to the test database, not the production one
if "goldfinch_test" not in TEST_DATABASE_URL:
    logger.warning(f"DATABASE_URL does not contain goldfinch_test: {TEST_DATABASE_URL}")
    TEST_DATABASE_URL = TEST_DATABASE_URL.rsplit('/', 1)[0] + '/goldfinch_test'
    logger.info(f"Using modified test database URL: {TEST_DATABASE_URL}")
    
# Base database URL (without database name) for creating/dropping the database
BASE_DATABASE_URL = TEST_DATABASE_URL.rsplit('/', 1)[0] + '/postgres'
logger.info(f"Using base database URL: {BASE_DATABASE_URL}")

def terminate_connections():
    """Terminate all connections to the test database."""
    try:
        logger.info("Terminating connections to goldfinch_test database...")
        engine = create_engine(BASE_DATABASE_URL)
        with engine.connect() as conn:
            conn.execute(text("""
                SELECT pg_terminate_backend(pid) 
                FROM pg_stat_activity 
                WHERE datname = 'goldfinch_test'
                AND pid <> pg_backend_pid()
            """))
            conn.execute(text("COMMIT"))
        engine.dispose()
        logger.info("Connections terminated successfully")
    except Exception as e:
        logger.error(f"Error terminating connections: {e}")
        logger.exception(e)

# Global variables to store session-wide connection and transaction
_connection = None
_transaction = None

@pytest.fixture(scope="session")
def setup_database():
    """Set up the test database once for the entire test session."""
    global _connection, _transaction
    
    try:
        # Connect to postgres db to manage test database
        logger.info(f"Connecting to base database at {BASE_DATABASE_URL}")
        engine = create_engine(BASE_DATABASE_URL)
        
        # Terminate existing connections
        terminate_connections()
        
        # Check if database exists
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT 1 FROM pg_database WHERE datname='goldfinch_test'"
            ))
            db_exists = result.scalar() == 1
            
            # Begin transaction for database operations
            conn.execute(text("COMMIT"))
            
            # Only drop and recreate if it exists
            if db_exists:
                logger.info("goldfinch_test database already exists")
                try:
                    conn.execute(text("DROP DATABASE IF EXISTS goldfinch_test"))
                    logger.info("Dropped existing goldfinch_test database")
                except Exception as e:
                    logger.warning(f"Could not drop database: {e}")
                    logger.warning("Will try to use existing database")
            
            # Try to create database if it doesn't exist
            if not db_exists or (db_exists and (
                len(logger.handlers) == 0 or 
                not hasattr(logger.handlers[0], 'buffer') or 
                len(logger.handlers[0].buffer) == 0 or 
                "Could not drop database" not in logger.handlers[0].formatter.format(logger.handlers[0].buffer[-1])
            )):
                try:
                    conn.execute(text("CREATE DATABASE goldfinch_test"))
                    logger.info("Created goldfinch_test database")
                except Exception as e:
                    logger.warning(f"Could not create database: {e}")
                    logger.warning("Will try to use existing database")
            
        engine.dispose()
        
        # Create engine connected to the test database
        logger.info(f"Connecting to test database at {TEST_DATABASE_URL}")
        test_engine = create_engine(
            TEST_DATABASE_URL,
            # Increase pool size for concurrent tests
            pool_size=20,
            max_overflow=0
        )
        
        # Try to create tables if they don't exist
        try:
            # Create all tables using SQLAlchemy models
            logger.info("Creating tables from SQLAlchemy models")
            Base.metadata.create_all(test_engine)
            logger.info("Tables created successfully")
        except Exception as e:
            logger.warning(f"Error creating tables: {e}")
            logger.warning("Tables may already exist, continuing with tests")
        
        # Create a connection for the entire test session
        _connection = test_engine.connect()
        
        # Begin a transaction that will be active for the entire test session
        _transaction = _connection.begin()
        
        yield test_engine
        
    except Exception as e:
        logger.error(f"Error in setup_database fixture: {e}")
        logger.exception(e)
        raise
    finally:
        # Clean up after all tests
        logger.info("Cleaning up database setup")
        if _transaction:
            _transaction.rollback()
        if _connection:
            _connection.close()
        if 'test_engine' in locals():
            test_engine.dispose()
        logger.info("Database cleanup completed")

@pytest.fixture(scope="session")
def db_engine(setup_database):
    """Return the SQLAlchemy engine. This just returns the engine created in setup_database."""
    return setup_database

@pytest.fixture(scope="function")
def db_session(db_engine) -> Generator[Session, None, None]:
    """
    Provide a database session for each test function.
    
    This creates a savepoint in the session-wide transaction,
    then rolls back to that savepoint after the test completes.
    This provides isolation between tests while being much faster
    than creating a new database for each test.
    
    If the connection is in an error state, it falls back to 
    creating a new connection.
    """
    global _connection
    
    try:
        # First, try to use the session-wide connection with savepoints
        if _connection is not None:
            try:
                # Test if connection is still valid by executing a simple query
                _connection.execute(text("SELECT 1"))
                
                # Create a savepoint
                savepoint = _connection.begin_nested()
                
                # Create a session with the connection
                session_factory = sessionmaker(bind=_connection, expire_on_commit=False)
                session = session_factory()
                
                try:
                    yield session
                finally:
                    # Roll back to the savepoint after the test
                    session.close()
                    savepoint.rollback()
                
                # If we get here, everything worked and we can return
                return
            except Exception as e:
                # Connection might be in a bad state, log and continue to fallback
                logger.warning(f"Error using session-wide connection: {e}")
                logger.warning("Falling back to individual connection")
        
        # Fallback: create a new connection and transaction for this test
        logger.info("Creating individual connection for test")
        connection = db_engine.connect()
        transaction = connection.begin()
        
        session_factory = sessionmaker(bind=connection, expire_on_commit=False)
        session = session_factory()
        
        try:
            yield session
        finally:
            session.close()
            transaction.rollback()
            connection.close()
            
    except Exception as e:
        logger.error(f"Error in db_session fixture: {e}")
        logger.exception(e)
        raise

@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator:
    """Create a test client for API tests with the test database session."""
    from app.api.v1.deps import get_db
    
    # Override the dependency to use our test session
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    # Apply the override
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    # Remove the override after the test
    app.dependency_overrides.clear()

# Import factories for test data creation
from tests import factories

@pytest.fixture(scope="function")
def test_member(db_session) -> Generator:
    """Create a test household member using factory."""
    member = factories.create_test_member(db_session)
    yield member

@pytest.fixture(scope="function")
def test_pension_state(db_session, test_member) -> Generator:
    """Create a test pension state using factory."""
    pension = factories.create_test_pension_state(db_session, member_id=test_member.id)
    yield pension

@pytest.fixture(scope="function")
def test_pension_statement(db_session, test_pension_state) -> Generator:
    """Create a test pension statement using factory."""
    statement = factories.create_test_pension_statement(db_session, pension_id=test_pension_state.id)
    yield statement 
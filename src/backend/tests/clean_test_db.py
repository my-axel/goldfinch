#!/usr/bin/env python3
"""
Utility script to clean up any existing connections to the test database
Run this before pytest if you're having issues with "database is being accessed by other users"
"""

import os
from sqlalchemy import create_engine, text
import logging
from pathlib import Path
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_project_root() -> Path:
    """Get the absolute project root directory."""
    return Path(__file__).resolve().parent.parent

# Load test environment
env_path = get_project_root() / ".env.test"
if env_path.exists():
    load_dotenv(env_path)
else:
    logger.warning(f"Test environment file not found at {env_path}")

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/goldfinch_test")

# Make sure it's pointing to the test database, not the production one
if "goldfinch_test" not in DATABASE_URL:
    logger.warning(f"DATABASE_URL does not contain goldfinch_test: {DATABASE_URL}")
    DATABASE_URL = DATABASE_URL.rsplit('/', 1)[0] + '/goldfinch_test'
    logger.info(f"Using test database URL: {DATABASE_URL}")

BASE_DATABASE_URL = DATABASE_URL.rsplit('/', 1)[0] + '/postgres'

def main():
    """Terminate all connections to the test database."""
    logger.info(f"Terminating connections to goldfinch_test database using {BASE_DATABASE_URL}...")
    
    try:
        engine = create_engine(BASE_DATABASE_URL)
        with engine.connect() as conn:
            # First, get connection count
            result = conn.execute(text("""
                SELECT COUNT(*) FROM pg_stat_activity 
                WHERE datname = 'goldfinch_test'
                AND pid <> pg_backend_pid()
            """)).scalar()
            
            if result > 0:
                logger.info(f"Found {result} active connections to terminate")
                
                # Terminate connections
                conn.execute(text("""
                    SELECT pg_terminate_backend(pid) 
                    FROM pg_stat_activity 
                    WHERE datname = 'goldfinch_test'
                    AND pid <> pg_backend_pid()
                """))
                conn.execute(text("COMMIT"))
                logger.info("Connections terminated successfully")
            else:
                logger.info("No active connections found")
        
        engine.dispose()
        logger.info("Database cleanup completed successfully")
        
    except Exception as e:
        logger.error(f"Error during database cleanup: {e}")

if __name__ == "__main__":
    main() 
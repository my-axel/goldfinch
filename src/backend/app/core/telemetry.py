"""
OpenTelemetry instrumentation for the Goldfinch application.
This module sets up monitoring with SigNoz when enabled via configuration.
"""
import logging
import re
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, FastAPI
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor
from opentelemetry.sdk.resources import Resource
from app.core.monitoring.settings import get_monitoring_settings
from sqlalchemy import event
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)

# Regex patterns for SQL query extraction
SQL_TABLE_PATTERN = re.compile(r'(?:FROM|UPDATE|INSERT INTO|DELETE FROM|JOIN)\s+([a-zA-Z0-9_\.]+)')
SQL_OPERATION_PATTERN = re.compile(r'^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|BEGIN|COMMIT|ROLLBACK)')

# Simple middleware to enhance span information
class SpanEnhancerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Process the request first to ensure all spans are created
        response = await call_next(request)

        # Now get the current span context at the end of the request
        # This ensures we're working with completed spans
        if request.url.path.startswith("/api/v1"):
            # Extract meaningful parts of the path
            path_parts = request.url.path.split("/")
            if len(path_parts) >= 4:
                resource = path_parts[3]
                operation = request.method.lower()
                
                # Get the current span
                current_span = trace.get_current_span()
                if current_span:
                    # Set custom attributes that will be visible in SigNoz
                    current_span.set_attribute("goldfinch.resource", resource)
                    current_span.set_attribute("goldfinch.operation", operation)
                    current_span.set_attribute("goldfinch.path", request.url.path)
                    
                    # Update the span name to be more descriptive
                    new_name = f"{operation}_{resource}"
                    current_span.update_name(new_name)
                    
                    # Log the span kind for debugging
                    logger.debug(f"Enhanced API span to: {new_name}")
        
        return response

def extract_table_name(sql: str) -> str:
    """Extract table name from SQL statement."""
    if not sql:
        return "unknown_table"
    
    # Remove comments to avoid matching inside them
    sql_clean = re.sub(r'/\*.*?\*/', '', sql)
    
    # Try to find the table name
    match = SQL_TABLE_PATTERN.search(sql_clean)
    if match:
        # Get the table name and remove any schema prefix
        table_name = match.group(1).split('.')[-1]
        return table_name
    
    return "unknown_table"

def extract_operation(sql: str) -> str:
    """Extract operation type from SQL statement."""
    if not sql:
        return "query"
    
    # Remove comments
    sql_clean = re.sub(r'/\*.*?\*/', '', sql)
    
    # Get the first word which is typically the operation
    match = SQL_OPERATION_PATTERN.search(sql_clean)
    if match:
        return match.group(1).lower()
    
    return "query"

def setup_sql_span_naming(engine: Engine):
    """
    Set up SQLAlchemy event listeners to rename SQL spans at execution time.
    This directly updates the current span using update_name().
    """
    # Listen for before_cursor_execute to capture the SQL statement
    @event.listens_for(engine, "before_cursor_execute")
    def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        # Store the original SQL statement for later use
        conn.info.setdefault('statement', statement)
    
    # Listen for after_cursor_execute to rename the span
    @event.listens_for(engine, "after_cursor_execute")
    def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        # Get the SQL statement we stored earlier
        sql_statement = conn.info.get('statement', '')
        
        # Extract operation and table name
        operation = extract_operation(sql_statement)
        table = extract_table_name(sql_statement)
        
        # Get the current span
        current_span = trace.get_current_span()
        
        # Only process if we have a valid span, table and operation
        if current_span and operation and table:
            # Create a meaningful name
            new_name = f"{operation}_{table}"
            
            try:
                # Rename the span - this works because we're dealing with the live span
                current_span.update_name(new_name)
                
                # Add additional attributes for easier filtering
                current_span.set_attribute("goldfinch.db.table", table)
                current_span.set_attribute("goldfinch.db.operation", operation)
                current_span.set_attribute("goldfinch.db.statement", sql_statement[:200])  # Truncate long statements
                
                # Log success for debugging
                logger.debug(f"Enhanced SQL span to: {new_name}")
            except Exception as e:
                # Don't let errors in span processing affect application
                logger.exception(f"Error updating SQL span name: {e}")

def setup_telemetry(app: FastAPI, engine: Engine = None):
    """
    Initialize OpenTelemetry instrumentation if enabled via configuration.
    
    Args:
        app: The FastAPI application instance
        engine: SQLAlchemy engine (optional for database monitoring)
        
    Returns:
        A tracer instance if instrumentation is enabled, None otherwise
    """
    settings = get_monitoring_settings()
    
    # Skip instrumentation if not explicitly enabled
    if not settings.ENABLE_SIGNOZ or not settings.SIGNOZ_ENDPOINT:
        logger.info("SigNoz monitoring is disabled. Set GOLDFINCH_ENABLE_SIGNOZ=true and GOLDFINCH_SIGNOZ_ENDPOINT to enable.")
        return None
    
    try:
        logger.info(f"Setting up SigNoz monitoring for service: {settings.SIGNOZ_SERVICE_NAME}")
        
        # Create resource with proper service name and environment
        resource = Resource.create({
            "service.name": settings.SIGNOZ_SERVICE_NAME,
            "service.namespace": "goldfinch",
            "deployment.environment": settings.SIGNOZ_ENVIRONMENT
        })
        
        # Create and configure the OpenTelemetry tracer provider with resource
        tracer_provider = TracerProvider(resource=resource)
        
        # Configure the exporter
        otlp_exporter = OTLPSpanExporter(
            endpoint=settings.SIGNOZ_ENDPOINT,
            insecure=settings.SIGNOZ_INSECURE
        )
        
        # Add the standard span processor for exporting
        processor = BatchSpanProcessor(otlp_exporter)
        tracer_provider.add_span_processor(processor)
        
        # Set the global tracer provider
        trace.set_tracer_provider(tracer_provider)
        
        # Instrument FastAPI
        FastAPIInstrumentor.instrument_app(app)
        
        # Add the middleware for API span naming
        app.add_middleware(SpanEnhancerMiddleware)
        
        # Set up database instrumentation if engine is provided
        if engine:
            logger.info("Setting up database monitoring with SQLAlchemy")
            # Instrument SQLAlchemy first
            SQLAlchemyInstrumentor().instrument(
                engine=engine,
                enable_commenter=True,
                commenter_options={
                    "db_framework": True,
                    "db_driver": True,
                    "application": settings.SIGNOZ_SERVICE_NAME
                }
            )
            
            # THEN set up our custom SQL span naming with SQLAlchemy event listeners
            # This must be done AFTER SQLAlchemyInstrumentor is set up
            setup_sql_span_naming(engine)
            
            # Instrument Psycopg2 for lower-level DB monitoring
            Psycopg2Instrumentor().instrument(
                enable_commenter=True,
                commenter_options={
                    "application": settings.SIGNOZ_SERVICE_NAME
                }
            )
            logger.info("Database monitoring setup completed")
        
        logger.info("SigNoz monitoring setup completed successfully")
        logger.info("API spans will use naming format: method_resource (e.g., get_settings)")
        logger.info("SQL spans will use naming format: operation_table (e.g., select_users)")
        
        return trace.get_tracer(settings.SIGNOZ_SERVICE_NAME)
    
    except Exception as e:
        logger.error(f"Failed to set up SigNoz monitoring: {str(e)}")
        # Don't let monitoring setup failures affect the application
        return None 
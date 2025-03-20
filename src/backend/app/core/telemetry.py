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
from datetime import timezone
import socket
from app.core.logging import get_signoz_handler
from app.core.monitoring.settings import get_monitoring_settings

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
                    current_span.set_attribute("goldfinch.timezone", "UTC")
                    
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
                current_span.set_attribute("goldfinch.timezone", "UTC")
                
                # Log success for debugging
                logger.debug(f"Enhanced SQL span to: {new_name}")
            except Exception as e:
                # Don't let errors in span processing affect application
                logger.exception(f"Error updating SQL span name: {e}")

def get_trace_resource():
    """
    Get the resource from the trace provider to ensure consistency between traces and logs.
    
    The service.name attribute MUST be set in the Resource for SigNoz to recognize the service.
    If set as a Tag attribute instead of Resource attribute, SigNoz will show 'unknown_service'.
    """
    try:
        # Get the current trace provider's resource
        provider = trace.get_tracer_provider()
        if hasattr(provider, 'resource'):
            resource = provider.resource
            # Verify service name is set at resource level
            if 'service.name' in resource.attributes:
                return resource
            else:
                logging.warning("Trace provider resource missing service.name, creating new resource")
    except Exception as e:
        logging.error(f"Error getting trace resource: {e}")
    
    # Fallback to creating a new resource if we can't get it from the trace provider
    # or if the service name is missing
    monitoring_settings = get_monitoring_settings()
    hostname = socket.gethostname()
    
    # CRITICAL: Create resource with service.name and standard attributes
    # This ensures service.name is set at the Resource level, not just as a Tag
    resource_attributes = {
        "service.name": monitoring_settings.SIGNOZ_SERVICE_NAME,
        "service.namespace": "goldfinch",
        "service.instance.id": hostname,
        "host.name": hostname,
        "deployment.environment": monitoring_settings.SIGNOZ_ENVIRONMENT
    }
    
    # Create and return the resource with proper service.name
    logging.info(f"Creating new Resource with service.name '{monitoring_settings.SIGNOZ_SERVICE_NAME}'")
    return Resource.create(resource_attributes)

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
        logger.info(f"Setting up SigNoz monitoring with service name '{settings.SIGNOZ_SERVICE_NAME}'")
        
        # Get hostname for consistent labeling
        hostname = socket.gethostname()
        
        # CRITICAL: Create resource with service.name as the first attribute
        # service.name MUST be set at Resource level, not as a Tag
        resource_attributes = {
            "service.name": settings.SIGNOZ_SERVICE_NAME,
            "service.namespace": "goldfinch",
            "service.instance.id": hostname,
            "host.name": hostname,
            "deployment.environment": settings.SIGNOZ_ENVIRONMENT,
            "telemetry.sdk.timezone": "UTC"
        }
        
        # Create the resource, ensuring service.name is set at Resource level
        resource = Resource.create(resource_attributes)
        
        # Verify service.name was properly set in resource
        if resource.attributes.get("service.name") != settings.SIGNOZ_SERVICE_NAME:
            logger.warning(f"Resource creation issue: service.name is '{resource.attributes.get('service.name')}' instead of '{settings.SIGNOZ_SERVICE_NAME}'")
        else:
            logger.info(f"Resource created with service.name '{resource.attributes.get('service.name')}'")
        
        # Create tracer provider with resource
        tracer_provider = TracerProvider(resource=resource)
        
        # Configure the exporter
        otlp_exporter = OTLPSpanExporter(
            endpoint=settings.SIGNOZ_ENDPOINT,
            insecure=settings.SIGNOZ_INSECURE,
        )
        
        # Add the standard span processor for exporting
        processor = BatchSpanProcessor(otlp_exporter)
        tracer_provider.add_span_processor(processor)
        
        # Set the global tracer provider
        trace.set_tracer_provider(tracer_provider)
        
        # Set up logging to SigNoz if enabled
        setup_signoz_logging()
        
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
            
            # Set up our custom SQL span naming with SQLAlchemy event listeners
            setup_sql_span_naming(engine)
            
            # Instrument Psycopg2 for lower-level DB monitoring
            Psycopg2Instrumentor().instrument(
                enable_commenter=True,
                commenter_options={
                    "application": settings.SIGNOZ_SERVICE_NAME
                }
            )
            logger.info("Database monitoring setup completed")
        
        logger.info("SigNoz monitoring setup completed")
        
        return trace.get_tracer(settings.SIGNOZ_SERVICE_NAME)
    
    except Exception as e:
        logger.error(f"Failed to set up SigNoz monitoring: {str(e)}")
        # Don't let monitoring setup failures affect the application
        return None

def setup_signoz_logging():
    """Set up SigNoz logging through the SigNozLogHandler."""
    # Only proceed if signoz handler exists (it was created in logging.py)
    signoz_handler = get_signoz_handler()
    if not signoz_handler:
        return
        
    try:
        # Get the existing resource for trace/logs consistency
        resource = get_trace_resource()
        monitoring_settings = get_monitoring_settings()
        
        # Check service name for critical errors only
        service_name = resource.attributes.get("service.name")
        if not service_name:
            logging.warning("WARNING: No service.name found in resource! Logs may show as 'unknown_service'")
        else:
            logging.info(f"Using service.name '{service_name}' from resource for logs")
        
        # Initialize the SigNoz log handler with the resource
        logging.info(f"Initializing SigNoz logging with resource-level service name")
        success = signoz_handler.setup(resource)
        
        if success:
            # Now that it's initialized, add it to the root logger
            root_logger = logging.getLogger()
            root_logger.addHandler(signoz_handler)
            logging.info("SigNoz log handler added to root logger")
        else:
            logging.warning("Failed to initialize SigNoz log handler - not adding to root logger")
    except Exception as e:
        logging.exception(f"Error setting up SigNoz logging: {e}") 
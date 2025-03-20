import logging
import logging.handlers
from pathlib import Path
import json
from datetime import datetime, timezone
import time
from typing import Dict, Any, Optional
import os
import socket
from app.core.config import settings
from app.core.monitoring.settings import get_monitoring_settings

try:
    # Import OpenTelemetry packages - these will be available if user installed them
    import opentelemetry
    from opentelemetry import trace
    from opentelemetry.sdk.resources import Resource
    from opentelemetry._logs import set_logger_provider
    from opentelemetry.sdk._logs import LoggerProvider, LogRecord
    from opentelemetry.sdk._logs.export import BatchLogRecordProcessor, SimpleLogRecordProcessor
    # Try HTTP exporter instead of gRPC for logs
    try:
        from opentelemetry.exporter.otlp.proto.http._log_exporter import OTLPLogExporter
        USE_HTTP_EXPORTER = True
    except ImportError:
        from opentelemetry.exporter.otlp.proto.grpc._log_exporter import OTLPLogExporter
        USE_HTTP_EXPORTER = False
    from opentelemetry._logs.severity import SeverityNumber
    OPENTELEMETRY_AVAILABLE = True
    HAS_SEVERITY_NUMBER = True
except ImportError:
    # If imports fail, we'll still have logging but without OpenTelemetry
    OPENTELEMETRY_AVAILABLE = False
    HAS_SEVERITY_NUMBER = False
    
    # Define fallback severity numbers if the enum is not available
    class FallbackSeverityNumber:
        FATAL = 17
        ERROR = 13
        WARN = 9
        INFO = 5
        DEBUG = 1
        TRACE = 1
    
    SeverityNumber = FallbackSeverityNumber

class SigNozLogHandler(logging.Handler):
    """
    Custom logging handler that forwards Python logs to SigNoz using OpenTelemetry.
    Implements the standard Python logging.Handler interface and uses the OTel logs SDK.
    """
    def __init__(self, level=logging.INFO, include_trace_context=True):
        super().__init__(level)
        self.include_trace_context = include_trace_context
        self._logger_provider = None
        self._otlp_logger = None
        self._otlp_exporter = None
        self._monitoring_settings = get_monitoring_settings()
        self._hostname = socket.gethostname()

    def setup(self, resource: Resource) -> bool:
        """
        Set up the OpenTelemetry log provider and exporter.
        Must be called after trace provider is initialized.
        
        Args:
            resource: Resource object with service information
            
        Returns:
            bool: True if setup was successful, False otherwise
        """
        if not OPENTELEMETRY_AVAILABLE:
            logging.warning("OpenTelemetry packages not available. SigNoz logging disabled.")
            return False
            
        try:
            monitoring_settings = self._monitoring_settings
            
            # CRITICAL: Check service.name is set in the resource
            # This is essential for SigNoz to recognize the service
            resource_service_name = resource.attributes.get("service.name")
            if not resource_service_name or resource_service_name != monitoring_settings.SIGNOZ_SERVICE_NAME:
                logging.warning(f"Resource service.name mismatch! Expected '{monitoring_settings.SIGNOZ_SERVICE_NAME}' but got '{resource_service_name}'")
                logging.warning("This may cause SigNoz to show logs under 'unknown_service'")
            else:
                logging.info(f"Resource has correct service.name: '{resource_service_name}'")
            
            # Per SigNoz documentation, logs need specific configuration
            base_endpoint = monitoring_settings.SIGNOZ_ENDPOINT.split(":")[0] + ":" + monitoring_settings.SIGNOZ_ENDPOINT.split(":")[1]
            
            if USE_HTTP_EXPORTER:
                # Use HTTP protocol with port 4318 for logs
                # Following SigNoz documentation exactly: https://signoz.io/docs/userguide/logs/#collecting-logs-in-self-hosted-signoz-using-opentelemetry
                http_endpoint = f"{base_endpoint}:4318/v1/logs"
                
                # For HTTP protocol, use proper Content-Type (application/x-protobuf, not application/json)
                self._otlp_exporter = OTLPLogExporter(
                    endpoint=http_endpoint,
                    headers={
                        "Content-Type": "application/x-protobuf"
                    }
                )
                logging.info(f"Created HTTP log exporter with endpoint: {http_endpoint}")
            else:
                # Use gRPC protocol with port 4317
                grpc_endpoint = f"{base_endpoint}:4317"
                self._otlp_exporter = OTLPLogExporter(
                    endpoint=grpc_endpoint,
                    insecure=monitoring_settings.SIGNOZ_INSECURE
                )
                logging.info(f"Created gRPC log exporter with endpoint: {grpc_endpoint}")
            
            # Use the provided resource directly - this is critical since the service.name
            # is properly set here as a Resource attribute and not just a Tag
            self._logger_provider = LoggerProvider(resource=resource)
            
            # Use appropriate processor based on environment
            if monitoring_settings.SIGNOZ_ENVIRONMENT == "production":
                processor = BatchLogRecordProcessor(self._otlp_exporter)
            else:
                processor = SimpleLogRecordProcessor(self._otlp_exporter)
            
            self._logger_provider.add_log_record_processor(processor)
            
            # Set the global logger provider
            set_logger_provider(self._logger_provider)
            
            # CRITICAL FIX: The logger name MUST be the same as service.name for SigNoz to recognize it
            # Instead of "goldfinch.logs", use the actual service name as logger name
            self._otlp_logger = self._logger_provider.get_logger(
                monitoring_settings.SIGNOZ_SERVICE_NAME,  # This is the critical fix
                "1.0.0",
                schema_url="https://opentelemetry.io/schemas/1.9.0"
            )
            
            logging.info(f"SigNoz log handler initialized successfully")
            return True
        except Exception as e:
            logging.error(f"Failed to set up SigNoz log handler: {str(e)}")
            return False
    
    def emit(self, record: logging.LogRecord):
        """
        Forward Python log record to OpenTelemetry.
        This implements the standard logging.Handler interface.
        
        Args:
            record: Standard Python LogRecord to be forwarded
        """
        if not OPENTELEMETRY_AVAILABLE or not self._otlp_logger:
            return
        
        try:
            # Get current time in nanoseconds - explicitly using UTC for consistency with traces
            # This ensures timezone alignment with trace timestamps
            now_utc = datetime.now(timezone.utc)
            now_ns = int(now_utc.timestamp() * 1_000_000_000)
            
            # Extract module path for more granular categorization
            module_path = record.name
            component = "unknown"
            module = "unknown"
            
            # Parse the logger name to extract component and module information
            if module_path and "." in module_path:
                parts = module_path.split(".")
                if len(parts) >= 2 and parts[0] == "app":
                    if len(parts) >= 3:
                        # For app.api.v1.endpoints.xyz -> api/endpoints/xyz
                        if parts[1] == "api" and len(parts) >= 5 and parts[3] == "endpoints":
                            component = "api"
                            module = f"endpoints/{parts[4]}"
                        # For app.crud.xyz -> crud/xyz
                        elif parts[1] == "crud" and len(parts) >= 3:
                            component = "crud"
                            module = parts[2]
                        # For app.models.xyz -> models/xyz
                        elif parts[1] == "models" and len(parts) >= 3:
                            component = "models"
                            module = parts[2]
                        else:
                            component = parts[1]
                            module = ".".join(parts[2:])
                    else:
                        component = parts[1]
            
            # Create log record attributes - IMPORTANT: Do NOT include service.name here
            # service.name should ONLY be set at the Resource level, not as a Tag
            attributes = {
                # Standard OpenTelemetry log attributes
                "log.level": record.levelname,
                "log.logger_name": record.name,
                "log.file.name": record.pathname,
                "log.file.line": record.lineno,
                "log.file.function": record.funcName,
                
                # Component categorization 
                "log.component": component,
                "log.module": module,
                
                # Additional attributes
                "goldfinch.component": component,
                "log.source": "python",
                "host.name": self._hostname,
                "deployment.environment": self._monitoring_settings.SIGNOZ_ENVIRONMENT,
            }
            
            # Format the message with the formatter if available
            message = self.format(record) if self.formatter else record.getMessage()
                        
            # Add exception info if present
            if record.exc_info:
                attributes["log.exception.type"] = record.exc_info[0].__name__
                attributes["log.exception.message"] = str(record.exc_info[1])
                attributes["log.exception.stacktrace"] = self.formatter.formatException(record.exc_info) if self.formatter else str(record.exc_info[2])
                # Add additional flag for easier filtering in UI
                attributes["error"] = True
            
            # Default trace and span ID values
            trace_id = None
            span_id = None
            trace_flags = 1  # Default to sampled
            
            # Add trace context if enabled and available
            if self.include_trace_context:
                try:
                    current_span = trace.get_current_span()
                    if current_span and hasattr(current_span, "get_span_context"):
                        span_context = current_span.get_span_context()
                        if span_context:
                            # Extract trace_id safely
                            if hasattr(span_context, "trace_id"):
                                trace_id_value = getattr(span_context, "trace_id")
                                if trace_id_value and trace_id_value != 0:
                                    trace_id = trace_id_value
                                    attributes["trace_id"] = format(trace_id_value, '032x')
                            
                            # Extract span_id safely
                            if hasattr(span_context, "span_id"):
                                span_id_value = getattr(span_context, "span_id")
                                if span_id_value and span_id_value != 0:
                                    span_id = span_id_value
                                    attributes["span_id"] = format(span_id_value, '016x')
                            
                            # Extract trace flags
                            if hasattr(span_context, "trace_flags"):
                                trace_flags = span_context.trace_flags
                except Exception:
                    # Don't let trace context errors prevent logging
                    pass
            
            # Create the log record with optional trace context
            try:
                # OpenTelemetry requires trace_id and span_id to be integers (0 if not set)
                # None values will cause AttributeError when to_bytes() is called during export
                safe_trace_id = trace_id if trace_id is not None else 0
                safe_span_id = span_id if span_id is not None else 0
                
                # Get severity level
                severity_number = self._map_level_to_severity(record.levelno)
                
                # Use the same timestamp logic that tracing uses - explicitly UTC timestamp in nanoseconds
                # This ensures logs and traces use the same time reference
                otlp_log_record = LogRecord(
                    timestamp=now_ns,
                    observed_timestamp=now_ns,
                    severity_text=record.levelname,
                    severity_number=severity_number,
                    body=message,
                    attributes=attributes,
                    trace_id=safe_trace_id,
                    span_id=safe_span_id,
                    trace_flags=trace_flags
                )
                
                # Emit the log record
                self._otlp_logger.emit(otlp_log_record)
                
            except Exception as e:
                logging.warning(f"Error sending log to SigNoz: {e}")
                
        except Exception as e:
            logging.warning(f"Error processing log for SigNoz: {e}")
    
    def _map_level_to_severity(self, level: int):
        """
        Map Python log levels to OpenTelemetry severity numbers.
        Returns enum value if available, otherwise integer.
        """
        try:
            if level >= logging.CRITICAL:
                return SeverityNumber.FATAL
            elif level >= logging.ERROR:
                return SeverityNumber.ERROR
            elif level >= logging.WARNING:
                return SeverityNumber.WARN
            elif level >= logging.INFO:
                return SeverityNumber.INFO
            elif level >= logging.DEBUG:
                return SeverityNumber.DEBUG
            return SeverityNumber.TRACE
        except Exception:
            # Fallback to raw integers if enum access fails
            if level >= logging.CRITICAL:
                return 17  # FATAL
            elif level >= logging.ERROR:
                return 13  # ERROR
            elif level >= logging.WARNING:
                return 9   # WARN
            elif level >= logging.INFO:
                return 5   # INFO
            return 1       # DEBUG/TRACE


def setup_logging():
    """
    Set up application-wide logging configuration.
    Features:
    - Rotating file handler with size-based rotation
    - Console output for development
    - Configurable log level and format
    - Separate log files for different components
    - SigNoz log export if enabled
    """
    # Create formatter
    formatter = logging.Formatter(settings.LOG_FORMAT)
    
    # Set up root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(settings.LOG_LEVEL)
    
    # Remove any existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # File handler for main application log
    main_log_file = Path(settings.LOG_DIR) / "goldfinch.log"
    file_handler = logging.handlers.RotatingFileHandler(
        main_log_file,
        maxBytes=settings.LOG_FILE_MAX_BYTES,
        backupCount=settings.LOG_FILE_BACKUP_COUNT
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(settings.LOG_LEVEL)
    root_logger.addHandler(file_handler)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(settings.LOG_LEVEL)
    root_logger.addHandler(console_handler)
    
    # Set up component-specific loggers with relevant component tagging
    components = ['api', 'services', 'tasks', 'models', 'crud']
    for component in components:
        logger = logging.getLogger(f"app.{component}")
        
        # Component-specific file handler
        component_log_file = Path(settings.LOG_DIR) / f"{component}.log"
        component_handler = logging.handlers.RotatingFileHandler(
            component_log_file,
            maxBytes=settings.LOG_FILE_MAX_BYTES,
            backupCount=settings.LOG_FILE_BACKUP_COUNT
        )
        component_handler.setFormatter(formatter)
        component_handler.setLevel(settings.LOG_LEVEL)
        logger.addHandler(component_handler)
        
        # Prevent duplicate logging
        logger.propagate = False
    
    # Create the SigNoz handler but don't add it yet - it needs to be initialized
    # after the trace provider in telemetry.py
    if OPENTELEMETRY_AVAILABLE:
        monitoring_settings = get_monitoring_settings()
        if monitoring_settings.ENABLE_SIGNOZ and monitoring_settings.ENABLE_SIGNOZ_LOGS:
            signoz_handler = SigNozLogHandler(level=getattr(logging, monitoring_settings.SIGNOZ_LOG_LEVEL))
            signoz_handler.setFormatter(formatter)
            
            # Store the handler for later setup
            # We'll keep a reference to it in this module
            global _signoz_handler
            _signoz_handler = signoz_handler

# SigNoz handler reference - will be initialized in telemetry.py
_signoz_handler = None

def get_signoz_handler() -> Optional[SigNozLogHandler]:
    """Get the SigNoz log handler if it exists."""
    return _signoz_handler


# Initialize logging when module is imported
setup_logging() 
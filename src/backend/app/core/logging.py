import logging
import logging.handlers
from pathlib import Path
from app.core.config import settings

def setup_logging() -> None:
    """
    Set up application-wide logging configuration.
    Features:
    - Rotating file handler with size-based rotation
    - Console output for development
    - Configurable log level and format
    - Separate log files for different components
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
    
    # Set up component-specific loggers
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
    
    # Set specific loggers to DEBUG level for detailed logging
    debug_loggers = [
        "app.crud.pension_company",
        "app.api.v1.endpoints.pension.company"
    ]
    
    for logger_name in debug_loggers:
        debug_logger = logging.getLogger(logger_name)
        debug_logger.setLevel(logging.DEBUG)
        
        # Add a specific debug file handler
        debug_log_file = Path(settings.LOG_DIR) / f"{logger_name.replace('.', '_')}_debug.log"
        debug_handler = logging.handlers.RotatingFileHandler(
            debug_log_file,
            maxBytes=settings.LOG_FILE_MAX_BYTES,
            backupCount=settings.LOG_FILE_BACKUP_COUNT
        )
        debug_handler.setFormatter(formatter)
        debug_handler.setLevel(logging.DEBUG)
        debug_logger.addHandler(debug_handler)

# Initialize logging when module is imported
setup_logging() 
# SigNoz Logs Integration

This document explains how to use SigNoz for log collection and analysis in the Goldfinch application.

## Overview

Goldfinch integrates with SigNoz to provide:

1. **Centralized Log Collection**: All application logs are collected in one place
2. **Log-Trace Correlation**: Logs are linked to traces for easier debugging  
3. **Log Analysis**: Search, filter, and analyze logs in the SigNoz UI
4. **Log Retention**: Long-term storage and management of logs

## Setup

### Prerequisites

- SigNoz running in Docker (or another accessible server)
- OpenTelemetry packages installed in the Python environment:

```bash
pip install opentelemetry-exporter-otlp-proto-grpc opentelemetry-sdk
```

### Configuration

1. Create or edit a `.env.signoz` file in the `src/backend` directory:

```bash
# Core settings
GOLDFINCH_ENABLE_SIGNOZ=true
GOLDFINCH_SIGNOZ_ENDPOINT=http://localhost:4317
GOLDFINCH_SIGNOZ_SERVICE_NAME=goldfinch-backend
GOLDFINCH_SIGNOZ_ENVIRONMENT=development
GOLDFINCH_SIGNOZ_INSECURE=true

# Log settings
GOLDFINCH_ENABLE_SIGNOZ_LOGS=true
GOLDFINCH_SIGNOZ_LOG_LEVEL=INFO
GOLDFINCH_SIGNOZ_LOG_BATCH_SIZE=10
```

2. Source this file before running the application:

```bash
source .env.signoz
python -m app.main
```

## Testing

A test script is provided to verify the logs integration is working correctly:

```bash
# Make sure the backend is running in another terminal
cd src/backend
source venv/bin/activate
source .env.signoz
python scripts/test_signoz_logs.py
```

This script:
1. Makes API requests to generate traces
2. Generates logs at different severity levels
3. Creates exceptions to test error logging

## Using SigNoz for Log Analysis

Access your SigNoz dashboard (typically http://localhost:3301) and navigate to the Logs section.

### Key Features

1. **Search**: Find logs containing specific text or field values
2. **Filtering**: Filter logs by:
   - Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
   - Service name
   - Component (from logger name)
   - Time range
   
3. **Trace Context**: Click on a log with trace information to view the related trace

### Common Queries

Useful queries for log analysis:

- Find all error logs:
  ```
  log.level:ERROR OR log.level:CRITICAL
  ```

- Find logs related to a specific component:
  ```
  log.logger_name:app.api.v1.endpoints.pension
  ```

- Find logs with exceptions:
  ```
  log.exception.type:*
  ```

## Extending the Integration

### Adding Context to Logs

When logging, add structured context to make logs more searchable:

```python
# Simple message
logger.info("User action completed")

# With context (better)
logger.info(f"User action completed: user_id={user_id} action={action_name}")
```

### Custom Log Attributes

For more complex scenarios, consider using structured logging with a LogRecord factory that adds custom attributes.

## Troubleshooting

If logs are not appearing in SigNoz:

1. Verify the application is running with the correct environment variables
2. Check the application logs for any errors during setup
3. Ensure your SigNoz server is running and accessible
4. Check network connectivity between the application and SigNoz collector 
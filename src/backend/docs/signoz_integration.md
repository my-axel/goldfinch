# SigNoz Integration Documentation

This document outlines how SigNoz monitoring is integrated with the Goldfinch backend application.

## Overview

The application uses OpenTelemetry to instrument various components and send telemetry data to SigNoz for monitoring. The integration includes:

1. **Traces**: Track API requests and database operations
2. **Metrics**: Monitor application performance 
3. **Logs**: Collect application logs with trace correlation

## Configuration

SigNoz monitoring is configured through environment variables, preferably in a `.env.signoz` file:

```
GOLDFINCH_ENABLE_SIGNOZ=true
GOLDFINCH_SIGNOZ_ENDPOINT=http://localhost:4317
GOLDFINCH_SIGNOZ_SERVICE_NAME=goldfinch-backend
GOLDFINCH_SIGNOZ_ENVIRONMENT=development
GOLDFINCH_SIGNOZ_INSECURE=true
GOLDFINCH_ENABLE_SIGNOZ_LOGS=true
GOLDFINCH_SIGNOZ_LOG_LEVEL=INFO
```

## How It Works

### Initialization

The monitoring system is initialized when the application starts:

1. `app.core.telemetry.setup_telemetry()` is called in the application startup
2. This creates a trace provider and sets up instrumentation
3. After trace provider is initialized, log integration is set up

### Logging Integration

The logging system is integrated with OpenTelemetry through a custom handler:

1. `SigNozLogHandler` in `app/core/logging.py` forwards Python logs to SigNoz
2. It preserves trace context when available, connecting logs to traces
3. It formats logs according to OpenTelemetry specifications

## Troubleshooting

If logs are not appearing in SigNoz:

1. Verify that both `GOLDFINCH_ENABLE_SIGNOZ=true` and `GOLDFINCH_ENABLE_SIGNOZ_LOGS=true` are set
2. Check that the SigNoz endpoint is correct and reachable
3. Run the test script: `python test_signoz_logs.py` to test the connection
4. Check application logs for any errors related to SigNoz integration

## Common Issues

### Connection Errors

If logs show connection errors to SigNoz:
- Verify SigNoz is running and accessible
- Check network connectivity between the application and SigNoz
- Verify the endpoint configuration is correct

### Missing Trace Context

If logs appear but don't have trace context:
- Ensure the trace provider is initialized before logging
- Check that the current span is properly set in the context

## Further Resources

- [OpenTelemetry Python Documentation](https://opentelemetry-python.readthedocs.io/en/latest/)
- [SigNoz Documentation](https://signoz.io/docs/)
- [OpenTelemetry Logging Instrumentation](https://github.com/open-telemetry/opentelemetry-python/tree/main/opentelemetry-sdk) 
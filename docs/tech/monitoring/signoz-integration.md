# SigNoz Integration Plan for Goldfinch

This document outlines the implementation plan for integrating SigNoz observability into the Goldfinch application stack.

## Overview

The integration will cover:
- FastAPI backend with all services
- PostgreSQL database operations
- Frontend React/Next.js application
- Background tasks and scheduled updates
- Cross-service communication

## Environment Configuration and Production Safeguards

### Backend Configuration

Create `src/backend/app/core/config/monitoring.py`:
```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class MonitoringSettings(BaseSettings):
    ENABLE_SIGNOZ: bool = False
    SIGNOZ_ENDPOINT: str | None = None
    SIGNOZ_SERVICE_NAME: str = "goldfinch-backend"
    SIGNOZ_ENVIRONMENT: str = "development"
    SIGNOZ_INSECURE: bool = True  # Set to False for HTTPS

    class Config:
        env_prefix = "GOLDFINCH_"

@lru_cache()
def get_monitoring_settings() -> MonitoringSettings:
    return MonitoringSettings()
```

Update `src/backend/app/core/telemetry.py`:
```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor
from opentelemetry.instrumentation.celery import CeleryInstrumentor
from app.core.config.monitoring import get_monitoring_settings

def setup_telemetry(app, engine):
    """Initialize OpenTelemetry instrumentation if enabled"""
    settings = get_monitoring_settings()
    
    if not settings.ENABLE_SIGNOZ or not settings.SIGNOZ_ENDPOINT:
        return None  # Skip instrumentation if not configured
        
    # Update the exporter to point to your remote server
    otlp_exporter = OTLPSpanExporter(
        endpoint=settings.SIGNOZ_ENDPOINT,
        insecure=settings.SIGNOZ_INSECURE
    )
    tracer_provider = TracerProvider()
    processor = BatchSpanProcessor(otlp_exporter)
    tracer_provider.add_span_processor(processor)
    trace.set_tracer_provider(tracer_provider)

    # Instrument FastAPI
    FastAPIInstrumentor.instrument_app(app)

    # Instrument SQLAlchemy
    SQLAlchemyInstrumentor().instrument(
        engine=engine,
        service=settings.SIGNOZ_SERVICE_NAME,
    )

    # Instrument Psycopg2
    Psycopg2Instrumentor().instrument()

    # Instrument HTTP clients
    RequestsInstrumentor().instrument()

    # Instrument Celery
    CeleryInstrumentor().instrument()

    return trace.get_tracer(__name__)
```

Example `.env` configuration:
```env
GOLDFINCH_ENABLE_SIGNOZ=true
GOLDFINCH_SIGNOZ_ENDPOINT=http://your-remote-server:4317
GOLDFINCH_SIGNOZ_SERVICE_NAME=goldfinch-backend
GOLDFINCH_SIGNOZ_ENVIRONMENT=development
GOLDFINCH_SIGNOZ_INSECURE=true
```

### Frontend Configuration

Create `src/frontend/lib/config/monitoring.ts`:
```typescript
export interface MonitoringConfig {
  enabled: boolean;
  endpoint?: string;
  serviceName: string;
  environment: string;
}

export const getMonitoringConfig = (): MonitoringConfig => ({
  enabled: process.env.NEXT_PUBLIC_ENABLE_SIGNOZ === 'true',
  endpoint: process.env.NEXT_PUBLIC_SIGNOZ_ENDPOINT,
  serviceName: process.env.NEXT_PUBLIC_SIGNOZ_SERVICE_NAME || 'goldfinch-frontend',
  environment: process.env.NEXT_PUBLIC_SIGNOZ_ENVIRONMENT || 'development',
});
```

Update `src/frontend/lib/telemetry.ts`:
```typescript
import { getMonitoringConfig } from './config/monitoring';

export function setupTelemetry() {
  const config = getMonitoringConfig();
  
  if (!config.enabled || !config.endpoint) {
    return null; // Skip instrumentation if not configured
  }
  
  // Rest of the setup code...
}
```

Example `.env.local` configuration:
```env
NEXT_PUBLIC_ENABLE_SIGNOZ=true
NEXT_PUBLIC_SIGNOZ_ENDPOINT=http://your-remote-server:4318/v1/traces
NEXT_PUBLIC_SIGNOZ_SERVICE_NAME=goldfinch-frontend
NEXT_PUBLIC_SIGNOZ_ENVIRONMENT=development
```

### Production Considerations

1. **Default Configuration**
   - All monitoring should be disabled by default
   - Production builds should not include SigNoz unless explicitly configured
   - Environment variables must be set at deployment time to enable monitoring

2. **Documentation**
   - Add monitoring configuration to deployment documentation
   - Include warning about data privacy and collection in production
   - Document how to enable/disable monitoring per environment

3. **Security**
   - Never commit monitoring credentials to version control
   - Use secure HTTPS endpoints in production
   - Implement proper authentication if required

4. **Deployment Checklist**
   - [ ] Verify monitoring is disabled by default
   - [ ] Test monitoring configuration before deployment
   - [ ] Document monitoring setup in deployment guide
   - [ ] Review data collection compliance
   - [ ] Set up proper security measures

## 1. Backend Integration

### 1.1 Dependencies

Add to `src/backend/requirements.txt`:
```txt
opentelemetry-api
opentelemetry-sdk
opentelemetry-instrumentation-fastapi
opentelemetry-instrumentation-sqlalchemy
opentelemetry-instrumentation-requests
opentelemetry-instrumentation-psycopg2
opentelemetry-instrumentation-celery
opentelemetry-exporter-otlp
```

### 1.2 Core Setup

Create `src/backend/app/core/telemetry.py`:
```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor
from opentelemetry.instrumentation.celery import CeleryInstrumentor
from app.core.config.monitoring import get_monitoring_settings

def setup_telemetry(app, engine):
    """Initialize OpenTelemetry instrumentation if enabled"""
    settings = get_monitoring_settings()
    
    if not settings.ENABLE_SIGNOZ or not settings.SIGNOZ_ENDPOINT:
        return None  # Skip instrumentation if not configured
        
    # Update the exporter to point to your remote server
    otlp_exporter = OTLPSpanExporter(
        endpoint=settings.SIGNOZ_ENDPOINT,
        insecure=settings.SIGNOZ_INSECURE
    )
    tracer_provider = TracerProvider()
    processor = BatchSpanProcessor(otlp_exporter)
    tracer_provider.add_span_processor(processor)
    trace.set_tracer_provider(tracer_provider)

    # Instrument FastAPI
    FastAPIInstrumentor.instrument_app(app)

    # Instrument SQLAlchemy
    SQLAlchemyInstrumentor().instrument(
        engine=engine,
        service=settings.SIGNOZ_SERVICE_NAME,
    )

    # Instrument Psycopg2
    Psycopg2Instrumentor().instrument()

    # Instrument HTTP clients
    RequestsInstrumentor().instrument()

    # Instrument Celery
    CeleryInstrumentor().instrument()

    return trace.get_tracer(__name__)
```

### 1.3 Custom Instrumentation

Create `src/backend/app/core/metrics.py`:
```python
from opentelemetry import metrics

meter = metrics.get_meter(__name__)

# Pension calculation metrics
pension_calc_duration = meter.create_histogram(
    name="pension_calculation_duration",
    description="Time taken for pension calculations",
    unit="ms",
)

# ETF update metrics
etf_update_counter = meter.create_counter(
    name="etf_updates",
    description="Number of ETF updates performed"
)

# Exchange rate metrics
exchange_rate_update_duration = meter.create_histogram(
    name="exchange_rate_update_duration",
    description="Time taken for exchange rate updates",
    unit="ms",
)
```

### 1.4 Integration Points

#### Main Application
Update `src/backend/app/main.py`:
```python
from app.core.telemetry import setup_telemetry
from app.db.session import engine

# Initialize telemetry after FastAPI app creation
tracer = setup_telemetry(app, engine)
```

#### Pension Calculations
Add to relevant pension service files:
```python
from opentelemetry import trace
from app.core.metrics import pension_calc_duration

tracer = trace.get_tracer(__name__)

@tracer.start_as_current_span("calculate_pension_returns")
def calculate_pension_returns(data):
    with pension_calc_duration.record_duration():
        # Existing calculation logic
```

#### ETF Updates
Add to ETF update service:
```python
from app.core.metrics import etf_update_counter

@tracer.start_as_current_span("update_etf_data")
def update_etf_data():
    etf_update_counter.add(1)
    # Existing update logic
```

## 2. Frontend Integration

### 2.1 Dependencies

Add to `src/frontend/package.json`:
```json
{
  "dependencies": {
    "@opentelemetry/api": "^1.7.0",
    "@opentelemetry/sdk-trace-web": "^1.22.0",
    "@opentelemetry/instrumentation-fetch": "^0.49.1",
    "@opentelemetry/context-zone": "^1.22.0"
  }
}
```

### 2.2 Core Setup

Create `src/frontend/lib/telemetry.ts`:
```typescript
import { trace } from '@opentelemetry/api';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { CollectorTraceExporter } from '@opentelemetry/exporter-collector';

export function setupTelemetry() {
  const provider = new WebTracerProvider({
    resource: {
      'service.name': 'goldfinch-frontend',
    },
  });

  // Add configuration for remote server
  const collectorOptions = {
    url: 'http://your-remote-server:4318/v1/traces', // Replace with your server address
    headers: {}, // Add any required headers
  };

  provider.register({
    contextManager: new ZoneContextManager(),
    // Add collector configuration
    spanProcessor: new BatchSpanProcessor(new CollectorTraceExporter(collectorOptions)),
  });

  registerInstrumentations({
    instrumentations: [
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: [
          /http:\/\/localhost:8000.*/, // Development
          /https:\/\/api\.goldfinch\.com.*/, // Production
        ],
      }),
    ],
  });

  return trace.getTracer('goldfinch-frontend');
}
```

### 2.3 Integration Points

#### API Client
Update `src/frontend/lib/api-client.ts`:
```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('goldfinch-frontend');

class ApiClient {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const span = tracer.startSpan(`GET ${url}`);
    try {
      const response = await this.api.get<T>(url, config);
      span.setStatus({ code: SpanStatusCode.OK });
      return response.data;
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  }
  // Similar updates for post, put, delete methods
}
```

#### Context Providers
Update pension context to include performance monitoring:
```typescript
// src/frontend/context/pension/index.tsx
const fetchPensions = useCallback(async (memberId?: number) => {
  const span = tracer.startSpan('fetchPensions');
  try {
    const allPensions = await fetchPensionsOperation(get)(memberId);
    setPensions(allPensions);
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (err) {
    span.setStatus({ code: SpanStatusCode.ERROR });
    span.recordException(err);
    throw err;
  } finally {
    span.end();
  }
}, [get]);
```

## 3. Key Monitoring Points

### 3.1 Backend
- API endpoint latency
- Database query performance
- Background task execution time
- External API calls (ETF data, exchange rates)
- Error rates and types
- Pension calculation performance

### 3.2 Frontend
- API call latency
- Component render time
- State management operations
- User interaction flows
- Client-side errors

### 3.3 Business Metrics
- Pension calculation throughput
- ETF update success rates
- Exchange rate update performance
- User session analytics

## 4. Implementation Phases

1. **Phase 1: Backend Core**
   - Set up basic FastAPI and database monitoring
   - Implement core metrics collection
   - Test basic trace collection

2. **Phase 2: Backend Business Logic**
   - Add pension calculation monitoring
   - Implement ETF update tracking
   - Add exchange rate monitoring

3. **Phase 3: Frontend Integration**
   - Set up frontend monitoring
   - Implement API call tracking
   - Add user interaction monitoring

4. **Phase 4: Cross-Service Tracing**
   - Implement end-to-end request tracking
   - Set up business transaction monitoring
   - Add custom dashboards

## 5. Next Steps

1. Set up SigNoz locally
2. Implement Phase 1
3. Create test traces and metrics
4. Validate data collection
5. Proceed with remaining phases 

## 6. Step-by-Step Implementation and Testing

Since SigNoz is already set up in a separate Docker container, we'll follow a methodical approach to implement and test each integration point. This ensures we can verify functionality at each step before proceeding.

### 6.1 Backend Core Integration - ✅ COMPLETED

1. **Add Required Dependencies** ✅
   ```bash
   cd src/backend
   source venv/bin/activate  # Activate your virtual environment if using one
   pip install opentelemetry-api opentelemetry-sdk opentelemetry-instrumentation-fastapi opentelemetry-exporter-otlp
   ```

2. **Create Basic Configuration** ✅
   - Create the monitoring settings file
   - Set up a minimal `.env` file with your SigNoz Docker container address:
     ```
     GOLDFINCH_ENABLE_SIGNOZ=true
     GOLDFINCH_SIGNOZ_ENDPOINT=http://your-docker-ip:4317
     GOLDFINCH_SIGNOZ_SERVICE_NAME=goldfinch-backend-test
     ```

3. **Implement Minimal Telemetry** ✅
   - First, implement only the basic FastAPI instrumentation (without other components)
   - Test the configuration loading and connection to SigNoz

4. **Verify Connection** ✅
   - Run the FastAPI application with minimal monitoring
   - Make a few test requests to endpoints
   - Check SigNoz UI for traces appearing
   - Verify service name and environment labels

### 6.2 Database Monitoring - ✅ COMPLETED

1. **Add Database Dependencies** ✅
   ```bash
   pip install opentelemetry-instrumentation-sqlalchemy opentelemetry-instrumentation-psycopg2
   ```

2. **Implement Database Instrumentation** ✅
   - Add SQLAlchemy instrumentation to the telemetry setup ✅
   - Add Psycopg2 instrumentation ✅
   - Modified telemetry.py to accept engine parameter ✅
   - Updated main.py to pass engine to telemetry setup ✅

3. **Test Database Tracing** ✅
   - Created test_db_monitoring.py script ✅
   - Run the script to perform CRUD operations via API endpoints
   - Check SigNoz for SQL query traces
   - Verify query performance metrics

#### Testing Database Monitoring

To test the database monitoring:

1. Restart your FastAPI application to apply the new instrumentation
2. Run the database test script:
   ```bash
   cd src/backend
   python scripts/test_db_monitoring.py
   ```
3. Check SigNoz UI for database-related spans:
   - Look for traces with nested SQL query spans
   - Examine the "db.statement" attribute to see the actual SQL query
   - Check execution time of database operations

#### What You'll See in SigNoz

With database monitoring enabled, you'll now see:
- SQL queries nested under API request spans
- Query execution times
- Database connection details
- The SQL statements being executed
- Database system information

This information is crucial for identifying slow queries, excessive database calls, and optimizing your database interactions.

### 6.3 HTTP Client Monitoring

1. **Add HTTP Client Dependencies**
   ```bash
   pip install opentelemetry-instrumentation-requests
   ```

2. **Implement HTTP Client Instrumentation**
   - Add requests instrumentation to the telemetry setup

3. **Test External API Calls**
   - Trigger functionality that makes external API calls
   - Verify traces showing the complete request chain

### 6.4 Custom Business Metrics

1. **Implement and Test Pension Calculation Metrics**
   - Add instrumentation to pension calculation functions
   - Test by triggering calculations
   - Verify metrics in SigNoz

2. **Implement and Test ETF Update Metrics**
   - Add instrumentation to ETF update functionality
   - Test by triggering updates
   - Verify counter metrics in SigNoz

### 6.5 Frontend Integration

1. **Add Frontend Dependencies**
   ```bash
   cd src/frontend
   npm install @opentelemetry/api @opentelemetry/sdk-trace-web @opentelemetry/instrumentation-fetch @opentelemetry/context-zone
   ```

2. **Implement Basic Frontend Monitoring**
   - Create configuration and telemetry setup
   - Implement in a controlled way that doesn't affect production

3. **Test Frontend-to-Backend Tracing**
   - Make API calls from the frontend
   - Verify traces connect frontend and backend operations
   - Check for proper propagation of context

### Testing Notes

1. **Isolation Testing**
   - Test each component in isolation before combining
   - Verify instrumentation doesn't impact application performance

2. **Troubleshooting**
   - If traces aren't appearing:
     - Verify network connectivity between application and SigNoz
     - Check environment variables are correctly set
     - Ensure SigNoz collector is properly configured
     - Look for errors in application logs

3. **Progressive Enhancement**
   - Start with minimal instrumentation and add complexity gradually
   - Test in development environment before considering any production use

4. **Shutdown Procedure**
   - Implement a graceful shutdown for span processors to ensure all telemetry data is flushed
   - Test application shutdown to verify no data loss 
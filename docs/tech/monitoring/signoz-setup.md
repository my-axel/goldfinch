# SigNoz Setup Guide

This guide covers how to set up and test SigNoz monitoring with the Goldfinch application.

## Prerequisites

- SigNoz running in Docker (or another accessible server)
- Goldfinch backend running locally
- Python virtual environment for Goldfinch

## Step 1: Install Dependencies

```bash
# Activate your virtual environment
cd src/backend
source venv/bin/activate

# Install OpenTelemetry packages
pip install opentelemetry-api opentelemetry-sdk opentelemetry-instrumentation-fastapi opentelemetry-exporter-otlp
```

## Step 2: Configure Environment

Create a `.env` file in the `src/backend` directory with your SigNoz configuration:

```bash
# Copy the example file
cp .env.signoz.example .env.signoz

# Edit the configuration as needed
nano .env.signoz
```

Update the `GOLDFINCH_SIGNOZ_ENDPOINT` value to point to your SigNoz server.

To use this file:

```bash
# For temporary use:
source .env.signoz

# Or combine with your existing .env:
cat .env.signoz >> .env
```

## Step 3: Verify Integration

Run the test script to verify that traces are being sent to SigNoz:

```bash
# Make sure the backend is running
# In another terminal:
cd src/backend
source venv/bin/activate
source .env.signoz  # Load SigNoz config
python scripts/test_signoz.py
```

The script will make requests to the API and log the results. Check your SigNoz dashboard (typically at http://localhost:3301) to see if traces are being received.

## Step 4: Understanding the Dashboard

Once traces are in SigNoz, you can:

1. View the **Services** page to see the `goldfinch-backend` service
2. Explore traces to see API request flow
3. View the performance of individual endpoints
4. Check error rates and slow requests

## Troubleshooting

If you don't see traces in SigNoz:

1. **Check Connectivity**: Ensure your application can reach the SigNoz server
   ```bash
   # For gRPC endpoint
   telnet your-signoz-server 4317
   ```

2. **Verify Environment Variables**:
   ```bash
   echo $GOLDFINCH_ENABLE_SIGNOZ
   echo $GOLDFINCH_SIGNOZ_ENDPOINT
   ```

3. **Check Application Logs**: Look for errors in the application startup logs

4. **Docker Network Issues**: If using Docker, ensure network connectivity between containers:
   ```bash
   # If SigNoz is on Docker network 'signoz-network'
   GOLDFINCH_SIGNOZ_ENDPOINT=http://otel-collector:4317
   ```

## Next Steps

Once basic integration is working, proceed to implement:

1. Database query monitoring
2. HTTP client monitoring
3. Custom business metrics
4. Frontend integration 
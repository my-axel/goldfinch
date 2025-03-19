# Database Performance Dashboard for SigNoz

This guide helps you set up a dashboard in SigNoz to monitor database performance metrics from your Goldfinch application.

## Dashboard Overview

The database performance dashboard will help you monitor:

1. **Query Latency**: How long your database queries take
2. **Query Volume**: How many queries are being executed
3. **Slow Queries**: Identify particularly problematic queries
4. **Query Types**: Distribution of SELECT, INSERT, UPDATE operations
5. **Resource Usage**: Database connection pool metrics

## Setting Up the Dashboard

1. Log into your SigNoz UI (typically at http://your-server:3301)
2. Navigate to Dashboards → New Dashboard
3. Name your dashboard "Goldfinch Database Performance"
4. Add the panels described below

## Suggested Panels

### 1. Database Query Latency

**Panel Type**: Line Chart
**Title**: "Database Query Latency (p95)"
**Query**:
- Metric: `span.duration`
- Filter: `span.attributes.db.system = "postgresql"`
- Aggregation: `p95`
- Group By: `span.name`

### 2. Query Count by Type

**Panel Type**: Stacked Area Chart
**Title**: "Query Count by Type"
**Query**:
- Metric: `calls_total`
- Filter: `span.attributes.db.system = "postgresql"`
- Aggregation: `count`
- Group By: `span.attributes.db.operation`

### 3. Slow Queries Table

**Panel Type**: Table
**Title**: "Top 10 Slowest Queries"
**Query**:
- Metric: `span.duration`
- Filter: `span.attributes.db.system = "postgresql"`
- Aggregation: `max`
- Group By: `span.attributes.db.statement`
- Limit: 10
- Sort: Descending

### 4. API Endpoints with Most DB Queries

**Panel Type**: Bar Chart
**Title**: "API Endpoints with Most DB Queries"
**Query**:
- Metric: `calls_total`
- Filter: `span.kind = "server" AND service.name = "goldfinch-backend"`
- Aggregation: `count`
- Group By: `goldfinch.resource`

### 5. Database Error Rate

**Panel Type**: Line Chart
**Title**: "Database Error Rate"
**Query**:
- Metric: `calls_total`
- Filter: `span.attributes.db.system = "postgresql" AND span.status.code = "ERROR"`
- Aggregation: `rate`

## Dashboard Usage Tips

1. **Timeframe Selection**: Use the time range selector to focus on specific periods:
   - During peak usage hours
   - Following a deployment
   - When investigating performance issues

2. **Performance Investigation**:
   - Check for correlation between slow API endpoints and database queries
   - Look for N+1 query patterns (many similar queries in a single request)
   - Identify queries that might benefit from indexing

3. **Data Filtering**:
   - Filter by `goldfinch.resource` to focus on specific API resources
   - Filter by HTTP method to compare read vs. write operations
   - Filter by environment for production vs. development comparison

## Alerting Recommendations

Consider setting up alerts for:

1. **Slow Queries**: Alert when any query takes longer than 500ms
   ```
   span.duration{span.attributes.db.system="postgresql"} > 500
   ```

2. **Database Error Rate**: Alert when error rate exceeds 1%
   ```
   rate(calls_total{span.attributes.db.system="postgresql" AND span.status.code="ERROR"}[5m]) / rate(calls_total{span.attributes.db.system="postgresql"}[5m]) > 0.01
   ```

3. **Query Volume Spike**: Alert on sudden increases in query volume
   ```
   rate(calls_total{span.attributes.db.system="postgresql"}[5m]) > 2 * rate(calls_total{span.attributes.db.system="postgresql"}[5m] offset 5m)
   ```

## Next Steps

After setting up this dashboard, you can:

1. Create additional dashboards for specific business domains (pensions, ETFs)
2. Set up alerts for critical performance thresholds
3. Document common query patterns in your application
4. Identify candidates for query optimization or indexing 
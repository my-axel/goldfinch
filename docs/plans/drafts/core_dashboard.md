# Core Dashboard Implementation Plan

**Duration**: 4-6 weeks
**Status**: 🟡 Planning Phase

## Implementation Schedule

### 1. Portfolio Overview (Week 1-2)
- [ ] Implement data aggregation from all pension types
- [ ] Create total portfolio value calculator
- [ ] Build month/year-over-year growth calculator
- [ ] Add basic portfolio distribution chart

### 2. Contribution Tracking (Week 2-3)
- [ ] Implement total contributions calculator
- [ ] Create year-to-date contributions tracker
- [ ] Add contribution history visualization
- [ ] Build contribution patterns analyzer

### 3. Returns & Performance (Week 3-4)
- [ ] Implement investment returns calculator
- [ ] Create XIRR calculation system
- [ ] Build performance comparison tools
- [ ] Add historical performance charts

### 4. Quick Actions & Integration (Week 4-6)
- [ ] Implement contribution recording system
- [ ] Create plan value update mechanism
- [ ] Add basic health check functionality
- [ ] Build notification system for updates

## Dependencies
- ETF Pension (✅ Complete)
- Company Pension (✅ Complete)
- Insurance Pension (⚠️ In Progress)
- State Pension (📝 Not Started)

## Technical Considerations
- Data aggregation performance
- Real-time updates vs. cached data
- Currency conversion handling
- Date range flexibility
- Mobile responsiveness

## Testing Requirements
See [Testing Strategy](../../tech/testing/README.md) for detailed testing plan. 
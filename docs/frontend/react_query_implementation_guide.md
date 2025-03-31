# React Query Implementation Guide

A concise guide for implementing complex data features using React Query in Goldfinch.

## 📊 Dashboard Implementation Patterns

### Parallel Data Fetching

```typescript
function Dashboard() {
  const { data: summaries, isLoading: loadingSummaries } = usePensionSummaries();
  const { data: portfolioData, isLoading: loadingPortfolio } = usePortfolioSummary();
  const { data: projections, isLoading: loadingProjections } = useRetirementProjections();
  
  const isLoading = loadingSummaries || loadingPortfolio || loadingProjections;
  
  if (isLoading) return <DashboardSkeleton />;
  
  return (
    <DashboardLayout>
      <SummaryCard data={summaries} />
      <PortfolioBreakdown data={portfolioData} />
      <ProjectionChart data={projections} />
    </DashboardLayout>
  );
}
```

### Data Aggregation & Calculations

```typescript
function usePortfolioTotals() {
  const { data: pensions } = usePensionList();
  
  return useMemo(() => {
    if (!pensions) return { total: 0, byType: {} };
    
    return {
      total: pensions.reduce((sum, p) => sum + p.current_value, 0),
      byType: pensions.reduce((acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + p.current_value;
        return acc;
      }, {})
    };
  }, [pensions]);
}
```

### Real-time Updates

```typescript
function LiveDashboard() {
  const { data } = useQuery({
    queryKey: ['dashboard', 'live'],
    queryFn: () => dashboardService.getLiveData(),
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false
  });
  
  return <LiveDataDisplay data={data} />;
}
```

## 🔍 Interactive Features

### Filtering

```typescript
function FilterablePensionList() {
  const [filters, setFilters] = useState({ type: 'all', minValue: 0 });
  
  const { data, isLoading } = useQuery({
    queryKey: ['pensions', 'filtered', filters],
    queryFn: () => pensionService.getFiltered(filters),
    keepPreviousData: true
  });
  
  return (
    <>
      <FilterControls filters={filters} onChange={setFilters} />
      {isLoading ? <LoadingIndicator /> : <PensionList data={data} />}
    </>
  );
}
```

### Pagination & Infinite Scrolling

```typescript
// Pagination
function PaginatedList() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isPreviousData } = useQuery({
    queryKey: ['pensions', 'paginated', page],
    queryFn: () => pensionService.getPaginated(page, 10),
    keepPreviousData: true
  });
  
  return (
    <>
      <PensionTable data={data?.items || []} />
      <Pagination
        currentPage={page}
        totalPages={data?.totalPages || 1}
        onChange={setPage}
        disableNext={isPreviousData || page >= data?.totalPages}
      />
    </>
  );
}

// Infinite Scrolling
function InfiniteList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['pensions', 'infinite'],
    queryFn: ({ pageParam = 1 }) => pensionService.getPaginated(pageParam, 10),
    getNextPageParam: (lastPage) => lastPage.nextPage || undefined
  });
  
  const allItems = useMemo(() => 
    data?.pages.flatMap(page => page.items) || [], [data]
  );
  
  return (
    <>
      <PensionList data={allItems} />
      {hasNextPage && (
        <LoadMoreButton 
          onClick={() => fetchNextPage()}
          isLoading={isFetchingNextPage}
        />
      )}
    </>
  );
}
```

### Search

```typescript
function SearchablePensionList() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  const { data, isLoading } = useQuery({
    queryKey: ['pensions', 'search', debouncedSearch],
    queryFn: () => pensionService.search(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
    keepPreviousData: true
  });
  
  return (
    <>
      <SearchInput 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} 
      />
      {isLoading ? <SearchingIndicator /> : <SearchResults results={data || []} />}
    </>
  );
}
```

## ⚡ Performance Optimization

### Query Deduplication

```typescript
// Create shared hooks
export function usePension(id) {
  return useQuery({
    queryKey: ['pension', id],
    queryFn: () => pensionService.get(id),
    staleTime: 5 * 60 * 1000
  });
}

// Used in multiple components with automatic deduplication
function PensionDetails({ id }) {
  const { data } = usePension(id);
  return <div>{data?.name}</div>;
}
```

### Prefetching

```typescript
function PensionList() {
  const queryClient = useQueryClient();
  
  const prefetchPension = (id) => {
    queryClient.prefetchQuery({
      queryKey: ['pension', id],
      queryFn: () => pensionService.get(id)
    });
  };
  
  return (
    <ul>
      {pensions.map(pension => (
        <li key={pension.id} onMouseEnter={() => prefetchPension(pension.id)}>
          {pension.name}
        </li>
      ))}
    </ul>
  );
}
```

### Selective Invalidation

```typescript
const mutation = useMutation({
  mutationFn: (data) => pensionService.update(id, data),
  onSuccess: () => {
    // Invalidate only this specific pension
    queryClient.invalidateQueries(['pension', id]);
    
    // Selectively invalidate only relevant lists
    queryClient.invalidateQueries({
      predicate: (query) => 
        query.queryKey[0] === 'pensions' && 
        !query.queryKey.includes('search')
    });
  }
});
```

## 🔄 State Synchronization

### Multiple Data Sources

```typescript
function PensionComparisonView() {
  const [selectedPensionId, setSelectedPensionId] = useState(null);
  
  // Primary data
  const { data: pension } = usePension(selectedPensionId);
  
  // Dependent data
  const { data: benchmarks } = useQuery({
    queryKey: ['pension', selectedPensionId, 'benchmarks'],
    queryFn: () => pensionService.getBenchmarks(selectedPensionId),
    enabled: !!selectedPensionId
  });
  
  const { data: marketData } = useQuery({
    queryKey: ['market', pension?.type],
    queryFn: () => marketService.getMarketData(pension?.type),
    enabled: !!pension
  });
  
  return (
    <ComparisonLayout
      pension={pension}
      benchmarks={benchmarks}
      marketData={marketData}
      onSelectPension={setSelectedPensionId}
    />
  );
}
```

### Optimistic Updates

```typescript
function PensionEditForm({ pensionId }) {
  const queryClient = useQueryClient();
  const { data: pension } = usePension(pensionId);
  
  const updateMutation = useMutation({
    mutationFn: (data) => pensionService.update(pensionId, data),
    
    // Optimistically update the UI
    onMutate: async (newData) => {
      await queryClient.cancelQueries(['pension', pensionId]);
      const previousData = queryClient.getQueryData(['pension', pensionId]);
      queryClient.setQueryData(['pension', pensionId], {...previousData, ...newData});
      return { previousData };
    },
    
    // Handle errors and always refetch
    onError: (err, newData, context) => {
      queryClient.setQueryData(['pension', pensionId], context.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['pension', pensionId]);
    }
  });
  
  return (
    <Form 
      initialData={pension}
      onSubmit={(data) => updateMutation.mutate(data)}
      isSubmitting={updateMutation.isLoading}
    />
  );
}
```

## 📈 Best Practices

### Query Key Structure

```typescript
// Entity list
['pensions']
['pensions', { type: 'etf' }] // Filtered
['pensions', 'search', searchTerm] // Search

// Entity detail
['pension', id]

// Entity relation
['pension', id, 'statements']

// Dashboard data
['dashboard', 'summary']
```

### Error Handling

```typescript
function PensionDetails({ id }) {
  const { data, isLoading, isError, error } = usePension(id);
  
  if (isLoading) return <Skeleton />;
  if (isError) {
    return error.status === 404 
      ? <PensionNotFound id={id} /> 
      : <ErrorDisplay message={error.message} />;
  }
  
  return <PensionView pension={data} />;
}
```

### Preventing Query Waterfalls

```typescript
// Better: Load in parallel and filter client-side
function EfficientComponent() {
  const { data: user } = useUser();
  const { data: allPensions } = usePensions();
  
  // Client-side filtering
  const userPensions = useMemo(() => {
    if (!user || !allPensions) return [];
    return allPensions.filter(p => p.userId === user.id);
  }, [user, allPensions]);
  
  // Only two requests, potentially in parallel
}
```

## 📝 Implementation Checklist

When implementing a complex data feature:

- [ ] Define data sources and relationships
- [ ] Create service functions
- [ ] Implement query and mutation hooks
- [ ] Design loading and error states
- [ ] Add performance optimizations
- [ ] Test with React Query DevTools
- [ ] Add TypeScript types 
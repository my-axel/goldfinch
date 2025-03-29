"use client"

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions
} from '@tanstack/react-query'
import { etfService } from '@/frontend/services/etfService'
import { ETF } from '@/frontend/types/etf'

// Query key factory for ETFs
const etfKeys = {
  all: ['etfs'] as const,
  lists: () => [...etfKeys.all, 'list'] as const,
  list: (filters = {}) => [...etfKeys.lists(), filters] as const,
  search: (query: string) => [...etfKeys.all, 'search', query] as const,
  yfinanceSearch: (query: string) => [...etfKeys.all, 'yfinance', 'search', query] as const,
  details: () => [...etfKeys.all, 'detail'] as const,
  detail: (id: string) => [...etfKeys.details(), id] as const,
  status: (id: string) => [...etfKeys.detail(id), 'status'] as const,
  metrics: (id: string) => [...etfKeys.detail(id), 'metrics'] as const,
}

// Hook to fetch a list of ETFs
export function useETFs() {
  return useQuery({
    queryKey: etfKeys.lists(),
    queryFn: () => etfService.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to search ETFs
export function useETFSearch(query: string) {
  return useQuery({
    queryKey: etfKeys.search(query),
    queryFn: () => etfService.search(query),
    enabled: !!query,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to search ETFs via YFinance
export function useYFinanceSearch(query: string) {
  return useQuery({
    queryKey: etfKeys.yfinanceSearch(query),
    queryFn: () => etfService.searchYFinance(query),
    enabled: !!query && query.length >= 3, // Only enable if query is at least 3 characters
    staleTime: 1 * 60 * 1000, // 1 minute - shorter for external data
  })
}

// Hook to fetch a specific ETF by ID
export function useETF(
  id?: string,
  options?: Omit<UseQueryOptions<ETF, Error, ETF, readonly [string, ...string[]]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: id ? etfKeys.detail(id) : etfKeys.all,
    queryFn: () => id ? etfService.get(id) : Promise.reject('No ETF ID provided'),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  })
}

// Hook to fetch ETF status
export function useETFStatus(id?: string) {
  return useQuery({
    queryKey: id ? etfKeys.status(id) : etfKeys.all,
    queryFn: () => id ? etfService.getStatus(id) : Promise.reject('No ETF ID provided'),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute - shorter for status updates
  })
}

// Hook to fetch ETF metrics
export function useETFMetrics(id?: string) {
  return useQuery({
    queryKey: id ? etfKeys.metrics(id) : etfKeys.all,
    queryFn: () => id ? etfService.getMetrics(id) : Promise.reject('No ETF ID provided'),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Mutation hook to create an ETF
export function useCreateETF() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Omit<ETF, 'id'>) => etfService.create(data),
    onSuccess: (newETF) => {
      // Update the cache for this specific ETF
      queryClient.setQueryData(etfKeys.detail(newETF.id), newETF)
      
      // Invalidate the list query to include the new ETF
      queryClient.invalidateQueries({ queryKey: etfKeys.lists() })
    }
  })
}

// Mutation hook to update an ETF
export function useUpdateETF() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<ETF> }) => 
      etfService.update(id, data),
    onSuccess: (updatedETF) => {
      // Update the cache for this specific ETF
      queryClient.setQueryData(etfKeys.detail(updatedETF.id), updatedETF)
      
      // Invalidate the list query
      queryClient.invalidateQueries({ queryKey: etfKeys.lists() })
    }
  })
}

// Mutation hook to delete an ETF
export function useDeleteETF() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => etfService.delete(id),
    onSuccess: (_, id) => {
      // Remove the deleted ETF from the cache
      queryClient.removeQueries({ queryKey: etfKeys.detail(id) })
      
      // Invalidate the list query
      queryClient.invalidateQueries({ queryKey: etfKeys.lists() })
    }
  })
}

// Mutation hook to update ETF data
export function useUpdateETFData() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, type }: { id: string, type: string }) => 
      etfService.updateData(id, type),
    onSuccess: (_, { id }) => {
      // After updating data, invalidate the ETF detail, status and metrics
      queryClient.invalidateQueries({ queryKey: etfKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: etfKeys.status(id) })
      queryClient.invalidateQueries({ queryKey: etfKeys.metrics(id) })
    }
  })
} 
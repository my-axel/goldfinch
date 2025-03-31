"use client"

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions
} from '@tanstack/react-query'
import { etfPensionService } from '@/frontend/services/etfPensionService'
import { ETFPension, PensionStatusUpdate } from '@/frontend/types/pension'
import { PensionType } from '@/frontend/types/pension'
import { toast } from 'sonner'

// Query key factory for ETF pensions
const etfPensionKeys = {
  all: ['pensions', 'etf'] as const,
  lists: () => [...etfPensionKeys.all, 'list'] as const,
  list: (filters: { memberId?: number } = {}) => 
    [...etfPensionKeys.lists(), filters] as const,
  summaries: () => [...etfPensionKeys.all, 'summaries'] as const,
  summary: (filters: { memberId?: number } = {}) => 
    [...etfPensionKeys.summaries(), filters] as const,
  details: () => [...etfPensionKeys.all, 'detail'] as const,
  detail: (id: number) => [...etfPensionKeys.details(), id] as const,
  statistics: (id: number) => 
    [...etfPensionKeys.detail(id), 'statistics'] as const,
}

// Hook to fetch a list of ETF pensions
export function useEtfPensions(memberId?: number) {
  return useQuery({
    queryKey: etfPensionKeys.list({ memberId }),
    queryFn: () => etfPensionService.list(memberId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to fetch ETF pension summaries for list views
export function useEtfPensionSummaries(memberId?: number) {
  return useQuery({
    queryKey: etfPensionKeys.summary({ memberId }),
    queryFn: () => etfPensionService.getSummaries(memberId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to fetch a specific ETF pension by ID
export function useEtfPension(
  id: number,
  options?: Omit<UseQueryOptions<ETFPension, Error, ETFPension, readonly unknown[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: etfPensionKeys.detail(id),
    queryFn: async () => {
      const pension = await etfPensionService.get(id);
      
      // Validate and normalize the pension type
      if (!pension) {
        throw new Error("Pension not found");
      }
      
      // Handle the case where the type is missing or empty string (which can happen on page refresh)
      // Using String() to ensure we're dealing with strings for comparison
      if (!pension.type || String(pension.type).trim() === "") {
        pension.type = PensionType.ETF_PLAN as typeof pension.type;
      } else if (String(pension.type) !== String(PensionType.ETF_PLAN)) {
        // This pension is not of the expected type
        pension.type = PensionType.ETF_PLAN as typeof pension.type;
      }
      
      return pension;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  })
}

// Hook to fetch statistics for an ETF pension
export function useEtfPensionStatistics(id: number) {
  return useQuery({
    queryKey: etfPensionKeys.statistics(id),
    queryFn: () => etfPensionService.getStatistics(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Mutation hook to create an ETF pension
export function useCreateEtfPension() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Omit<ETFPension, 'id' | 'current_value'>) => 
      etfPensionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: etfPensionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: etfPensionKeys.summaries() })
    }
  })
}

// Mutation hook to update an ETF pension
export function useUpdateEtfPension() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: Omit<ETFPension, 'id' | 'current_value'> }) => 
      etfPensionService.update(id, data),
    onSuccess: (updatedPension) => {
      // Update the cache for this specific pension
      queryClient.setQueryData(etfPensionKeys.detail(updatedPension.id), updatedPension)
      
      // Invalidate the lists that might contain this pension
      queryClient.invalidateQueries({ queryKey: etfPensionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: etfPensionKeys.summaries() })
    }
  })
}

// Mutation hook to delete an ETF pension
export function useDeleteEtfPension() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => etfPensionService.delete(id),
    onSuccess: (_, id) => {
      // Remove the deleted pension from the cache
      queryClient.removeQueries({ queryKey: etfPensionKeys.detail(id) })
      
      // Invalidate the lists that might contain this pension
      queryClient.invalidateQueries({ queryKey: etfPensionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: etfPensionKeys.summaries() })
    }
  })
}

// Mutation hook to update ETF pension status
export function useUpdateEtfPensionStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      pensionId, 
      statusData 
    }: { 
      pensionId: number, 
      statusData: PensionStatusUpdate 
    }) => etfPensionService.updateStatus(pensionId, statusData),
    onSuccess: (updatedPension) => {
      // Update the cache for this specific pension
      queryClient.setQueryData(etfPensionKeys.detail(updatedPension.id), updatedPension)
      
      // Invalidate the lists that might contain this pension
      queryClient.invalidateQueries({ queryKey: etfPensionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: etfPensionKeys.summaries() })
    }
  })
}

// Mutation hook to realize historical contributions
export function useRealizeHistoricalContributions() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (pensionId: number) => 
      etfPensionService.realizeHistoricalContributions(pensionId),
    onSuccess: (updatedPension) => {
      // Update the cache for this specific pension
      queryClient.setQueryData(etfPensionKeys.detail(updatedPension.id), updatedPension)
      
      // Invalidate statistics that need to be refreshed
      queryClient.invalidateQueries({ queryKey: etfPensionKeys.statistics(updatedPension.id) })
      
      // Invalidate the lists that might contain this pension
      queryClient.invalidateQueries({ queryKey: etfPensionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: etfPensionKeys.summaries() })
    }
  })
}

// Mutation hook to add one-time investment
export function useAddOneTimeInvestment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      pensionId, 
      data 
    }: { 
      pensionId: number, 
      data: { 
        amount: number, 
        investment_date: string, 
        note?: string 
      }
    }) => etfPensionService.addOneTimeInvestment(pensionId, data),
    onSuccess: (updatedPension: ETFPension) => {
      // Update the cache for this specific pension
      queryClient.setQueryData(etfPensionKeys.detail(updatedPension.id), updatedPension)
      
      // Invalidate statistics that need to be refreshed
      queryClient.invalidateQueries({ queryKey: etfPensionKeys.statistics(updatedPension.id) })
      
      // Invalidate the lists that might contain this pension
      queryClient.invalidateQueries({ queryKey: etfPensionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: etfPensionKeys.summaries() })
      
      toast.success('Success', { description: 'One-time investment added successfully' })
    },
    onError: (error) => {
      toast.error('Error', { description: 'Failed to add one-time investment' })
      console.error('Failed to add one-time investment:', error)
    }
  })
} 
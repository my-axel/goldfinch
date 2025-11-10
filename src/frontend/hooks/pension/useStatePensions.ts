"use client"

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions
} from '@tanstack/react-query'
import { statePensionService } from '@/frontend/services/statePensionService'
import { StatePension, StatePensionStatement, PensionStatusUpdate } from '@/frontend/types/pension'
import { PensionType } from '@/frontend/types/pension'

// Query key factory for state pensions
const statePensionKeys = {
  all: ['pensions', 'state'] as const,
  lists: () => [...statePensionKeys.all, 'list'] as const,
  list: (filters: { memberId?: number } = {}) => 
    [...statePensionKeys.lists(), filters] as const,
  summaries: () => [...statePensionKeys.all, 'summaries'] as const,
  summary: (filters: { memberId?: number } = {}) => 
    [...statePensionKeys.summaries(), filters] as const,
  details: () => [...statePensionKeys.all, 'detail'] as const,
  detail: (id: number) => [...statePensionKeys.details(), id] as const,
  statements: (pensionId: number) => 
    [...statePensionKeys.detail(pensionId), 'statements'] as const,
  statement: (pensionId: number, statementId: number) => 
    [...statePensionKeys.statements(pensionId), statementId] as const,
  scenarios: (pensionId: number) => 
    [...statePensionKeys.detail(pensionId), 'scenarios'] as const,
}

// Hook to fetch a list of state pensions
export function useStatePensions(memberId?: number) {
  return useQuery({
    queryKey: ['state-pensions', { memberId }],
    queryFn: () => statePensionService.list(memberId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to fetch state pension summaries for list views
export function useStatePensionSummaries(memberId?: number) {
  return useQuery({
    queryKey: ['state-pension-summaries', { memberId }],
    queryFn: () => statePensionService.getSummaries(memberId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to fetch a specific state pension by ID
export function useStatePension(
  id: number,
  options?: Omit<UseQueryOptions<StatePension, Error, StatePension, readonly ['state-pension', number]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['state-pension', id],
    queryFn: async () => {
      const pension = await statePensionService.get(id);
      
      // Validate and normalize the pension type
      if (!pension) {
        throw new Error("Pension not found");
      }
      
      // Handle the case where the type is missing or empty string (which can happen on page refresh)
      // Using String() to ensure we're dealing with strings for comparison
      if (!pension.type || String(pension.type).trim() === "") {
        pension.type = PensionType.STATE as typeof pension.type;
      } else if (String(pension.type) !== String(PensionType.STATE)) {
        // This pension is not of the expected type
        pension.type = PensionType.STATE as typeof pension.type;
      }
      
      return pension;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  })
}

// Hook to fetch statements for a state pension
export function useStatePensionStatements(pensionId: number) {
  return useQuery({
    queryKey: ['state-pension-statements', pensionId],
    queryFn: () => statePensionService.getStatements(pensionId),
    enabled: !!pensionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to fetch scenarios for a state pension
export function useStatePensionScenarios(pensionId: number) {
  return useQuery({
    queryKey: ['state-pension-scenarios', pensionId],
    queryFn: () => statePensionService.getScenarios(pensionId),
    enabled: !!pensionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Mutation hook to create a state pension
export function useCreateStatePension() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Omit<StatePension, 'id'>) =>
      statePensionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['state-pensions'] })
      queryClient.invalidateQueries({ queryKey: ['state-pension-summaries'] })
      // Also invalidate the main pension list to update the overview
      queryClient.invalidateQueries({ queryKey: ['pensions', 'list'] })
    }
  })
}

// Mutation hook to update a state pension
export function useUpdateStatePension() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Omit<StatePension, 'id'>> }) =>
      statePensionService.update(id, data),
    onSuccess: (updatedPension) => {
      // Update the cache for this specific pension
      queryClient.setQueryData(['state-pension', updatedPension.id], updatedPension)

      // Invalidate the lists that might contain this pension
      queryClient.invalidateQueries({ queryKey: ['state-pensions'] })
      queryClient.invalidateQueries({ queryKey: ['state-pension-summaries'] })
      // Also invalidate the main pension list to update the overview
      queryClient.invalidateQueries({ queryKey: ['pensions', 'list'] })
    }
  })
}

// Mutation hook to delete a state pension
export function useDeleteStatePension() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => statePensionService.delete(id),
    onSuccess: (_, id) => {
      // Remove the deleted pension from the cache
      queryClient.removeQueries({ queryKey: ['state-pension', id] })

      // Invalidate the lists that might contain this pension
      queryClient.invalidateQueries({ queryKey: ['state-pensions'] })
      queryClient.invalidateQueries({ queryKey: ['state-pension-summaries'] })
      // Also invalidate the main pension list to update the overview
      queryClient.invalidateQueries({ queryKey: ['pensions', 'list'] })
    }
  })
}

// Mutation hook to create a statement
export function useCreateStatePensionStatement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      pensionId,
      data
    }: {
      pensionId: number,
      data: Omit<StatePensionStatement, 'id' | 'pension_id'>
    }) => statePensionService.createStatement(pensionId, data),
    onSuccess: (_, { pensionId }) => {
      // Invalidate statements for this pension
      queryClient.invalidateQueries({ queryKey: ['state-pension-statements', pensionId] })
      // Invalidate the specific pension to update its latest statement data
      queryClient.invalidateQueries({ queryKey: ['state-pension', pensionId] })
      // Invalidate scenarios as they might have changed
      queryClient.invalidateQueries({ queryKey: ['state-pension-scenarios', pensionId] })
      // Refresh lists that show the latest statement data
      queryClient.invalidateQueries({ queryKey: ['state-pensions'] })
      queryClient.invalidateQueries({ queryKey: ['state-pension-summaries'] })
      // Also invalidate the main pension list to update the overview
      queryClient.invalidateQueries({ queryKey: ['pensions', 'list'] })
    }
  })
}

// Mutation hook to update a statement
export function useUpdateStatePensionStatement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      pensionId,
      statementId,
      data
    }: {
      pensionId: number,
      statementId: number,
      data: Partial<Omit<StatePensionStatement, 'id' | 'pension_id'>>
    }) => statePensionService.updateStatement(pensionId, statementId, data),
    onSuccess: (_, { pensionId }) => {
      // Invalidate statements for this pension
      queryClient.invalidateQueries({ queryKey: ['state-pension-statements', pensionId] })
      // Invalidate the specific pension to update its latest statement data
      queryClient.invalidateQueries({ queryKey: ['state-pension', pensionId] })
      // Invalidate scenarios as they might have changed
      queryClient.invalidateQueries({ queryKey: ['state-pension-scenarios', pensionId] })
      // Refresh lists that show the latest statement data
      queryClient.invalidateQueries({ queryKey: ['state-pensions'] })
      queryClient.invalidateQueries({ queryKey: ['state-pension-summaries'] })
      // Also invalidate the main pension list to update the overview
      queryClient.invalidateQueries({ queryKey: ['pensions', 'list'] })
    }
  })
}

// Mutation hook to delete a statement
export function useDeleteStatePensionStatement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ pensionId, statementId }: { pensionId: number, statementId: number }) =>
      statePensionService.deleteStatement(pensionId, statementId),
    onSuccess: (_, { pensionId }) => {
      // Invalidate statements for this pension
      queryClient.invalidateQueries({ queryKey: ['state-pension-statements', pensionId] })
      // Invalidate the specific pension to update its latest statement data
      queryClient.invalidateQueries({ queryKey: ['state-pension', pensionId] })
      // Invalidate scenarios as they might have changed
      queryClient.invalidateQueries({ queryKey: ['state-pension-scenarios', pensionId] })
      // Refresh lists that show the latest statement data
      queryClient.invalidateQueries({ queryKey: ['state-pensions'] })
      queryClient.invalidateQueries({ queryKey: ['state-pension-summaries'] })
      // Also invalidate the main pension list to update the overview
      queryClient.invalidateQueries({ queryKey: ['pensions', 'list'] })
    }
  })
}

// Mutation hook to update state pension status
export function useUpdateStatePensionStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      pensionId,
      statusData
    }: {
      pensionId: number,
      statusData: PensionStatusUpdate
    }) => statePensionService.updateStatus(pensionId, statusData),
    onSuccess: (updatedPension) => {
      // Update the cache for this specific pension
      queryClient.setQueryData(['state-pension', updatedPension.id], updatedPension)

      // Invalidate the lists that might contain this pension
      queryClient.invalidateQueries({ queryKey: ['state-pensions'] })
      queryClient.invalidateQueries({ queryKey: ['state-pension-summaries'] })
      // Also invalidate the main pension list to update the overview
      queryClient.invalidateQueries({ queryKey: ['pensions', 'list'] })
    }
  })
} 
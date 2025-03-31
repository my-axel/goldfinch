"use client"

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions
} from '@tanstack/react-query'
import { insurancePensionService } from '@/frontend/services/insurancePensionService'
import { InsurancePension, PensionStatusUpdate } from '@/frontend/types/pension'
import { PensionType } from '@/frontend/types/pension'
import { toast } from 'sonner'

// Query key factory for insurance pensions
const insurancePensionKeys = {
  all: ['pensions', 'insurance'] as const,
  lists: () => [...insurancePensionKeys.all, 'list'] as const,
  list: (filters: { memberId?: number } = {}) => 
    [...insurancePensionKeys.lists(), filters] as const,
  summaries: () => [...insurancePensionKeys.all, 'summaries'] as const,
  summary: (filters: { memberId?: number } = {}) => 
    [...insurancePensionKeys.summaries(), filters] as const,
  details: () => [...insurancePensionKeys.all, 'detail'] as const,
  detail: (id: number) => [...insurancePensionKeys.details(), id] as const,
  statements: (pensionId: number) => 
    [...insurancePensionKeys.detail(pensionId), 'statements'] as const,
  latestStatement: (pensionId: number) => 
    [...insurancePensionKeys.statements(pensionId), 'latest'] as const,
  statement: (pensionId: number, statementId: number) => 
    [...insurancePensionKeys.statements(pensionId), statementId] as const,
  statistics: (id: number) => 
    [...insurancePensionKeys.detail(id), 'statistics'] as const,
}

// Hook to fetch a list of insurance pensions
export function useInsurancePensions(memberId?: number) {
  return useQuery({
    queryKey: insurancePensionKeys.list({ memberId }),
    queryFn: () => insurancePensionService.list(memberId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to fetch insurance pension summaries for list views
export function useInsurancePensionSummaries(memberId?: number) {
  return useQuery({
    queryKey: insurancePensionKeys.summary({ memberId }),
    queryFn: () => insurancePensionService.getSummaries(memberId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to fetch a specific insurance pension by ID
export function useInsurancePension(
  id: number,
  options?: Omit<UseQueryOptions<InsurancePension, Error, InsurancePension, readonly unknown[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: insurancePensionKeys.detail(id),
    queryFn: async () => {
      const pension = await insurancePensionService.get(id);
      
      // Validate and normalize the pension type
      if (!pension) {
        throw new Error("Pension not found");
      }
      
      // Handle the case where the type is missing or empty string (which can happen on page refresh)
      // Using String() to ensure we're dealing with strings for comparison
      if (!pension.type || String(pension.type).trim() === "") {
        pension.type = PensionType.INSURANCE as typeof pension.type;
      } else if (String(pension.type) !== String(PensionType.INSURANCE)) {
        // This pension is not of the expected type
        pension.type = PensionType.INSURANCE as typeof pension.type;
      }
      
      return pension;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  })
}

// Hook to fetch statistics for an insurance pension
export function useInsurancePensionStatistics(id: number) {
  return useQuery({
    queryKey: insurancePensionKeys.statistics(id),
    queryFn: () => insurancePensionService.getStatistics(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to fetch statements for an insurance pension
export function useInsurancePensionStatements(pensionId: number) {
  return useQuery({
    queryKey: insurancePensionKeys.statements(pensionId),
    queryFn: () => insurancePensionService.getStatements(pensionId),
    enabled: !!pensionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to fetch the latest statement for an insurance pension
export function useLatestInsurancePensionStatement(pensionId: number) {
  return useQuery({
    queryKey: insurancePensionKeys.latestStatement(pensionId),
    queryFn: () => insurancePensionService.getLatestStatement(pensionId),
    enabled: !!pensionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to fetch a specific statement for an insurance pension
export function useInsurancePensionStatement(pensionId: number, statementId: number) {
  return useQuery({
    queryKey: insurancePensionKeys.statement(pensionId, statementId),
    queryFn: () => insurancePensionService.getStatement(pensionId, statementId),
    enabled: !!pensionId && !!statementId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Mutation hook to create an insurance pension
export function useCreateInsurancePension() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Omit<InsurancePension, 'id' | 'current_value'>) => 
      insurancePensionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.summaries() })
      toast.success('Success', { description: 'Insurance pension created successfully' })
    },
    onError: (error) => {
      toast.error('Error', { description: 'Failed to create insurance pension' })
      console.error('Failed to create insurance pension:', error)
    }
  })
}

// Mutation hook to update an insurance pension
export function useUpdateInsurancePension() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: Omit<InsurancePension, 'id' | 'current_value'> }) => 
      insurancePensionService.update(id, data),
    onSuccess: (updatedPension) => {
      // Update the cache for this specific pension
      queryClient.setQueryData(insurancePensionKeys.detail(updatedPension.id), updatedPension)
      
      // Invalidate the lists that might contain this pension
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.summaries() })
      toast.success('Success', { description: 'Insurance pension updated successfully' })
    },
    onError: (error) => {
      toast.error('Error', { description: 'Failed to update insurance pension' })
      console.error('Failed to update insurance pension:', error)
    }
  })
}

// Mutation hook to delete an insurance pension
export function useDeleteInsurancePension() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => insurancePensionService.delete(id),
    onSuccess: (_, id) => {
      // Remove the deleted pension from the cache
      queryClient.removeQueries({ queryKey: insurancePensionKeys.detail(id) })
      
      // Invalidate the lists that might contain this pension
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.summaries() })
      toast.success('Success', { description: 'Insurance pension deleted successfully' })
    },
    onError: (error) => {
      toast.error('Error', { description: 'Failed to delete insurance pension' })
      console.error('Failed to delete insurance pension:', error)
    }
  })
}

// Mutation hook to update insurance pension status
export function useUpdateInsurancePensionStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      pensionId, 
      statusData 
    }: { 
      pensionId: number, 
      statusData: PensionStatusUpdate 
    }) => insurancePensionService.updateStatus(pensionId, statusData),
    onSuccess: (updatedPension) => {
      // Update the cache for this specific pension
      queryClient.setQueryData(insurancePensionKeys.detail(updatedPension.id), updatedPension)
      
      // Invalidate the lists that might contain this pension
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.summaries() })
      toast.success('Success', { description: 'Pension status updated successfully' })
    },
    onError: (error) => {
      toast.error('Error', { description: 'Failed to update pension status' })
      console.error('Failed to update pension status:', error)
    }
  })
}

// Mutation hook to create a statement
export function useCreateInsurancePensionStatement() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      pensionId, 
      data 
    }: { 
      pensionId: number, 
      data: {
        statement_date: string,
        value: number,
        total_contributions: number,
        total_benefits: number,
        costs_amount: number,
        costs_percentage: number,
        note?: string,
        projections?: Array<{
          scenario_type: 'with_contributions' | 'without_contributions',
          return_rate: number,
          value_at_retirement: number,
          monthly_payout: number
        }>
      }
    }) => insurancePensionService.createStatement(pensionId, data),
    onSuccess: (_, { pensionId }) => {
      // Invalidate statements for this pension
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.statements(pensionId) })
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.latestStatement(pensionId) })
      
      // Invalidate the specific pension to update its latest statement data
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.detail(pensionId) })
      
      // Invalidate statistics as they might have changed
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.statistics(pensionId) })
      
      // Refresh lists that show the latest statement data
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.summaries() })
      
      toast.success('Success', { description: 'Statement created successfully' })
    },
    onError: (error) => {
      toast.error('Error', { description: 'Failed to create statement' })
      console.error('Failed to create statement:', error)
    }
  })
}

// Mutation hook to update a statement
export function useUpdateInsurancePensionStatement() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      pensionId, 
      statementId, 
      data 
    }: { 
      pensionId: number, 
      statementId: number,
      data: {
        statement_date: string,
        value: number,
        total_contributions: number,
        total_benefits: number,
        costs_amount: number,
        costs_percentage: number,
        note?: string,
        projections?: Array<{
          scenario_type: 'with_contributions' | 'without_contributions',
          return_rate: number,
          value_at_retirement: number,
          monthly_payout: number
        }>
      }
    }) => insurancePensionService.updateStatement(pensionId, statementId, data),
    onSuccess: (updatedStatement, { pensionId, statementId }) => {
      // Update the cache for this specific statement
      queryClient.setQueryData(
        insurancePensionKeys.statement(pensionId, statementId), 
        updatedStatement
      )
      
      // Invalidate other statements related queries
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.statements(pensionId) })
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.latestStatement(pensionId) })
      
      // Invalidate the specific pension to update its statement data
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.detail(pensionId) })
      
      // Invalidate statistics as they might have changed
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.statistics(pensionId) })
      
      toast.success('Success', { description: 'Statement updated successfully' })
    },
    onError: (error) => {
      toast.error('Error', { description: 'Failed to update statement' })
      console.error('Failed to update statement:', error)
    }
  })
}

// Mutation hook to delete a statement
export function useDeleteInsurancePensionStatement() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      pensionId, 
      statementId 
    }: { 
      pensionId: number, 
      statementId: number 
    }) => insurancePensionService.deleteStatement(pensionId, statementId),
    onSuccess: (_, { pensionId, statementId }) => {
      // Remove the deleted statement from the cache
      queryClient.removeQueries({ 
        queryKey: insurancePensionKeys.statement(pensionId, statementId) 
      })
      
      // Invalidate other statements related queries
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.statements(pensionId) })
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.latestStatement(pensionId) })
      
      // Invalidate the specific pension to update its statement data
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.detail(pensionId) })
      
      // Invalidate statistics as they might have changed
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.statistics(pensionId) })
      
      toast.success('Success', { description: 'Statement deleted successfully' })
    },
    onError: (error) => {
      toast.error('Error', { description: 'Failed to delete statement' })
      console.error('Failed to delete statement:', error)
    }
  })
}

// Composite mutation hook to create a pension with initial statement
export function useCreateInsurancePensionWithStatement() {
  const queryClient = useQueryClient()
  const createInsurancePension = useCreateInsurancePension()
  const createStatement = useCreateInsurancePensionStatement()
  
  return useMutation({
    mutationFn: async ({ 
      pension, 
      statements 
    }: { 
      pension: Omit<InsurancePension, 'id' | 'current_value'>, 
      statements: Array<{
        statement_date: string,
        value: number,
        total_contributions: number,
        total_benefits: number,
        costs_amount: number,
        costs_percentage: number,
        note?: string,
        projections?: Array<{
          scenario_type: 'with_contributions' | 'without_contributions',
          return_rate: number,
          value_at_retirement: number,
          monthly_payout: number
        }>
      }>
    }) => {
      // First create the pension
      const createdPension = await createInsurancePension.mutateAsync(pension)
      
      // Then create each statement
      if (statements.length > 0) {
        for (const statement of statements) {
          await createStatement.mutateAsync({
            pensionId: createdPension.id,
            data: statement
          })
        }
      }
      
      return createdPension
    },
    onSuccess: (createdPension) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.summaries() })
      queryClient.invalidateQueries({ 
        queryKey: insurancePensionKeys.detail(createdPension.id) 
      })
      queryClient.invalidateQueries({ 
        queryKey: insurancePensionKeys.statements(createdPension.id) 
      })
      
      toast.success('Success', { 
        description: 'Insurance pension created successfully with statements' 
      })
    },
    onError: (error) => {
      toast.error('Error', { 
        description: 'Failed to create insurance pension with statements' 
      })
      console.error('Failed to create insurance pension with statements:', error)
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
    }) => insurancePensionService.addOneTimeInvestment(pensionId, data),
    onSuccess: (updatedPension) => {
      // Update the cache for this specific pension
      queryClient.setQueryData(insurancePensionKeys.detail(updatedPension.id), updatedPension)
      
      // Invalidate statistics that need to be refreshed
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.statistics(updatedPension.id) })
      
      // Invalidate the lists that might contain this pension
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: insurancePensionKeys.summaries() })
      
      toast.success('Success', { description: 'One-time investment added successfully' })
    },
    onError: (error) => {
      toast.error('Error', { description: 'Failed to add one-time investment' })
      console.error('Failed to add one-time investment:', error)
    }
  })
} 
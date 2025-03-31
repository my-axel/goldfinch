"use client"

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions
} from '@tanstack/react-query'
import { companyPensionService } from '@/frontend/services/companyPensionService'
import { CompanyPension, PensionStatusUpdate } from '@/frontend/types/pension'
import { PensionType } from '@/frontend/types/pension'
import { toast } from 'sonner'

// Query key factory for company pensions
const companyPensionKeys = {
  all: ['pensions', 'company'] as const,
  lists: () => [...companyPensionKeys.all, 'list'] as const,
  list: (filters: { memberId?: number } = {}) => 
    [...companyPensionKeys.lists(), filters] as const,
  summaries: () => [...companyPensionKeys.all, 'summaries'] as const,
  summary: (filters: { memberId?: number } = {}) => 
    [...companyPensionKeys.summaries(), filters] as const,
  details: () => [...companyPensionKeys.all, 'detail'] as const,
  detail: (id: number) => [...companyPensionKeys.details(), id] as const,
  statements: (pensionId: number) => 
    [...companyPensionKeys.detail(pensionId), 'statements'] as const,
  latestStatement: (pensionId: number) => 
    [...companyPensionKeys.statements(pensionId), 'latest'] as const,
  statement: (pensionId: number, statementId: number) => 
    [...companyPensionKeys.statements(pensionId), statementId] as const,
  statistics: (id: number) => 
    [...companyPensionKeys.detail(id), 'statistics'] as const,
}

// Hook to fetch a list of company pensions
export function useCompanyPensions(memberId?: number) {
  return useQuery({
    queryKey: companyPensionKeys.list({ memberId }),
    queryFn: () => companyPensionService.list(memberId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to fetch company pension summaries for list views
export function useCompanyPensionSummaries(memberId?: number) {
  return useQuery({
    queryKey: companyPensionKeys.summary({ memberId }),
    queryFn: () => companyPensionService.getSummaries(memberId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to fetch a specific company pension by ID
export function useCompanyPension(
  id: number,
  options?: Omit<UseQueryOptions<CompanyPension, Error, CompanyPension, readonly unknown[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: companyPensionKeys.detail(id),
    queryFn: async () => {
      const pension = await companyPensionService.get(id);
      
      // Validate and normalize the pension type
      if (!pension) {
        throw new Error("Pension not found");
      }
      
      // Handle the case where the type is missing or empty string (which can happen on page refresh)
      // Using String() to ensure we're dealing with strings for comparison
      if (!pension.type || String(pension.type).trim() === "") {
        pension.type = PensionType.COMPANY as typeof pension.type;
      } else if (String(pension.type) !== String(PensionType.COMPANY)) {
        // This pension is not of the expected type
        pension.type = PensionType.COMPANY as typeof pension.type;
      }
      
      return pension;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  })
}

// Hook to fetch statistics for a company pension
export function useCompanyPensionStatistics(id: number) {
  return useQuery({
    queryKey: companyPensionKeys.statistics(id),
    queryFn: () => companyPensionService.getStatistics(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to fetch statements for a company pension
export function useCompanyPensionStatements(pensionId: number) {
  return useQuery({
    queryKey: companyPensionKeys.statements(pensionId),
    queryFn: () => companyPensionService.getStatements(pensionId),
    enabled: !!pensionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to fetch the latest statement for a company pension
export function useLatestCompanyPensionStatement(pensionId: number) {
  return useQuery({
    queryKey: companyPensionKeys.latestStatement(pensionId),
    queryFn: () => companyPensionService.getLatestStatement(pensionId),
    enabled: !!pensionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to fetch a specific statement for a company pension
export function useCompanyPensionStatement(pensionId: number, statementId: number) {
  return useQuery({
    queryKey: companyPensionKeys.statement(pensionId, statementId),
    queryFn: () => companyPensionService.getStatement(pensionId, statementId),
    enabled: !!pensionId && !!statementId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Mutation hook to create a company pension
export function useCreateCompanyPension() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Omit<CompanyPension, 'id' | 'current_value'>) => 
      companyPensionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.summaries() })
      toast.success('Success', { description: 'Company pension created successfully' })
    },
    onError: (error) => {
      toast.error('Error', { description: 'Failed to create company pension' })
      console.error('Failed to create company pension:', error)
    }
  })
}

// Mutation hook to update a company pension
export function useUpdateCompanyPension() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: Omit<CompanyPension, 'id' | 'current_value'> }) => 
      companyPensionService.update(id, data),
    onSuccess: (updatedPension) => {
      // Update the cache for this specific pension
      queryClient.setQueryData(companyPensionKeys.detail(updatedPension.id), updatedPension)
      
      // Invalidate the lists that might contain this pension
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.summaries() })
      toast.success('Success', { description: 'Company pension updated successfully' })
    },
    onError: (error) => {
      toast.error('Error', { description: 'Failed to update company pension' })
      console.error('Failed to update company pension:', error)
    }
  })
}

// Mutation hook to delete a company pension
export function useDeleteCompanyPension() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => companyPensionService.delete(id),
    onSuccess: (_, id) => {
      // Remove the deleted pension from the cache
      queryClient.removeQueries({ queryKey: companyPensionKeys.detail(id) })
      
      // Invalidate the lists that might contain this pension
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.summaries() })
      toast.success('Success', { description: 'Company pension deleted successfully' })
    },
    onError: (error) => {
      toast.error('Error', { description: 'Failed to delete company pension' })
      console.error('Failed to delete company pension:', error)
    }
  })
}

// Mutation hook to update company pension status
export function useUpdateCompanyPensionStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      pensionId, 
      statusData 
    }: { 
      pensionId: number, 
      statusData: PensionStatusUpdate 
    }) => companyPensionService.updateStatus(pensionId, statusData),
    onSuccess: (updatedPension) => {
      // Update the cache for this specific pension
      queryClient.setQueryData(companyPensionKeys.detail(updatedPension.id), updatedPension)
      
      // Invalidate the lists that might contain this pension
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.summaries() })
      toast.success('Success', { description: 'Pension status updated successfully' })
    },
    onError: (error) => {
      toast.error('Error', { description: 'Failed to update pension status' })
      console.error('Failed to update pension status:', error)
    }
  })
}

// Mutation hook to create a statement
export function useCreateCompanyPensionStatement() {
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
        note?: string,
        retirement_projections?: Array<{
          retirement_age: number,
          monthly_payout: number,
          total_capital: number
        }>
      }
    }) => companyPensionService.createStatement(pensionId, data),
    onSuccess: (_, { pensionId }) => {
      // Invalidate statements for this pension
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.statements(pensionId) })
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.latestStatement(pensionId) })
      
      // Invalidate the specific pension to update its latest statement data
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.detail(pensionId) })
      
      // Invalidate statistics as they might have changed
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.statistics(pensionId) })
      
      // Refresh lists that show the latest statement data
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.summaries() })
      
      toast.success('Success', { description: 'Statement created successfully' })
    },
    onError: (error) => {
      toast.error('Error', { description: 'Failed to create statement' })
      console.error('Failed to create statement:', error)
    }
  })
}

// Mutation hook to update a statement
export function useUpdateCompanyPensionStatement() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      pensionId, 
      statementId, 
      data 
    }: { 
      pensionId: number, 
      statementId: number,
      data: Partial<{
        statement_date: string,
        value: number,
        note?: string,
        retirement_projections?: Array<{
          retirement_age: number,
          monthly_payout: number,
          total_capital: number
        }>
      }>
    }) => companyPensionService.updateStatement(pensionId, statementId, data),
    onSuccess: (_, { pensionId }) => {
      // Invalidate statements for this pension
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.statements(pensionId) })
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.latestStatement(pensionId) })
      
      // Invalidate the specific pension to update its latest statement data
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.detail(pensionId) })
      
      // Invalidate statistics as they might have changed
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.statistics(pensionId) })
      
      // Refresh lists that show the latest statement data
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.summaries() })
      
      toast.success('Success', { description: 'Statement updated successfully' })
    },
    onError: (error) => {
      toast.error('Error', { description: 'Failed to update statement' })
      console.error('Failed to update statement:', error)
    }
  })
}

// Mutation hook to delete a statement
export function useDeleteCompanyPensionStatement() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ pensionId, statementId }: { pensionId: number, statementId: number }) => 
      companyPensionService.deleteStatement(pensionId, statementId),
    onSuccess: (_, { pensionId }) => {
      // Invalidate statements for this pension
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.statements(pensionId) })
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.latestStatement(pensionId) })
      
      // Invalidate the specific pension to update its latest statement data
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.detail(pensionId) })
      
      // Invalidate statistics as they might have changed
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.statistics(pensionId) })
      
      // Refresh lists that show the latest statement data
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.summaries() })
      
      toast.success('Success', { description: 'Statement deleted successfully' })
    },
    onError: (error) => {
      toast.error('Error', { description: 'Failed to delete statement' })
      console.error('Failed to delete statement:', error)
    }
  })
}

// Mutation hook to realize historical contributions
export function useRealizeHistoricalContributions() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (pensionId: number) => 
      companyPensionService.realizeHistoricalContributions(pensionId),
    onSuccess: (updatedPension) => {
      // Update the cache for this specific pension
      queryClient.setQueryData(companyPensionKeys.detail(updatedPension.id), updatedPension)
      
      // Invalidate statistics that need to be refreshed
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.statistics(updatedPension.id) })
      
      // Invalidate the lists that might contain this pension
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.summaries() })
      
      toast.success('Success', { description: 'Historical contributions realized successfully' })
    },
    onError: (error) => {
      toast.error('Error', { description: 'Failed to realize historical contributions' })
      console.error('Failed to realize historical contributions:', error)
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
    }) => companyPensionService.addOneTimeInvestment(pensionId, data),
    onSuccess: (updatedPension) => {
      // Update the cache for this specific pension
      queryClient.setQueryData(companyPensionKeys.detail(updatedPension.id), updatedPension)
      
      // Invalidate statistics that need to be refreshed
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.statistics(updatedPension.id) })
      
      // Invalidate the lists that might contain this pension
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.summaries() })
      
      toast.success('Success', { description: 'One-time investment added successfully' })
    },
    onError: (error) => {
      toast.error('Error', { description: 'Failed to add one-time investment' })
      console.error('Failed to add one-time investment:', error)
    }
  })
}

// Mutation hook to create contribution history
export function useCreateContributionHistory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      pensionId, 
      data 
    }: { 
      pensionId: number, 
      data: {
        amount: number,
        contribution_date: string,
        is_manual: boolean,
        note?: string
      }
    }) => companyPensionService.createContributionHistory(pensionId, data),
    onSuccess: (updatedPension) => {
      // Update the cache for this specific pension
      queryClient.setQueryData(companyPensionKeys.detail(updatedPension.id), updatedPension)
      
      // Invalidate statistics that need to be refreshed
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.statistics(updatedPension.id) })
      
      // Invalidate the lists that might contain this pension
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.summaries() })
      
      toast.success('Success', { description: 'Contribution history created successfully' })
    },
    onError: (error) => {
      toast.error('Error', { description: 'Failed to create contribution history' })
      console.error('Failed to create contribution history:', error)
    }
  })
}

// Mutation hook to create a company pension with statements
export function useCreateCompanyPensionWithStatement() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      pension, 
      statements 
    }: { 
      pension: Omit<CompanyPension, 'id' | 'current_value'>, 
      statements: Record<string, unknown>[] 
    }) => companyPensionService.createWithStatement(pension, statements),
    onSuccess: (createdPension) => {
      // Invalidate the lists that might contain this pension
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.summaries() })
      
      // Invalidate statements for this pension
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.statements(createdPension.id) })
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.latestStatement(createdPension.id) })
      
      toast.success('Success', { description: 'Company pension with statements created successfully' })
    },
    onError: (error) => {
      toast.error('Error', { description: 'Failed to create company pension with statements' })
      console.error('Failed to create company pension with statements:', error)
    }
  })
}

// Mutation hook to update a company pension with statements
export function useUpdateCompanyPensionWithStatement() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      id, 
      pension, 
      statements 
    }: { 
      id: number, 
      pension: Omit<CompanyPension, 'id' | 'current_value'>, 
      statements: Record<string, unknown>[] 
    }) => companyPensionService.updateWithStatement(id, pension, statements),
    onSuccess: (updatedPension) => {
      // Update the cache for this specific pension
      queryClient.setQueryData(companyPensionKeys.detail(updatedPension.id), updatedPension)
      
      // Invalidate the lists that might contain this pension
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.summaries() })
      
      // Invalidate statements for this pension
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.statements(updatedPension.id) })
      queryClient.invalidateQueries({ queryKey: companyPensionKeys.latestStatement(updatedPension.id) })
      
      toast.success('Success', { description: 'Company pension with statements updated successfully' })
    },
    onError: (error) => {
      toast.error('Error', { description: 'Failed to update company pension with statements' })
      console.error('Failed to update company pension with statements:', error)
    }
  })
} 
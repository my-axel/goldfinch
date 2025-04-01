import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { savingsPensionService } from '@/frontend/services/savingsPensionService'
import { SavingsPension, SavingsPensionList, SavingsPensionStatement, PensionStatusUpdate } from '@/frontend/types/pension'
import { toast } from 'sonner'

// Query keys
export const savingsPensionsKeys = {
  all: ['savings-pensions'] as const,
  lists: () => [...savingsPensionsKeys.all, 'list'] as const,
  list: (filters: { memberId?: number }) => [...savingsPensionsKeys.lists(), filters] as const,
  details: () => [...savingsPensionsKeys.all, 'detail'] as const,
  detail: (id: number) => [...savingsPensionsKeys.details(), id] as const,
  projections: (id: number) => [...savingsPensionsKeys.detail(id), 'projections'] as const
}

/**
 * Hook for fetching all savings pensions
 */
export const useSavingsPensions = (memberId?: number) => {
  return useQuery<SavingsPensionList[]>({
    queryKey: savingsPensionsKeys.list({ memberId }),
    queryFn: () => savingsPensionService.getAll(memberId)
  })
}

/**
 * Hook for fetching a single savings pension
 */
export const useSavingsPension = (id: number) => {
  return useQuery<SavingsPension>({
    queryKey: savingsPensionsKeys.detail(id),
    queryFn: () => savingsPensionService.get(id),
    enabled: !!id
  })
}

/**
 * Hook for creating a new savings pension
 */
export const useCreateSavingsPension = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Omit<SavingsPension, 'id'>) => savingsPensionService.create(data),
    onSuccess: () => {
      // Invalidate the list query to refetch
      queryClient.invalidateQueries({ queryKey: savingsPensionsKeys.lists() })
    }
  })
}

/**
 * Hook for updating a savings pension
 */
export const useUpdateSavingsPension = (id: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<SavingsPension>) => savingsPensionService.update(id, data),
    onSuccess: (updatedPension) => {
      // Update both list and detail queries
      queryClient.invalidateQueries({ queryKey: savingsPensionsKeys.lists() })
      queryClient.setQueryData(savingsPensionsKeys.detail(id), updatedPension)
    }
  })
}

/**
 * Hook for deleting a savings pension
 */
export const useDeleteSavingsPension = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => savingsPensionService.delete(id),
    onSuccess: (_, deletedId) => {
      // Invalidate the list query and remove the detail query
      queryClient.invalidateQueries({ queryKey: savingsPensionsKeys.lists() })
      queryClient.removeQueries({ queryKey: savingsPensionsKeys.detail(deletedId) })
    }
  })
}

/**
 * Hook for managing savings pension statements
 */
export const useSavingsPensionStatements = () => {
  const queryClient = useQueryClient()

  const addStatement = useMutation({
    mutationFn: ({ pensionId, data }: { 
      pensionId: number, 
      data: Omit<SavingsPensionStatement, 'id' | 'pension_id'>
    }) => savingsPensionService.addStatement(pensionId, data),
    onSuccess: (_, { pensionId }) => {
      // Invalidate the detail query to refetch with new statement
      queryClient.invalidateQueries({ queryKey: savingsPensionsKeys.detail(pensionId) })
    }
  })

  const deleteStatement = useMutation({
    mutationFn: ({ pensionId, statementId }: { pensionId: number, statementId: number }) => 
      savingsPensionService.deleteStatement(pensionId, statementId),
    onSuccess: (_, { pensionId }) => {
      // Invalidate the detail query to refetch without deleted statement
      queryClient.invalidateQueries({ queryKey: savingsPensionsKeys.detail(pensionId) })
    }
  })

  return {
    addStatement,
    deleteStatement
  }
}

/**
 * Hook for fetching savings pension projections
 */
export const useSavingsPensionProjections = (id: number, referenceDate?: string) => {
  return useQuery({
    queryKey: [...savingsPensionsKeys.projections(id), referenceDate],
    queryFn: () => savingsPensionService.getProjections(id, referenceDate),
    enabled: !!id
  })
}

/**
 * Hook for updating savings pension status
 */
export const useUpdateSavingsPensionStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      pensionId, 
      statusData 
    }: { 
      pensionId: number, 
      statusData: PensionStatusUpdate 
    }) => savingsPensionService.updateStatus(pensionId, statusData),
    onSuccess: (updatedPension) => {
      // Update the cache for this specific pension
      queryClient.setQueryData(savingsPensionsKeys.detail(updatedPension.id), updatedPension)
      
      // Invalidate the lists that might contain this pension
      queryClient.invalidateQueries({ queryKey: savingsPensionsKeys.lists() })
      toast.success('Success', { description: 'Pension status updated successfully' })
    },
    onError: (error) => {
      toast.error('Error', { description: 'Failed to update pension status' })
      console.error('Failed to update pension status:', error)
    }
  })
} 
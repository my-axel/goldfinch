"use client"

import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query'
import { pensionService } from '@/frontend/services/pensionService'
import { PensionType, PensionStatusUpdate } from '@/frontend/types/pension'
import { toast } from 'sonner'

// Query key factory for combined pensions
const pensionListKeys = {
  all: ['pensions'] as const,
  lists: () => [...pensionListKeys.all, 'list'] as const,
  list: (filters: { memberId?: number } = {}) => 
    [...pensionListKeys.lists(), filters] as const,
}

/**
 * Hook to fetch all pensions across all pension types
 * This is a direct replacement for the fetchListPensions context function
 */
export function usePensionList(memberId?: number) {
  return useQuery({
    queryKey: pensionListKeys.list({ memberId }),
    queryFn: () => pensionService.getAllPensions(memberId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to delete a pension of any type
 * This is a direct replacement for the deletePension context function
 */
export function useDeletePension() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, pensionType }: { id: number, pensionType: PensionType }) => 
      pensionService.deletePension(id, pensionType),
    onSuccess: (_, { id, pensionType }) => {
      // Invalidate the pension list
      queryClient.invalidateQueries({ queryKey: pensionListKeys.lists() })
      
      // Also invalidate the specific pension type lists
      // This ensures all related queries are updated
      queryClient.invalidateQueries({ queryKey: ['pensions', pensionType.toLowerCase()] })
      
      // Also invalidate details queries for this pension
      queryClient.removeQueries({ 
        queryKey: ['pensions', pensionType.toLowerCase(), 'detail', id] 
      })
      
      toast.success('Success', {
        description: 'Pension deleted successfully'
      })
    },
    onError: (error) => {
      toast.error('Error', {
        description: 'Failed to delete pension'
      })
      console.error('Failed to delete pension:', error)
    }
  })
}

/**
 * Hook to update the status of a pension of any type
 */
export function useUpdatePensionStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      id, 
      pensionType,
      statusData 
    }: { 
      id: number, 
      pensionType: PensionType,
      statusData: PensionStatusUpdate 
    }) => pensionService.updatePensionStatus(id, pensionType, statusData),
    onSuccess: (_, { id, pensionType }) => {
      // Invalidate the pension list
      queryClient.invalidateQueries({ queryKey: pensionListKeys.lists() })
      
      // Also invalidate the specific pension type queries
      queryClient.invalidateQueries({ 
        queryKey: ['pensions', pensionType.toLowerCase()] 
      })
      
      // Also invalidate detail queries for this pension
      queryClient.invalidateQueries({ 
        queryKey: ['pensions', pensionType.toLowerCase(), 'detail', id] 
      })
      
      toast.success('Success', {
        description: 'Pension status updated successfully'
      })
    },
    onError: (error) => {
      toast.error('Error', {
        description: 'Failed to update pension status'
      })
      console.error('Failed to update pension status:', error)
    }
  })
} 
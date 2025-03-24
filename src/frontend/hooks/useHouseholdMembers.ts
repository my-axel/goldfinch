"use client"

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions
} from '@tanstack/react-query'
import { householdService } from '@/frontend/services/householdService'
import { HouseholdMember, HouseholdMemberFormData } from '@/frontend/types/household'
import { calculateMemberFields } from '@/frontend/types/household-helpers'

// Query key factory for household
const householdKeys = {
  all: ['household'] as const,
  lists: () => [...householdKeys.all, 'list'] as const,
  list: (filters = {}) => [...householdKeys.lists(), filters] as const,
  details: () => [...householdKeys.all, 'detail'] as const,
  detail: (id: number) => [...householdKeys.details(), id] as const,
}

// Mutation key factory for household
const householdMutationKeys = {
  create: ['household', 'create'] as const,
  update: ['household', 'update'] as const,
  delete: ['household', 'delete'] as const,
}

// Define the query key type
type HouseholdDetailQueryKey = ReturnType<typeof householdKeys.detail>

// Hook to fetch a list of household members
export function useHouseholdMembers() {
  return useQuery({
    queryKey: householdKeys.lists(),
    queryFn: () => householdService.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to fetch a specific household member by ID
export function useHouseholdMember(
  id: number,
  options?: Omit<UseQueryOptions<HouseholdMember, Error, HouseholdMember, HouseholdDetailQueryKey>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: householdKeys.detail(id),
    queryFn: () => householdService.get(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  })
}

// Mutation hook to create a household member
export function useCreateHouseholdMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationKey: householdMutationKeys.create,
    mutationFn: (data: HouseholdMemberFormData) => householdService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: householdKeys.lists() })
    }
  })
}

// Mutation hook to update a household member
export function useUpdateHouseholdMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationKey: householdMutationKeys.update,
    mutationFn: (params: { id: number, data: Partial<HouseholdMemberFormData> }) => 
      householdService.update(params.id, params.data),
    onSuccess: (updatedMember) => {
      // Update the cache for this specific member
      queryClient.setQueryData(householdKeys.detail(updatedMember.id), updatedMember)
      
      // Invalidate the lists that might contain this member
      queryClient.invalidateQueries({ queryKey: householdKeys.lists() })
    }
  })
}

// Mutation hook to delete a household member
export function useDeleteHouseholdMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationKey: householdMutationKeys.delete,
    mutationFn: (id: number) => householdService.delete(id),
    onSuccess: (_, id) => {
      // Remove the deleted member from the cache
      queryClient.removeQueries({ queryKey: householdKeys.detail(id) })
      
      // Invalidate the lists
      queryClient.invalidateQueries({ queryKey: householdKeys.lists() })
    }
  })
}

// Utility function to get a member with computed fields
export function getMemberWithComputedFields(member: HouseholdMember) {
  return calculateMemberFields(member)
} 
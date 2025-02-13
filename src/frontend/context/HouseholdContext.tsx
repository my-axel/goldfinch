"use client"

import { createContext, useContext, useState, useCallback } from 'react'
import { HouseholdMember } from '@/frontend/types/household'
import { useApi } from '@/frontend/hooks/useApi'
import { calculateMemberFields } from '@/frontend/types/household-helpers'

interface HouseholdContextType {
  members: HouseholdMember[]
  isLoading: boolean
  error: string | null
  fetchMembers: () => Promise<void>
  addMember: (member: Omit<HouseholdMember, 'id'>) => Promise<HouseholdMember>
  updateMember: (id: string, member: Partial<HouseholdMember>) => Promise<HouseholdMember>
  deleteMember: (id: string) => Promise<void>
  getMemberWithComputedFields: (member: HouseholdMember) => ReturnType<typeof calculateMemberFields>
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined)

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const { isLoading, error, apiCall } = useApi()

  const fetchMembers = useCallback(async () => {
    const data = await apiCall<HouseholdMember[]>('/household')
    setMembers(data)
  }, [apiCall])

  const addMember = useCallback(async (member: Omit<HouseholdMember, 'id'>) => {
    const newMember = await apiCall<HouseholdMember>('/household', 'POST', member)
    setMembers(prev => [...prev, newMember])
    return newMember
  }, [apiCall])

  const updateMember = useCallback(async (id: string, member: Partial<HouseholdMember>) => {
    const updatedMember = await apiCall<HouseholdMember>(`/household/${id}`, 'PUT', member)
    setMembers(prev => prev.map(m => m.id === id ? updatedMember : m))
    return updatedMember
  }, [apiCall])

  const deleteMember = useCallback(async (id: string) => {
    await apiCall(`/household/${id}`, 'DELETE')
    setMembers(prev => prev.filter(m => m.id !== id))
  }, [apiCall])

  const getMemberWithComputedFields = useCallback((member: HouseholdMember) => {
    return calculateMemberFields(member)
  }, [])

  return (
    <HouseholdContext.Provider 
      value={{ 
        members, 
        isLoading, 
        error, 
        fetchMembers, 
        addMember, 
        updateMember, 
        deleteMember,
        getMemberWithComputedFields
      }}
    >
      {children}
    </HouseholdContext.Provider>
  )
}

export function useHousehold() {
  const context = useContext(HouseholdContext)
  if (!context) {
    throw new Error('useHousehold must be used within HouseholdProvider')
  }
  return context
} 
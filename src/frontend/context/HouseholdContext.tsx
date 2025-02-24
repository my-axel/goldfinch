"use client"

import { createContext, useContext, useState, useCallback } from 'react'
import { HouseholdMember, HouseholdMemberFormData } from '@/frontend/types/household'
import { useApi } from '@/frontend/hooks/useApi'
import { calculateMemberFields } from '@/frontend/types/household-helpers'
import { getHouseholdApiRoute, getHouseholdMemberApiRoute } from '@/frontend/lib/routes/api/household'

interface HouseholdContextType {
  members: HouseholdMember[]
  isLoading: boolean
  error: string | null
  fetchMembers: () => Promise<void>
  addMember: (member: HouseholdMemberFormData) => Promise<HouseholdMember>
  updateMember: (id: number, member: Partial<HouseholdMemberFormData>) => Promise<HouseholdMember>
  deleteMember: (id: number) => Promise<void>
  getMemberWithComputedFields: (member: HouseholdMember) => ReturnType<typeof calculateMemberFields>
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined)

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const { isLoading, error, apiCall } = useApi()

  const fetchMembers = useCallback(async () => {
    const data = await apiCall<HouseholdMember[]>(getHouseholdApiRoute())
    setMembers(data)
  }, [apiCall])

  const addMember = useCallback(async (member: HouseholdMemberFormData) => {
    const newMember = await apiCall<HouseholdMember>(getHouseholdApiRoute(), 'POST', member)
    setMembers(prev => [...prev, newMember])
    return newMember
  }, [apiCall])

  const updateMember = useCallback(async (id: number, member: Partial<HouseholdMemberFormData>) => {
    const updatedMember = await apiCall<HouseholdMember>(getHouseholdMemberApiRoute(id), 'PUT', member)
    setMembers(prev => prev.map(m => m.id === id ? updatedMember : m))
    return updatedMember
  }, [apiCall])

  const deleteMember = useCallback(async (id: number) => {
    await apiCall(getHouseholdMemberApiRoute(id), 'DELETE')
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
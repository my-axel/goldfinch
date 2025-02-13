"use client"

import { useEffect, useState } from "react"
import { MemberList } from "@/components/household/MemberList"
import { AddMemberDialog } from "@/components/household/AddMemberDialog"
import { EditMemberDialog } from "@/components/household/EditMemberDialog"
import { HouseholdMember } from "@/types/household"
import { useHousehold } from "@/context/HouseholdContext"

/**
 * Main Household page component
 * 
 * Responsibilities:
 * - Manages household members state
 * - Coordinates between child components
 * - Handles member operations (add/edit/delete)
 * - Layout for member list and add member button
 * 
 * Components used:
 * - AddMemberDialog
 * - EditMemberDialog
 * - MemberList
 */

export default function HouseholdPage() {
  const { 
    members, 
    fetchMembers, 
    addMember, 
    updateMember,
    deleteMember,
    isLoading: contextLoading,
  } = useHousehold()
  
  const [editingMember, setEditingMember] = useState<HouseholdMember | null>(null)

  useEffect(() => {
    fetchMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAddMember = async (newMember: Omit<HouseholdMember, "id">) => {
    try {
      await addMember(newMember)
    } catch (error) {
      console.error('Failed to add member:', error)
      // TODO: Add error toast notification
    }
  }

  const handleDeleteMember = async (id: string) => {
    try {
      await deleteMember(id)
    } catch (error) {
      console.error('Failed to delete member:', error)
      // TODO: Add error toast notification
    }
  }

  const handleEditMember = async (id: string, updatedMember: Omit<HouseholdMember, "id">) => {
    try {
      await updateMember(id, updatedMember)
      setEditingMember(null)
    } catch (error) {
      console.error('Failed to update member:', error)
      // TODO: Add error toast notification
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Household Members</h1>
        <AddMemberDialog onAdd={handleAddMember} />
      </div>
      <MemberList 
        members={members} 
        onDelete={handleDeleteMember}
        onEdit={setEditingMember}
        isLoading={contextLoading}
      />
      {editingMember && (
        <EditMemberDialog
          member={editingMember}
          open={!!editingMember}
          onOpenChange={(open) => !open && setEditingMember(null)}
          onEdit={handleEditMember}
        />
      )}
    </div>
  )
} 
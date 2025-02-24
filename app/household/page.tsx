"use client"

import { useEffect, useState } from "react"
import { MemberList } from "@/frontend/components/household/MemberList"
import { AddMemberDialog } from "@/frontend/components/household/AddMemberDialog"
import { EditMemberDialog } from "@/frontend/components/household/EditMemberDialog"
import { HouseholdMember, HouseholdMemberFormData } from "@/frontend/types/household"
import { useHousehold } from "@/frontend/context/HouseholdContext"

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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  useEffect(() => {
    fetchMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAddMember = async (newMember: HouseholdMemberFormData) => {
    try {
      await addMember(newMember)
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Failed to add member:', error)
      // TODO: Add error toast notification
    }
  }

  const handleDeleteMember = async (id: number) => {
    try {
      await deleteMember(id)
    } catch (error) {
      console.error('Failed to delete member:', error)
      // TODO: Add error toast notification
    }
  }

  const handleUpdateMember = async (updatedMember: HouseholdMemberFormData) => {
    if (!editingMember) return
    
    try {
      await updateMember(editingMember.id, updatedMember)
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
        <AddMemberDialog 
          onAdd={handleAddMember}
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
        />
      </div>
      <MemberList 
        members={members} 
        onDelete={handleDeleteMember}
        onEdit={setEditingMember}
        onAdd={() => setIsAddDialogOpen(true)}
        isLoading={contextLoading}
      />
      {editingMember && (
        <EditMemberDialog
          member={editingMember}
          open={!!editingMember}
          onOpenChange={(open) => !open && setEditingMember(null)}
          onEdit={(id, updatedMember) => handleUpdateMember(updatedMember)}
        />
      )}
    </div>
  )
} 
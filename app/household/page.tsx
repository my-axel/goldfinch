"use client"

import { MemberList } from "@/frontend/components/household/MemberList"
import { AddMemberDialog } from "@/frontend/components/household/AddMemberDialog"
import { EditMemberDialog } from "@/frontend/components/household/EditMemberDialog"
import { HouseholdMember, HouseholdMemberFormData } from "@/frontend/types/household"
import { 
  useHouseholdMembers, 
  useCreateHouseholdMember, 
  useUpdateHouseholdMember, 
  useDeleteHouseholdMember 
} from "@/frontend/hooks/useHouseholdMembers"
import { toast } from "sonner"
import { useState } from "react"
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
  // Replace context with React Query hooks
  const { data: members = [], isLoading } = useHouseholdMembers()
  const createMutation = useCreateHouseholdMember()
  const updateMutation = useUpdateHouseholdMember()
  const deleteMutation = useDeleteHouseholdMember()
  
  const [editingMember, setEditingMember] = useState<HouseholdMember | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const handleAddMember = async (newMember: HouseholdMemberFormData) => {
    try {
      await createMutation.mutateAsync(newMember)
      setIsAddDialogOpen(false)
      toast.success('Household member added successfully')
    } catch (error) {
      console.error('Failed to add member:', error)
      toast.error('Failed to add household member')
    }
  }

  const handleDeleteMember = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Household member deleted successfully')
    } catch (error) {
      console.error('Failed to delete member:', error)
      toast.error('Failed to delete household member')
    }
  }

  const handleUpdateMember = async (updatedMember: HouseholdMemberFormData) => {
    if (!editingMember) return
    
    try {
      await updateMutation.mutateAsync({ 
        id: editingMember.id, 
        data: updatedMember 
      })
      setEditingMember(null)
      toast.success('Household member updated successfully')
    } catch (error) {
      console.error('Failed to update member:', error)
      toast.error('Failed to update household member')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Household</h1>
          <p className="text-muted-foreground mt-2">
            Manage your household members and their retirement planning preferences
          </p>
        </div>
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
        isLoading={isLoading}
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
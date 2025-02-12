"use client"

import { useState } from "react"
import { MemberList } from "@/components/household/MemberList"
import { AddMemberDialog } from "@/components/household/AddMemberDialog"
import { EditMemberDialog } from "@/components/household/EditMemberDialog"
import { mockHouseholdMembers } from "@/data/mockEtfs"
import { HouseholdMember } from "@/types/household"

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
  // TODO: Replace useState with React Query or similar for data fetching
  // Example: const { data: members, isLoading } = useQuery('members', membersApi.getAll)
  const [members, setMembers] = useState<HouseholdMember[]>(mockHouseholdMembers)
  const [editingMember, setEditingMember] = useState<HouseholdMember | null>(null)

  // TODO: Add loading state handling
  // const [isLoading, setIsLoading] = useState(false)

  // TODO: Add error state handling
  // const [error, setError] = useState<string | null>(null)

  // TODO: Replace with API call to create member
  // Example: await membersApi.create(newMember)
  const handleAddMember = (newMember: Omit<HouseholdMember, "id">) => {
    const memberWithId: HouseholdMember = {
      ...newMember,
      id: crypto.randomUUID(),
    }
    setMembers([...members, memberWithId])
  }

  // TODO: Replace with API call to delete member
  // Example: await membersApi.delete(id)
  const handleDeleteMember = (id: string) => {
    setMembers(members.filter(member => member.id !== id))
  }

  // TODO: Replace with API call to update member
  // Example: await membersApi.update(id, updatedMember)
  const handleEditMember = (id: string, updatedMember: Omit<HouseholdMember, "id">) => {
    setMembers(members.map(member => 
      member.id === id 
        ? { ...updatedMember, id } 
        : member
    ))
  }

  // TODO: Add useEffect to fetch initial data
  // useEffect(() => {
  //   const fetchMembers = async () => {
  //     setIsLoading(true);
  //     try {
  //       const response = await membersApi.getAll();
  //       setMembers(response.data);
  //     } catch (error) {
  //       setError('Failed to fetch members');
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  //   fetchMembers();
  // }, []);

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
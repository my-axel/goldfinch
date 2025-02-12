"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HouseholdMember } from "@/types/household"
import { calculateMemberFields, formatMemberName } from "@/types/household-helpers"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Trash2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react"

interface MemberListProps {
  members: HouseholdMember[]
  onDelete: (id: string) => void
  onEdit: (member: HouseholdMember) => void
}

/**
 * Component for displaying the list of household members
 * 
 * Features:
 * - Grid layout of member cards
 * - Each card shows member details and computed fields
 * - Edit and delete buttons for each member
 * - Delete confirmation dialog
 * - Handles member actions (edit/delete)
 */ 
export function MemberList({ members, onDelete, onEdit }: MemberListProps) {
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null)

  // TODO: Add loading state handling
  // if (isLoading) return <LoadingSpinner />
  
  // TODO: Add error state handling
  // if (error) return <ErrorMessage message={error} />

  // TODO: Add empty state handling
  // if (members.length === 0) return <EmptyState />
  
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => {
          const computed = calculateMemberFields(member)
          return (
            <Card key={member.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>{formatMemberName(member)}</CardTitle>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(member)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMemberToDelete(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Birthday</dt>
                    <dd>{format(member.birthday, 'dd. MMMM yyyy', { locale: de })}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Age</dt>
                    <dd>{computed.age} years</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Planned Retirement</dt>
                    <dd>In {computed.years_to_retirement_planned} years (age {member.retirement_age_planned})</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Possible Retirement</dt>
                    <dd>In {computed.years_to_retirement_possible} years (age {member.retirement_age_possible})</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <AlertDialog open={!!memberToDelete} onOpenChange={() => setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Household Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this household member? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (memberToDelete) {
                  onDelete(memberToDelete)
                  setMemberToDelete(null)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
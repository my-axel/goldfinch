"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import { HouseholdMember } from "@/frontend/types/household"
import { calculateMemberFields, formatMemberName } from "@/frontend/types/household-helpers"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Trash2, Pencil, PlusCircle } from "lucide-react"
import { Button } from "@/frontend/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/frontend/components/ui/alert-dialog"
import { useState } from "react"

interface MemberListProps {
  members: HouseholdMember[]
  onDelete: (id: number) => void
  onEdit: (member: HouseholdMember) => void
  onAdd: () => void
  isLoading?: boolean
}

/**
 * Card component for adding a new household member
 */
function AddMemberCard({ onClick }: { onClick: () => void }) {
  return (
    <Card className="flex flex-col items-center justify-center w-[270px] h-[230px] border-dashed cursor-pointer hover:border-primary/50 transition-colors" onClick={onClick}>
      <CardContent className="flex flex-col items-center justify-center py-6 w-full">
        <PlusCircle className="h-6 w-6 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Add New Member</p>
      </CardContent>
    </Card>
  )
}

export function MemberList({ members = [], onDelete, onEdit, onAdd, isLoading = false }: MemberListProps) {
  const [memberToDelete, setMemberToDelete] = useState<number | null>(null)

  if (isLoading) {
    return <div className="text-center p-4">Loading household members...</div>
  }

  if (!members || members.length === 0) {
    return (
      <div className="flex flex-wrap gap-4">
        <AddMemberCard onClick={onAdd} />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-wrap gap-4">
        {members.map((member) => {
          const computed = calculateMemberFields(member)
          return (
            <Card key={member.id} className="w-[270px]">
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
                    <dd>{format(new Date(member.birthday), 'dd. MMMM yyyy', { locale: de })}</dd>
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
        <AddMemberCard onClick={onAdd} />
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
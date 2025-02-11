"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HouseholdMember } from "@/types/household"
import { format } from "date-fns"

interface MemberFormProps {
  member?: HouseholdMember
  onSubmit: (data: Omit<HouseholdMember, "id">) => void
  onCancel: () => void
}

/**
 * Shared form component for adding and editing household members
 * 
 * A reusable form that handles:
 * - Input fields for all member properties
 * - Form state management
 * - Data validation
 * - Submit and cancel actions
 * 
 * Used by both AddMemberDialog and EditMemberDialog to maintain
 * consistency and reduce code duplication
 */

export function MemberForm({ member, onSubmit, onCancel }: MemberFormProps) {
  const [formData, setFormData] = useState({
    first_name: member?.first_name ?? "",
    last_name: member?.last_name ?? "",
    birthday: member ? format(member.birthday, 'yyyy-MM-dd') : "",
    retirement_age_planned: member?.retirement_age_planned.toString() ?? "",
    retirement_age_possible: member?.retirement_age_possible.toString() ?? "",
  })

  // Update form when member changes (for edit mode)
  useEffect(() => {
    if (member) {
      setFormData({
        first_name: member.first_name,
        last_name: member.last_name,
        birthday: format(member.birthday, 'yyyy-MM-dd'),
        retirement_age_planned: member.retirement_age_planned.toString(),
        retirement_age_possible: member.retirement_age_possible.toString(),
      })
    }
  }, [member])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      first_name: formData.first_name,
      last_name: formData.last_name,
      birthday: new Date(formData.birthday),
      retirement_age_planned: parseInt(formData.retirement_age_planned),
      retirement_age_possible: parseInt(formData.retirement_age_possible),
    })
  }

  // TODO: Add form validation matching backend requirements
  // const validationSchema = z.object({ ... })

  // TODO: Add error handling for failed API calls
  // const [apiError, setApiError] = useState<string | null>(null)

  // TODO: Add loading state for submit action
  // const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="birthday">Birthday</Label>
        <Input
          id="birthday"
          type="date"
          value={formData.birthday}
          onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="retirement_age_planned">Planned Retirement Age</Label>
          <Input
            id="retirement_age_planned"
            type="number"
            min="40"
            max="100"
            value={formData.retirement_age_planned}
            onChange={(e) => setFormData({ ...formData, retirement_age_planned: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="retirement_age_possible">Possible Retirement Age</Label>
          <Input
            id="retirement_age_possible"
            type="number"
            min="40"
            max="100"
            value={formData.retirement_age_possible}
            onChange={(e) => setFormData({ ...formData, retirement_age_possible: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{member ? 'Save Changes' : 'Add Member'}</Button>
      </div>
    </form>
  )
} 
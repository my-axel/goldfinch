"use client"

import { useEffect } from "react"
import { Button } from "@/frontend/components/ui/button"
import { Input } from "@/frontend/components/ui/input"
import { HouseholdMember, HouseholdMemberFormData } from "@/frontend/types/household"
import { DateInput } from "@/frontend/components/ui/date-input"
import { Form, FormField, FormItem, FormControl, FormLabel } from "@/frontend/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toDateObject } from "@/frontend/lib/dateUtils"

interface MemberFormProps {
  member?: HouseholdMember
  onSubmit: (data: HouseholdMemberFormData) => void
  onCancel: () => void
}

// Form validation schema
const formSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  birthday: z.date({
    required_error: "Birthday is required",
    invalid_type_error: "Birthday must be a valid date"
  }),
  retirement_age_planned: z.coerce.number()
    .min(40, "Planned retirement age must be at least 40")
    .max(100, "Planned retirement age cannot exceed 100"),
  retirement_age_possible: z.coerce.number()
    .min(40, "Possible retirement age must be at least 40")
    .max(100, "Possible retirement age cannot exceed 100")
})

type FormValues = z.infer<typeof formSchema>

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
  // Initialize the form with default values or existing member data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: member?.first_name ?? "",
      last_name: member?.last_name ?? "",
      birthday: member?.birthday ? toDateObject(member.birthday) ?? new Date() : new Date(),
      retirement_age_planned: member?.retirement_age_planned ?? 65,
      retirement_age_possible: member?.retirement_age_possible ?? 60
    }
  })

  // Update form when member changes
  useEffect(() => {
    if (member) {
      const birthdayDate = toDateObject(member.birthday)
      
      form.reset({
        first_name: member.first_name,
        last_name: member.last_name,
        birthday: birthdayDate ?? new Date(),
        retirement_age_planned: member.retirement_age_planned,
        retirement_age_possible: member.retirement_age_possible
      })
    }
  }, [member, form])

  // Handle form submission
  const handleSubmit = (values: FormValues) => {
    onSubmit({
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      birthday: values.birthday,
      retirement_age_planned: values.retirement_age_planned,
      retirement_age_possible: values.retirement_age_possible
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="birthday"
          render={({ field }) => (
            <DateInput
              field={field}
              label="Birthday"
            />
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="retirement_age_planned"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Planned Retirement Age</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="40"
                    max="100"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="retirement_age_possible"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Possible Retirement Age</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="40"
                    max="100"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{member ? 'Save Changes' : 'Add Member'}</Button>
        </div>
      </form>
    </Form>
  )
} 
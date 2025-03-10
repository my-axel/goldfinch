"use client"

import { FormField, FormItem, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { UseFormReturn, useFieldArray } from "react-hook-form"
import { ETFPensionFormData } from "@/frontend/types/pension-form"
import { Button } from "@/frontend/components/ui/button"
import { Trash2, Plus } from "lucide-react"
import { ContributionFrequency } from "@/frontend/types/pension"
import { EnumSelect } from "@/frontend/components/ui/enum-select"
import { CurrencyInput } from "@/frontend/components/shared/inputs/CurrencyInput"
import { DateInput } from "@/frontend/components/ui/date-input"
import { DateEndPicker } from "@/frontend/components/ui/date-end-picker"

interface ContributionPlanCardProps {
  form: UseFormReturn<ETFPensionFormData>
  memberId?: string | number
}

/**
 * ContributionPlanCard component for ETF pension forms.
 * Handles contribution plan steps.
 * 
 * @component
 * @param {ContributionPlanCardProps} props - Component props
 * @param {UseFormReturn<ETFPensionFormData>} props.form - Form instance from react-hook-form
 * @param {string|number} [props.memberId] - Optional member ID for retirement date calculation
 */
export function ContributionPlanCard({ form, memberId }: ContributionPlanCardProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contribution_plan_steps"
  })

  const handleAddContribution = () => {
    let startDate = new Date()

    // If there are existing contributions, check the last one's end date
    if (fields.length > 0) {
      const lastEndDate = form.getValues(`contribution_plan_steps.${fields.length - 1}.end_date`)
      
      if (lastEndDate) {
        // Use the day after the last end date as the start date
        startDate = new Date(lastEndDate)
        startDate.setDate(startDate.getDate() + 1)
      }
    }

    append({
      amount: 0,
      frequency: ContributionFrequency.MONTHLY,
      start_date: startDate,
      end_date: undefined
    })
  }

  return (
    <div className="relative">
      {fields.length > 0 && (
        <div className="grid grid-cols-[1fr_1.4fr_1fr_1fr_auto] gap-2 mb-2 px-2">
          <div className="text-sm font-medium text-muted-foreground">Amount</div>
          <div className="text-sm font-medium text-muted-foreground">Frequency</div>
          <div className="text-sm font-medium text-muted-foreground">Start Date</div>
          <div className="text-sm font-medium text-muted-foreground">End Date</div>
          <div className="w-9"></div>
        </div>
      )}

      <div className="space-y-2">
        {fields.map((field, index) => (
          <div 
            key={field.id} 
            className="grid grid-cols-[1fr_1.4fr_1fr_1fr_auto] gap-2 items-center p-2 rounded-lg bg-muted"
          >
            <FormField
              control={form.control}
              name={`contribution_plan_steps.${index}.amount`}
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <FormControl>
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="0.00"
                      min={0}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <EnumSelect<ContributionFrequency, ETFPensionFormData>
              name={`contribution_plan_steps.${index}.frequency`}
              control={form.control}
              label=""
              options={[
                { value: ContributionFrequency.MONTHLY, label: "Monthly" },
                { value: ContributionFrequency.QUARTERLY, label: "Quarterly" },
                { value: ContributionFrequency.SEMI_ANNUALLY, label: "Semi-Annually" },
                { value: ContributionFrequency.ANNUALLY, label: "Annually" },
                { value: ContributionFrequency.ONE_TIME, label: "One-Time" }
              ]}
              defaultValue={ContributionFrequency.MONTHLY}
            />

            <FormField
              control={form.control}
              name={`contribution_plan_steps.${index}.start_date`}
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <FormControl>
                    <DateInput field={field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`contribution_plan_steps.${index}.end_date`}
              render={({ field }) => (
                <DateEndPicker
                  field={field}
                  startDate={form.getValues(`contribution_plan_steps.${index}.start_date`)}
                  memberId={memberId}
                  className="space-y-0"
                />
              )}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              className="h-9 w-9"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed text-center py-6 text-sm text-muted-foreground border-2 rounded-lg"
          onClick={handleAddContribution}
        >
          <Plus className="h-4 w-4 mr-2" />
          {fields.length === 0 ? (
            <span>No contributions planned yet. Click to add your first contribution.</span>
          ) : (
            <span>Add Contribution</span>
          )}
        </Button>
      </div>
    </div>
  )
} 
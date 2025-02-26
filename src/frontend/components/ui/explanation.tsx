import * as React from "react"
import { cn } from "@/frontend/lib/utils"
import { Alert, AlertDescription } from "@/frontend/components/ui/alert"
import { Info } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface ExplanationProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface ExplanationHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface ExplanationContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface ExplanationAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface ExplanationListProps extends React.HTMLAttributes<HTMLUListElement> {
  children: React.ReactNode
}

interface ExplanationListItemProps extends React.HTMLAttributes<HTMLLIElement> {
  children: React.ReactNode
}

interface ExplanationStatsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  columns?: 1 | 2
}

interface ExplanationStatProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  label: string
  value: string | number
  subValue?: string | number
  subLabel?: string
  valueClassName?: string
  subValueClassName?: string
}

function Explanation({ className, ...props }: ExplanationProps) {
  return (
    <div
      className={cn("space-y-4 pl-4", className)}
      {...props}
    />
  )
}

function ExplanationHeader({ className, ...props }: ExplanationHeaderProps) {
  return (
    <div
      className={cn("", className)}
      {...props}
    >
      <h4 className="text-muted-foreground font-medium mb-2">{props.children}</h4>
    </div>
  )
}

function ExplanationContent({ className, ...props }: ExplanationContentProps) {
  return (
    <div
      className={cn("space-y-2 text-sm text-muted-foreground opacity-80", className)}
      {...props}
    />
  )
}

function ExplanationAlert({ className, children, ...props }: ExplanationAlertProps) {
  return (
    <Alert className={cn("bg-muted", className)} {...props}>
      <Info className="h-4 w-4 text-muted-foreground" />
      <AlertDescription className="text-muted-foreground opacity-90">
        {children}
      </AlertDescription>
    </Alert>
  )
}

function ExplanationList({ className, ...props }: ExplanationListProps) {
  return (
    <ul
      className={cn("space-y-2 text-sm text-muted-foreground opacity-80 list-disc pl-4", className)}
      {...props}
    />
  )
}

function ExplanationListItem({ className, ...props }: ExplanationListItemProps) {
  return (
    <li
      className={cn("text-muted-foreground opacity-80", className)}
      {...props}
    />
  )
}

function ExplanationStats({ className, columns = 1, ...props }: ExplanationStatsProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 2 ? "grid-cols-2" : "grid-cols-1",
        className
      )}
      {...props}
    />
  )
}

function ExplanationStat({
  icon: Icon,
  label,
  value,
  subValue,
  subLabel,
  valueClassName,
  subValueClassName,
  className,
  ...props
}: ExplanationStatProps) {
  return (
    <div className={cn("flex items-start gap-3", className)} {...props}>
      {Icon && (
        <div className="p-1.5 bg-primary/10 rounded-full mt-0.5">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="space-y-0.5">
          <div className="flex items-baseline gap-1.5">
            <p className={cn(
              "text-lg font-bold leading-none opacity-80",
              valueClassName
            )}>
              {value}
            </p>
          </div>
          {(subValue || subLabel) && (
            <div className="flex items-baseline gap-1.5">
              {subValue && (
                <p className={cn(
                  "text-sm font-medium leading-none opacity-80",
                  subValueClassName
                )}>
                  {subValue}
                </p>
              )}
              {subLabel && (
                <span className="text-xs text-muted-foreground">{subLabel}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export {
  Explanation,
  ExplanationHeader,
  ExplanationContent,
  ExplanationAlert,
  ExplanationList,
  ExplanationListItem,
  ExplanationStats,
  ExplanationStat
} 
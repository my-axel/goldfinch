import * as React from "react"
import { cn } from "@/frontend/lib/utils"
import { Alert, AlertDescription } from "@/frontend/components/ui/alert"
import { Info } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/frontend/components/ui/tooltip"

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
  columns?: 1 | 2 | 3
  style?: React.CSSProperties
}

interface ExplanationStatProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  label: string
  value?: string | number
  subValue?: string | number
  subLabel?: string
  valueClassName?: string
  subValueClassName?: string
  tooltip?: string
}

function Explanation({ className, ...props }: ExplanationProps) {
  return (
    <div
      className={cn("space-y-2 pl-4", className)}
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
      <h4 className="text-muted-foreground font-medium">{props.children}</h4>
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

function ExplanationStats({ className, columns = 1, style, ...props }: ExplanationStatsProps & { style?: React.CSSProperties }) {
  // The following comment is used by Tailwind to include these classes in the final CSS: 
  // grid-cols-1 grid-cols-2 grid-cols-3
  const colsClass = columns === 1 ? "grid-cols-1" : columns === 2 ? "grid-cols-2" : "grid-cols-3";
  const gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
  return (
    <div
      className={cn(
        "w-full grid gap-2",
        colsClass,
        className
      )}
      style={{ gridTemplateColumns, ...style }}
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
  tooltip,
  className,
  ...props
}: ExplanationStatProps) {
  return (
    <div className={cn("flex items-start gap-3", className)} {...props}>
      {Icon && (
        <div className="p-1 bg-primary/10 rounded-full mt-0.5">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="space-y-0.5">
          <div className="flex items-baseline gap-1.5">
            <p className={cn(
              "text-base font-bold leading-none opacity-80",
              valueClassName
            )}>
              {value}
            </p>
          </div>
          {(subValue || subLabel) && (
            <div className="flex items-baseline gap-1.5">
              {subValue && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className={cn(
                        "text-xs font-medium leading-none opacity-80 cursor-default",
                        subValueClassName
                      )}>
                        {subValue}
                      </p>
                    </TooltipTrigger>
                    {tooltip && (
                      <TooltipContent>
                        <p className="text-sm">{tooltip}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
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
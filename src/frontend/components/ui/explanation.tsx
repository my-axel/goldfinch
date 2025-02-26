import * as React from "react"
import { cn } from "@/frontend/lib/utils"
import { Alert, AlertDescription } from "@/frontend/components/ui/alert"
import { Info } from "lucide-react"

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

export {
  Explanation,
  ExplanationHeader,
  ExplanationContent,
  ExplanationAlert,
  ExplanationList,
  ExplanationListItem
} 
"use client"

import { ReactElement, ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import { Skeleton } from "@/frontend/components/ui/skeleton"

export interface ChartWrapperProps {
  /** The title of the chart */
  title: string
  /** The content of the chart */
  children: ReactElement
  /** Whether the chart is loading */
  isLoading: boolean
  /** The height of the chart in pixels */
  height: number
  /** Additional CSS classes */
  className?: string
  /** Whether to wrap the chart in a Card component */
  withCard?: boolean
  /** Optional content to render on the right side of the header */
  headerRight?: ReactNode
}

export function ChartWrapper({
  title,
  children,
  isLoading,
  height,
  className,
  withCard = true,
  headerRight
}: ChartWrapperProps) {
  const content = isLoading ? (
    <Skeleton className="w-full" style={{ height }} />
  ) : children

  if (!withCard) {
    return content
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          {title}
        </CardTitle>
        {headerRight}
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
} 
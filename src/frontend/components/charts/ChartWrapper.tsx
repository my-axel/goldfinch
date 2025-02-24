"use client"

import { ReactElement } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import { Skeleton } from "@/frontend/components/ui/skeleton"
import { ResponsiveContainer } from "recharts"

interface ChartWrapperProps {
  title?: string
  children: ReactElement
  height?: number
  isLoading?: boolean
  className?: string
  withCard?: boolean
}

export function ChartWrapper({
  title,
  children,
  height = 300,
  isLoading = false,
  className,
  withCard = true
}: ChartWrapperProps) {
  const chartContent = (
    <div className={withCard ? undefined : className}>
      {title && withCard && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      {isLoading ? (
        <Skeleton className="w-full" style={{ height }} />
      ) : (
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )

  if (!withCard) {
    return chartContent
  }

  return (
    <Card className={className}>
      <CardContent>
        {chartContent}
      </CardContent>
    </Card>
  )
} 
"use client"

import { Component, ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import { Button } from "@/frontend/components/ui/button"
import { AlertCircle, RefreshCcw } from "lucide-react"

interface Props {
  children: ReactNode
  title?: string
  height?: number
  className?: string
  withCard?: boolean
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Error boundary component specifically designed for chart components.
 * Catches rendering errors in charts and displays a user-friendly error message
 * with a retry option.
 * 
 * @example
 * ```tsx
 * <ChartErrorBoundary>
 *   <ContributionHistoryChart data={data} />
 * </ChartErrorBoundary>
 * ```
 */
export class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    // Log the error to your error reporting service
    console.error('Chart Error:', error)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    const { children, title, height = 300, className, withCard = true } = this.props

    if (this.state.hasError) {
      const errorContent = (
        <div 
          className="flex flex-col items-center justify-center space-y-4 p-4"
          style={{ height: `${height}px` }}
        >
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div className="text-center">
            <p className="text-sm font-medium">Failed to load chart</p>
            <p className="text-sm text-muted-foreground mt-1">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleRetry}
            className="mt-4"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )

      if (!withCard) {
        return errorContent
      }

      return (
        <Card className={className}>
          {title && (
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
          )}
          <CardContent>
            {errorContent}
          </CardContent>
        </Card>
      )
    }

    return children
  }
} 
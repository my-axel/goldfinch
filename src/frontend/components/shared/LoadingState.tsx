'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/frontend/lib/utils'

interface LoadingStateProps {
  message?: string
  className?: string
}

export function LoadingState({ message = 'Loading...', className }: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col items-center justify-center min-h-[200px] space-y-4", className)}>
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
} 
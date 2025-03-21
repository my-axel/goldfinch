"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create a new QueryClient instance for each user/session to prevent shared state
  const [queryClient] = useState(() => 
    new QueryClient({
      defaultOptions: {
        queries: {
          // Default options to use for all queries
          staleTime: 5 * 60 * 1000, // 5 minutes
          retry: 1,                 // Retry failed queries once
          refetchOnWindowFocus: false, // Disable refetching when window regains focus
        },
      },
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show DevTools in development */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  )
} 
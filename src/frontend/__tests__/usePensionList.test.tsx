import { renderHook, waitFor, cleanup } from '@testing-library/react'
import { usePensionList, useDeletePension } from '@/frontend/hooks/pension/usePensionList'
import { pensionService } from '@/frontend/services/pensionService'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PensionType } from '@/frontend/types/pension'
import React from 'react'

// Mock the pensionService
jest.mock('@/frontend/services/pensionService', () => ({
  pensionService: {
    getAllPensions: jest.fn(),
    deletePension: jest.fn(),
    updatePensionStatus: jest.fn(),
  }
}))

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  }
}))

// Create a wrapper with QueryClient for each test
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      }
    }
  })
  
  const QueryClientProviderWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  
  QueryClientProviderWrapper.displayName = 'QueryClientProviderWrapper'
  
  return QueryClientProviderWrapper
}

describe('usePensionList', () => {
  // Clean up after each test
  afterEach(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('fetches pension list correctly', async () => {
    const mockPensions = [
      { id: 1, name: 'ETF Pension', type: PensionType.ETF_PLAN },
      { id: 2, name: 'Company Pension', type: PensionType.COMPANY },
    ]
    
    // Mock the service response
    ;(pensionService.getAllPensions as jest.Mock).mockResolvedValueOnce(mockPensions)

    // Render the hook with a new wrapper
    const { result } = renderHook(() => usePensionList(), {
      wrapper: createWrapper()
    })

    // Initially should be loading
    expect(result.current.isLoading).toBe(true)

    // Wait for the query to complete
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Should have the data
    expect(result.current.data).toEqual(mockPensions)
    // Service should have been called
    expect(pensionService.getAllPensions).toHaveBeenCalledTimes(1)
  })

  it('handles errors when fetching pension list', async () => {
    // Mock an error response
    const mockError = new Error('Network error')
    ;(pensionService.getAllPensions as jest.Mock).mockRejectedValueOnce(mockError)

    // Render the hook with a new wrapper
    const { result } = renderHook(() => usePensionList(), {
      wrapper: createWrapper()
    })

    // Wait for the query to complete
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Should have error state
    expect(result.current.isError).toBeTruthy()
  })
})

describe('useDeletePension', () => {
  // Clean up after each test
  afterEach(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('deletes pension correctly', async () => {
    // Mock the service response
    ;(pensionService.deletePension as jest.Mock).mockResolvedValueOnce(undefined)

    // Render the hook with a new wrapper
    const { result } = renderHook(() => useDeletePension(), {
      wrapper: createWrapper()
    })

    // Mutate function should exist
    expect(result.current.mutate).toBeDefined()

    // Call the mutation
    result.current.mutate({ id: 1, pensionType: PensionType.ETF_PLAN })

    // Wait for the mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBeTruthy())

    // Service should have been called with correct params
    expect(pensionService.deletePension).toHaveBeenCalledWith(1, PensionType.ETF_PLAN)
  })

  it('handles errors when deleting pension', async () => {
    // Mock an error response
    const mockError = new Error('Delete failed')
    ;(pensionService.deletePension as jest.Mock).mockRejectedValueOnce(mockError)

    // Render the hook with a new wrapper
    const { result } = renderHook(() => useDeletePension(), {
      wrapper: createWrapper()
    })

    // Call the mutation
    result.current.mutate({ id: 1, pensionType: PensionType.ETF_PLAN })

    // Wait for the mutation to complete with error
    await waitFor(() => expect(result.current.isError).toBeTruthy())
  })
}) 
/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react'
import { usePensionData } from '../usePensionData'
import { PensionType } from '@/frontend/types/pension'
import { usePension } from '@/frontend/context/pension'

// Mock the usePension hook
jest.mock('@/frontend/context/pension')

describe('usePensionData', () => {
  const mockPension = {
    id: 1,
    name: 'Test Pension',
    type: PensionType.COMPANY
  }

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
  })

  it('should handle loading state', async () => {
    const mockFetchPension = jest.fn()
    ;(usePension as jest.Mock).mockReturnValue({
      isLoading: true,
      error: null,
      selectedPension: null,
      fetchPension: mockFetchPension
    })

    const { result } = renderHook(() => usePensionData(1, PensionType.COMPANY))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
    expect(mockFetchPension).toHaveBeenCalledWith(1, PensionType.COMPANY)
  })

  it('should handle successful data fetch', async () => {
    const mockFetchPension = jest.fn().mockResolvedValue(mockPension)
    ;(usePension as jest.Mock).mockReturnValue({
      isLoading: false,
      error: null,
      selectedPension: mockPension,
      fetchPension: mockFetchPension
    })

    const { result } = renderHook(() => usePensionData(1, PensionType.COMPANY))

    expect(result.current.isLoading).toBe(true) // Initially loading
    expect(mockFetchPension).toHaveBeenCalledWith(1, PensionType.COMPANY)

    // Wait for the effect to complete
    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toEqual(mockPension)
    expect(result.current.error).toBeNull()
  })

  it('should handle error state', async () => {
    const mockError = new Error('Failed to fetch pension')
    const mockFetchPension = jest.fn().mockRejectedValue(mockError)
    ;(usePension as jest.Mock).mockReturnValue({
      isLoading: false,
      error: mockError,
      selectedPension: null,
      fetchPension: mockFetchPension
    })

    const { result } = renderHook(() => usePensionData(1, PensionType.COMPANY))

    expect(result.current.isLoading).toBe(true) // Initially loading

    // Wait for the effect to complete
    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toEqual(mockError)
  })

  it('should call mutate function', async () => {
    const mockFetchPension = jest.fn().mockResolvedValue(mockPension)
    ;(usePension as jest.Mock).mockReturnValue({
      isLoading: false,
      error: null,
      selectedPension: mockPension,
      fetchPension: mockFetchPension
    })

    const { result } = renderHook(() => usePensionData(1, PensionType.COMPANY))

    // Clear initial call from useEffect
    mockFetchPension.mockClear()

    await act(async () => {
      await result.current.mutate()
    })

    expect(mockFetchPension).toHaveBeenCalledTimes(1)
    expect(mockFetchPension).toHaveBeenCalledWith(1, PensionType.COMPANY)
  })
}) 
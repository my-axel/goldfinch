import { useState, useEffect } from 'react'
import { PensionType } from '@/frontend/types/pension'
import { usePension } from '@/frontend/context/pension'

interface UsePensionDataResult<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  mutate: () => Promise<void>
}

/**
 * @deprecated For ETF pensions, use the useEtfPension hook from @/frontend/hooks/pension/useEtfPensions instead
 */
export function usePensionData<T>(
  pensionId: number,
  pensionType: PensionType
): UsePensionDataResult<T> {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { selectedPension, fetchPension } = usePension()

  useEffect(() => {
    if (pensionType === PensionType.ETF_PLAN) {
      console.warn(
        'usePensionData is deprecated for ETF pensions. ' +
        'Use the useEtfPension hook from @/frontend/hooks/pension/useEtfPensions instead.'
      )
    }
  }, [pensionType])

  const mutate = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await fetchPension(pensionId, pensionType)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch pension data'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        await fetchPension(pensionId, pensionType)
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch pension data'))
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      mounted = false
    }
  }, [pensionId, pensionType])

  return {
    data: selectedPension as T,
    isLoading,
    error,
    mutate
  }
} 
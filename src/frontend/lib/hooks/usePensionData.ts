import { useState, useEffect } from 'react'
import { PensionType } from '@/frontend/types/pension'
import { usePension } from '@/frontend/context/PensionContext'

interface UsePensionDataResult<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  mutate: () => Promise<void>
}

export function usePensionData<T>(
  pensionId: number,
  pensionType: PensionType
): UsePensionDataResult<T> {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { selectedPension, fetchPension } = usePension()

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
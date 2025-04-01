import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { 
  useSavingsPensions, 
  useSavingsPension,
  useCreateSavingsPension,
  useUpdateSavingsPension,
  useDeleteSavingsPension,
  useSavingsPensionStatements,
  useSavingsPensionProjections
} from '@/frontend/hooks/useSavingsPensions'
import { savingsPensionService } from '@/frontend/services/savingsPensionService'
import { PensionType, CompoundingFrequency, SavingsPension } from '@/frontend/types/pension'

// Mock the service
jest.mock('@/frontend/services/savingsPensionService')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
)

// Mock data
const mockSavingsPension: SavingsPension = {
  id: 1,
  type: PensionType.SAVINGS,
  name: 'Test Savings',
  member_id: 1,
  start_date: '2024-01-01',
  pessimistic_rate: 1.0,
  realistic_rate: 2.0,
  optimistic_rate: 3.0,
  compounding_frequency: CompoundingFrequency.ANNUALLY,
  status: 'ACTIVE',
  notes: '',
  statements: [],
  contribution_plan_steps: []
}

// Create pension data without id for testing
const createPensionData: Omit<SavingsPension, 'id'> = {
  type: PensionType.SAVINGS,
  name: 'Test Savings',
  member_id: 1,
  start_date: '2024-01-01',
  pessimistic_rate: 1.0,
  realistic_rate: 2.0,
  optimistic_rate: 3.0,
  compounding_frequency: CompoundingFrequency.ANNUALLY,
  status: 'ACTIVE',
  notes: '',
  statements: [],
  contribution_plan_steps: []
}

describe('Savings Pension Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    queryClient.clear()
  })

  describe('useSavingsPensions', () => {
    it('should fetch all savings pensions', async () => {
      const mockPensions = [
        { 
          id: 1, 
          type: PensionType.SAVINGS,
          name: 'Test Savings',
          member_id: 1
        }
      ]
      
      ;(savingsPensionService.getAll as jest.Mock).mockResolvedValueOnce(mockPensions)
      
      const { result } = renderHook(() => useSavingsPensions(), { wrapper })
      
      expect(result.current.isLoading).toBeTruthy()
      
      await waitFor(() => expect(result.current.isLoading).toBeFalsy())
      
      expect(result.current.data).toEqual(mockPensions)
      expect(savingsPensionService.getAll).toHaveBeenCalledWith(undefined)
    })

    it('should fetch savings pensions filtered by member ID', async () => {
      const memberId = 1
      const mockPensions = [
        { 
          id: 1, 
          type: PensionType.SAVINGS,
          name: 'Test Savings',
          member_id: memberId
        }
      ]
      
      ;(savingsPensionService.getAll as jest.Mock).mockResolvedValueOnce(mockPensions)
      
      const { result } = renderHook(() => useSavingsPensions(memberId), { wrapper })
      
      await waitFor(() => expect(result.current.isLoading).toBeFalsy())
      
      expect(result.current.data).toEqual(mockPensions)
      expect(savingsPensionService.getAll).toHaveBeenCalledWith(memberId)
    })
  })

  describe('useSavingsPension', () => {
    it('should fetch a single savings pension', async () => {
      ;(savingsPensionService.get as jest.Mock).mockResolvedValueOnce(mockSavingsPension)
      
      const { result } = renderHook(() => useSavingsPension(1), { wrapper })
      
      await waitFor(() => expect(result.current.isLoading).toBeFalsy())
      
      expect(result.current.data).toEqual(mockSavingsPension)
      expect(savingsPensionService.get).toHaveBeenCalledWith(1)
    })
  })

  describe('useCreateSavingsPension', () => {
    it('should create a savings pension', async () => {
      ;(savingsPensionService.create as jest.Mock).mockResolvedValueOnce(mockSavingsPension)
      
      const { result } = renderHook(() => useCreateSavingsPension(), { wrapper })
      
      result.current.mutate(createPensionData)
      
      await waitFor(() => expect(result.current.isSuccess).toBeTruthy())
      
      expect(savingsPensionService.create).toHaveBeenCalledWith(createPensionData)
    })
  })

  describe('useUpdateSavingsPension', () => {
    it('should update a savings pension', async () => {
      const pensionId = 1
      const updates = {
        name: 'Updated Savings',
        pessimistic_rate: 2.0
      }
      
      const mockResponse = {
        ...mockSavingsPension,
        ...updates
      }
      
      ;(savingsPensionService.update as jest.Mock).mockResolvedValueOnce(mockResponse)
      
      const { result } = renderHook(() => useUpdateSavingsPension(pensionId), { wrapper })
      
      result.current.mutate(updates)
      
      await waitFor(() => expect(result.current.isSuccess).toBeTruthy())
      
      expect(savingsPensionService.update).toHaveBeenCalledWith(pensionId, updates)
    })
  })

  describe('useDeleteSavingsPension', () => {
    it('should delete a savings pension', async () => {
      const pensionId = 1
      
      ;(savingsPensionService.delete as jest.Mock).mockResolvedValueOnce(undefined)
      
      const { result } = renderHook(() => useDeleteSavingsPension(), { wrapper })
      
      result.current.mutate(pensionId)
      
      await waitFor(() => expect(result.current.isSuccess).toBeTruthy())
      
      expect(savingsPensionService.delete).toHaveBeenCalledWith(pensionId)
    })
  })

  describe('useSavingsPensionStatements', () => {
    it('should add a statement', async () => {
      const pensionId = 1
      const newStatement = {
        statement_date: '2024-01-01',
        balance: 10000,
        note: 'Test statement'
      }
      
      const mockResponse = { id: 1, pension_id: pensionId, ...newStatement }
      
      ;(savingsPensionService.addStatement as jest.Mock).mockResolvedValueOnce(mockResponse)
      
      const { result } = renderHook(() => useSavingsPensionStatements(), { wrapper })
      
      result.current.addStatement.mutate({ pensionId, data: newStatement })
      
      await waitFor(() => expect(result.current.addStatement.isSuccess).toBeTruthy())
      
      expect(savingsPensionService.addStatement).toHaveBeenCalledWith(pensionId, newStatement)
    })

    it('should delete a statement', async () => {
      const pensionId = 1
      const statementId = 2
      
      ;(savingsPensionService.deleteStatement as jest.Mock).mockResolvedValueOnce(undefined)
      
      const { result } = renderHook(() => useSavingsPensionStatements(), { wrapper })
      
      result.current.deleteStatement.mutate({ pensionId, statementId })
      
      await waitFor(() => expect(result.current.deleteStatement.isSuccess).toBeTruthy())
      
      expect(savingsPensionService.deleteStatement).toHaveBeenCalledWith(pensionId, statementId)
    })
  })

  describe('useSavingsPensionProjections', () => {
    it('should fetch projections', async () => {
      const pensionId = 1
      const mockProjections = {
        pessimistic: { finalValue: 100000 },
        realistic: { finalValue: 150000 },
        optimistic: { finalValue: 200000 }
      }
      
      ;(savingsPensionService.getProjections as jest.Mock).mockResolvedValueOnce(mockProjections)
      
      const { result } = renderHook(() => useSavingsPensionProjections(pensionId), { wrapper })
      
      await waitFor(() => expect(result.current.isLoading).toBeFalsy())
      
      expect(result.current.data).toEqual(mockProjections)
      expect(savingsPensionService.getProjections).toHaveBeenCalledWith(pensionId, undefined)
    })

    it('should fetch projections with reference date', async () => {
      const pensionId = 1
      const referenceDate = '2024-01-01'
      const mockProjections = {
        pessimistic: { finalValue: 100000 },
        realistic: { finalValue: 150000 },
        optimistic: { finalValue: 200000 }
      }
      
      ;(savingsPensionService.getProjections as jest.Mock).mockResolvedValueOnce(mockProjections)
      
      const { result } = renderHook(
        () => useSavingsPensionProjections(pensionId, referenceDate), 
        { wrapper }
      )
      
      await waitFor(() => expect(result.current.isLoading).toBeFalsy())
      
      expect(result.current.data).toEqual(mockProjections)
      expect(savingsPensionService.getProjections).toHaveBeenCalledWith(pensionId, referenceDate)
    })
  })
}) 
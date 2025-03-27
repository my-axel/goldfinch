import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { 
  useStatePensions, 
  useStatePension, 
  useStatePensionStatements, 
  useStatePensionScenarios,
  useCreateStatePension,
  useUpdateStatePension,
  useDeleteStatePension,
  useCreateStatePensionStatement,
  useUpdateStatePensionStatement,
  useDeleteStatePensionStatement,
  useUpdateStatePensionStatus
} from '@/frontend/hooks/pension/useStatePensions'
import { statePensionService } from '@/frontend/services/statePensionService'
import { PensionStatusUpdate } from '@/frontend/types/pension'
import { StatePension, PensionType } from '@/frontend/types/pension'

// Mock the API service
jest.mock('@/frontend/services/statePensionService', () => ({
  statePensionService: {
    list: jest.fn(),
    get: jest.fn(),
    getSummaries: jest.fn(),
    getStatements: jest.fn(),
    getScenarios: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createStatement: jest.fn(),
    updateStatement: jest.fn(),
    deleteStatement: jest.fn(),
    updateStatus: jest.fn()
  }
}))

// Mock data
const mockStatePension = {
  id: 1,
  name: 'Test State Pension',
  member_id: 1,
  start_date: '2020-01-01',
  status: 'ACTIVE',
  latest_statement_date: '2023-01-01',
  latest_monthly_amount: 1000,
  latest_projected_amount: 1500
}

const mockStatePensions = [mockStatePension]

const mockStatement = {
  id: 1,
  pension_id: 1,
  statement_date: '2023-01-01',
  current_value: 100000,
  current_monthly_amount: 1000,
  projected_monthly_amount: 1500
}

const mockStatements = [mockStatement]

const mockScenarios = {
  planned: {
    pessimistic: { monthly_amount: 1000, annual_amount: 12000, retirement_age: 65, years_to_retirement: 10, growth_rate: 0.02 },
    realistic: { monthly_amount: 1500, annual_amount: 18000, retirement_age: 65, years_to_retirement: 10, growth_rate: 0.04 },
    optimistic: { monthly_amount: 2000, annual_amount: 24000, retirement_age: 65, years_to_retirement: 10, growth_rate: 0.06 }
  },
  possible: {
    pessimistic: { monthly_amount: 900, annual_amount: 10800, retirement_age: 60, years_to_retirement: 5, growth_rate: 0.02 },
    realistic: { monthly_amount: 1300, annual_amount: 15600, retirement_age: 60, years_to_retirement: 5, growth_rate: 0.04 },
    optimistic: { monthly_amount: 1700, annual_amount: 20400, retirement_age: 60, years_to_retirement: 5, growth_rate: 0.06 }
  }
}

// Test wrapper for React Query hooks
const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('State Pension Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useStatePensions', () => {
    it('fetches state pensions successfully', async () => {
      // Setup mock
      (statePensionService.list as jest.Mock).mockResolvedValue(mockStatePensions)
      
      // Render hook
      const { result } = renderHook(() => useStatePensions(), { wrapper })
      
      // Initial state should be loading
      expect(result.current.isLoading).toBe(true)
      
      // Wait for data fetch
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      // Should have correct data
      expect(result.current.data).toEqual(mockStatePensions)
      expect(statePensionService.list).toHaveBeenCalledTimes(1)
    })
    
    it('applies memberId filter when provided', async () => {
      // Setup mock
      (statePensionService.list as jest.Mock).mockResolvedValue(mockStatePensions)
      
      // Render hook with member ID
      const memberId = 1
      const { result } = renderHook(() => useStatePensions(memberId), { wrapper })
      
      // Wait for fetch
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      // Should call API with the correct member ID
      expect(statePensionService.list).toHaveBeenCalledWith(memberId)
    })
  })
  
  describe('useStatePension', () => {
    it('fetches a specific state pension', async () => {
      // Setup mock
      (statePensionService.get as jest.Mock).mockResolvedValue(mockStatePension)
      
      // Render hook
      const { result } = renderHook(() => useStatePension(1), { wrapper })
      
      // Wait for data
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      // Should have correct data
      expect(result.current.data).toEqual(mockStatePension)
      expect(statePensionService.get).toHaveBeenCalledWith(1)
    })
    
    it('returns undefined when no ID is provided', async () => {
      // Render hook with undefined ID
      const { result } = renderHook(() => useStatePension(undefined as unknown as number), { wrapper })
      
      // Should be in disabled state
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isFetched).toBe(false)
      
      // API should not be called
      expect(statePensionService.get).not.toHaveBeenCalled()
    })
  })
  
  describe('useStatePensionStatements', () => {
    it('fetches statements for a pension', async () => {
      // Setup mock
      (statePensionService.getStatements as jest.Mock).mockResolvedValue(mockStatements)
      
      // Render hook
      const { result } = renderHook(() => useStatePensionStatements(1), { wrapper })
      
      // Wait for data
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      // Should have correct data
      expect(result.current.data).toEqual(mockStatements)
      expect(statePensionService.getStatements).toHaveBeenCalledWith(1)
    })
  })
  
  describe('useStatePensionScenarios', () => {
    it('fetches scenarios for a pension', async () => {
      // Setup mock
      (statePensionService.getScenarios as jest.Mock).mockResolvedValue(mockScenarios)
      
      // Render hook
      const { result } = renderHook(() => useStatePensionScenarios(1), { wrapper })
      
      // Wait for data
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      // Should have correct data
      expect(result.current.data).toEqual(mockScenarios)
      expect(statePensionService.getScenarios).toHaveBeenCalledWith(1)
    })
  })
  
  describe('useCreateStatePension', () => {
    it('creates a state pension', async () => {
      // Setup mock
      (statePensionService.create as jest.Mock).mockResolvedValue(mockStatePension)
      
      // Render hook
      const { result } = renderHook(() => useCreateStatePension(), { wrapper })
      
      // Execute mutation
      const newPension: Omit<StatePension, 'id'> = {
        name: 'Test State Pension',
        member_id: 1,
        start_date: '2020-01-01',
        status: 'ACTIVE' as const,
        type: PensionType.STATE
      }
      
      result.current.mutate(newPension)
      
      // Wait for mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      // Should call service with correct data
      expect(statePensionService.create).toHaveBeenCalledWith(newPension)
      expect(result.current.data).toEqual(mockStatePension)
    })
  })
  
  describe('useUpdateStatePension', () => {
    it('updates a state pension', async () => {
      // Setup mock
      (statePensionService.update as jest.Mock).mockResolvedValue(mockStatePension)
      
      // Render hook
      const { result } = renderHook(() => useUpdateStatePension(), { wrapper })
      
      // Execute mutation
      const updateData = {
        id: 1,
        data: { name: 'Updated State Pension' }
      }
      
      result.current.mutate(updateData)
      
      // Wait for mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      // Should call service with correct data
      expect(statePensionService.update).toHaveBeenCalledWith(1, { name: 'Updated State Pension' })
      expect(result.current.data).toEqual(mockStatePension)
    })
  })
  
  describe('useDeleteStatePension', () => {
    it('deletes a state pension', async () => {
      // Setup mock
      (statePensionService.delete as jest.Mock).mockResolvedValue(undefined)
      
      // Render hook
      const { result } = renderHook(() => useDeleteStatePension(), { wrapper })
      
      // Execute mutation
      result.current.mutate(1)
      
      // Wait for mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      // Should call service with correct ID
      expect(statePensionService.delete).toHaveBeenCalledWith(1)
    })
  })
  
  describe('useCreateStatePensionStatement', () => {
    it('creates a statement for a pension', async () => {
      // Setup mock
      (statePensionService.createStatement as jest.Mock).mockResolvedValue(mockStatement)
      
      // Render hook
      const { result } = renderHook(() => useCreateStatePensionStatement(), { wrapper })
      
      // Execute mutation
      const statementData = {
        pensionId: 1,
        data: {
          statement_date: '2023-01-01',
          current_value: 100000,
          current_monthly_amount: 1000,
          projected_monthly_amount: 1500
        }
      }
      
      result.current.mutate(statementData)
      
      // Wait for mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      // Should call service with correct data
      expect(statePensionService.createStatement).toHaveBeenCalledWith(
        1, 
        statementData.data
      )
      expect(result.current.data).toEqual(mockStatement)
    })
  })
  
  describe('useUpdateStatePensionStatement', () => {
    it('updates a statement for a pension', async () => {
      // Setup mock
      (statePensionService.updateStatement as jest.Mock).mockResolvedValue(mockStatement)
      
      // Render hook
      const { result } = renderHook(() => useUpdateStatePensionStatement(), { wrapper })
      
      // Execute mutation
      const updateData = {
        pensionId: 1,
        statementId: 1,
        data: { current_monthly_amount: 1100 }
      }
      
      result.current.mutate(updateData)
      
      // Wait for mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      // Should call service with correct data
      expect(statePensionService.updateStatement).toHaveBeenCalledWith(
        1, 
        1,
        { current_monthly_amount: 1100 }
      )
      expect(result.current.data).toEqual(mockStatement)
    })
  })
  
  describe('useDeleteStatePensionStatement', () => {
    it('deletes a statement', async () => {
      // Setup mock
      (statePensionService.deleteStatement as jest.Mock).mockResolvedValue(undefined)
      
      // Render hook
      const { result } = renderHook(() => useDeleteStatePensionStatement(), { wrapper })
      
      // Execute mutation
      result.current.mutate({ pensionId: 1, statementId: 1 })
      
      // Wait for mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      // Should call service with correct IDs
      expect(statePensionService.deleteStatement).toHaveBeenCalledWith(1, 1)
    })
  })
  
  describe('useUpdateStatePensionStatus', () => {
    it('updates the status of a pension', async () => {
      // Setup mock
      (statePensionService.updateStatus as jest.Mock).mockResolvedValue(mockStatePension)
      
      // Render hook
      const { result } = renderHook(() => useUpdateStatePensionStatus(), { wrapper })
      
      // Execute mutation
      const statusUpdate: PensionStatusUpdate = {
        status: 'PAUSED',
        paused_at: '2023-06-01'
      }
      
      result.current.mutate({ pensionId: 1, statusData: statusUpdate })
      
      // Wait for mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      // Should call service with correct data
      expect(statePensionService.updateStatus).toHaveBeenCalledWith(1, statusUpdate)
      expect(result.current.data).toEqual(mockStatePension)
    })
  })
}) 
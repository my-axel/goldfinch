import { statePensionService } from '@/frontend/services/statePensionService'
import { PensionStatusUpdate, PensionType, StatePension } from '@/frontend/types/pension'
import { api } from '@/frontend/lib/api-client'

// Mock the API client
jest.mock('@/frontend/lib/api-client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
}))

// Mock the API routes
jest.mock('@/frontend/lib/routes/api/pension', () => ({
  getPensionApiRoute: jest.fn().mockImplementation((type) => {
    return `/api/v1/pensions/${type.toLowerCase()}`
  }),
  getPensionApiRouteWithId: jest.fn().mockImplementation((type, id) => {
    return `/api/v1/pensions/${type.toLowerCase()}/${id}`
  }),
  getStatePensionStatementsRoute: jest.fn().mockImplementation((pensionId) => {
    return `/api/v1/pensions/state/${pensionId}/statements`
  }),
  getStatePensionStatementRoute: jest.fn().mockImplementation((pensionId, statementId) => {
    return `/api/v1/pensions/state/${pensionId}/statements/${statementId}`
  }),
  getStatePensionScenariosRoute: jest.fn().mockImplementation((pensionId) => {
    return `/api/v1/pensions/state/${pensionId}/scenarios`
  }),
  getStatePensionSummariesRoute: jest.fn().mockImplementation(() => {
    return `/api/v1/pension-summaries/state`
  }),
  getPensionStatusRoute: jest.fn().mockImplementation((type, pensionId) => {
    return `/api/v1/pensions/${type.toLowerCase()}/${pensionId}/status`
  })
}))

// Store original location and mock it
const originalOrigin = window.location.origin
// Mock window location without using delete
Object.defineProperty(window, 'location', {
  value: {
    origin: 'https://test.example.com'
  },
  writable: true
})

describe('statePensionService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    // Restore original origin
    Object.defineProperty(window, 'location', {
      value: { origin: originalOrigin },
      writable: true
    })
  })

  describe('list', () => {
    it('fetches a list of state pensions', async () => {
      const mockPensions = [{ id: 1, name: 'State Pension 1' }]
      ;(api.get as jest.Mock).mockResolvedValue(mockPensions)

      const result = await statePensionService.list()

      expect(api.get).toHaveBeenCalledWith('https://test.example.com/api/v1/pensions/state')
      expect(result).toEqual(mockPensions)
    })

    it('includes member ID in query params when provided', async () => {
      const mockPensions = [{ id: 1, name: 'State Pension 1' }]
      ;(api.get as jest.Mock).mockResolvedValue(mockPensions)

      const result = await statePensionService.list(1)

      expect(api.get).toHaveBeenCalledWith('https://test.example.com/api/v1/pensions/state?member_id=1')
      expect(result).toEqual(mockPensions)
    })
  })

  describe('get', () => {
    it('fetches a specific state pension by ID', async () => {
      const mockPension = { id: 1, name: 'State Pension 1' }
      ;(api.get as jest.Mock).mockResolvedValue(mockPension)

      const result = await statePensionService.get(1)

      expect(api.get).toHaveBeenCalledWith('/api/v1/pensions/state/1')
      expect(result).toEqual(mockPension)
    })
  })

  describe('create', () => {
    it('creates a new state pension', async () => {
      const newPension: Omit<StatePension, 'id'> = {
        name: 'New State Pension',
        member_id: 1,
        start_date: '2023-01-01',
        status: 'ACTIVE' as const,
        type: PensionType.STATE
      }

      const mockCreatedPension = { ...newPension, id: 1 }
      ;(api.post as jest.Mock).mockResolvedValue(mockCreatedPension)

      const result = await statePensionService.create(newPension)

      expect(api.post).toHaveBeenCalledWith('/api/v1/pensions/state', newPension)
      expect(result).toEqual(mockCreatedPension)
    })
  })

  describe('update', () => {
    it('updates an existing state pension', async () => {
      const updateData = { name: 'Updated State Pension' }
      const mockUpdatedPension = { id: 1, ...updateData }
      ;(api.put as jest.Mock).mockResolvedValue(mockUpdatedPension)

      const result = await statePensionService.update(1, updateData)

      expect(api.put).toHaveBeenCalledWith('/api/v1/pensions/state/1', updateData)
      expect(result).toEqual(mockUpdatedPension)
    })
  })

  describe('delete', () => {
    it('deletes a state pension', async () => {
      (api.delete as jest.Mock).mockResolvedValue(undefined)

      await statePensionService.delete(1)

      expect(api.delete).toHaveBeenCalledWith('/api/v1/pensions/state/1')
    })
  })

  describe('getStatements', () => {
    it('fetches statements for a state pension', async () => {
      const mockStatements = [
        { id: 1, pension_id: 1, statement_date: '2023-01-01' }
      ]
      ;(api.get as jest.Mock).mockResolvedValue(mockStatements)

      const result = await statePensionService.getStatements(1)

      expect(api.get).toHaveBeenCalledWith('/api/v1/pensions/state/1/statements')
      expect(result).toEqual(mockStatements)
    })
  })

  describe('createStatement', () => {
    it('creates a new statement for a state pension', async () => {
      const newStatement = {
        statement_date: '2023-01-01',
        current_value: 100000,
        current_monthly_amount: 1000,
        projected_monthly_amount: 1500
      }

      const mockCreatedStatement = { ...newStatement, id: 1, pension_id: 1 }
      ;(api.post as jest.Mock).mockResolvedValue(mockCreatedStatement)

      const result = await statePensionService.createStatement(1, newStatement)

      expect(api.post).toHaveBeenCalledWith('/api/v1/pensions/state/1/statements', newStatement)
      expect(result).toEqual(mockCreatedStatement)
    })
  })

  describe('updateStatement', () => {
    it('updates an existing statement', async () => {
      const updateData = { current_monthly_amount: 1100 }
      const mockUpdatedStatement = { 
        id: 2, 
        pension_id: 1, 
        statement_date: '2023-01-01',
        current_monthly_amount: 1100 
      }
      ;(api.put as jest.Mock).mockResolvedValue(mockUpdatedStatement)

      const result = await statePensionService.updateStatement(1, 2, updateData)

      expect(api.put).toHaveBeenCalledWith('/api/v1/pensions/state/1/statements/2', updateData)
      expect(result).toEqual(mockUpdatedStatement)
    })
  })

  describe('deleteStatement', () => {
    it('deletes a statement', async () => {
      (api.delete as jest.Mock).mockResolvedValue(undefined)

      await statePensionService.deleteStatement(1, 2)

      expect(api.delete).toHaveBeenCalledWith('/api/v1/pensions/state/1/statements/2')
    })
  })

  describe('getScenarios', () => {
    it('fetches scenarios for a state pension', async () => {
      const mockScenarios = {
        planned: {
          pessimistic: { monthly_amount: 1000 },
          realistic: { monthly_amount: 1500 },
          optimistic: { monthly_amount: 2000 }
        },
        possible: {
          pessimistic: { monthly_amount: 900 },
          realistic: { monthly_amount: 1300 },
          optimistic: { monthly_amount: 1700 }
        }
      }
      ;(api.get as jest.Mock).mockResolvedValue(mockScenarios)

      const result = await statePensionService.getScenarios(1)

      expect(api.get).toHaveBeenCalledWith('/api/v1/pensions/state/1/scenarios')
      expect(result).toEqual(mockScenarios)
    })
  })

  describe('getSummaries', () => {
    it('fetches pension summaries', async () => {
      const mockSummaries = [{ id: 1, name: 'State Pension 1' }]
      ;(api.get as jest.Mock).mockResolvedValue(mockSummaries)

      const result = await statePensionService.getSummaries()

      expect(api.get).toHaveBeenCalledWith('https://test.example.com/api/v1/pension-summaries/state')
      expect(result).toEqual(mockSummaries)
    })

    it('includes member ID in query params when provided', async () => {
      const mockSummaries = [{ id: 1, name: 'State Pension 1' }]
      ;(api.get as jest.Mock).mockResolvedValue(mockSummaries)

      const result = await statePensionService.getSummaries(1)

      expect(api.get).toHaveBeenCalledWith('https://test.example.com/api/v1/pension-summaries/state?member_id=1')
      expect(result).toEqual(mockSummaries)
    })
  })

  describe('updateStatus', () => {
    it('updates the status of a state pension', async () => {
      const statusUpdate: PensionStatusUpdate = {
        status: 'PAUSED',
        paused_at: '2023-06-01'
      }

      const mockUpdatedPension = { 
        id: 1, 
        name: 'State Pension 1',
        status: 'PAUSED',
        paused_at: '2023-06-01'
      }
      ;(api.put as jest.Mock).mockResolvedValue(mockUpdatedPension)

      const result = await statePensionService.updateStatus(1, statusUpdate)

      expect(api.put).toHaveBeenCalledWith('/api/v1/pensions/state/1/status', statusUpdate)
      expect(result).toEqual(mockUpdatedPension)
    })
  })
}) 
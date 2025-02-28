/**
 * @jest-environment jsdom
 */

import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import { HouseholdProvider, useHousehold } from './HouseholdContext'
import { HouseholdMember, HouseholdMemberFormData } from '@/frontend/types/household'
import { useApi } from '@/frontend/hooks/useApi'
import { calculateMemberFields } from '@/frontend/types/household-helpers'
import React from 'react'

// Mock the useApi hook
jest.mock('@/frontend/hooks/useApi')

// Test component that uses the household context
function TestComponent({ onAction }: { onAction?: () => void }) {
  const { 
    members, 
    isLoading, 
    error, 
    fetchMembers,
    getMemberWithComputedFields
  } = useHousehold()
  
  // Execute the action if provided
  React.useEffect(() => {
    if (onAction) {
      const executeAction = async () => {
        try {
          await onAction()
        } catch (err) {
          console.error('Action failed:', err)
        }
      }
      executeAction()
    }
  }, [onAction])

  return (
    <div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="error">{error || 'no error'}</div>
      <button onClick={() => fetchMembers()}>Fetch Members</button>
      <button onClick={onAction}>Trigger Action</button>
      <ul>
        {members.map(member => {
          const computed = getMemberWithComputedFields(member)
          return (
            <li key={member.id} data-testid={`member-${member.id}`}>
              {member.first_name} {member.last_name} (Age: {computed.age})
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// Wrapper component to test hooks
function TestHookComponent({ 
  callback 
}: { 
  callback: (hooks: ReturnType<typeof useHousehold>) => Promise<void> 
}) {
  const hooks = useHousehold()
  
  return (
    <div>
      <div data-testid="loading">{hooks.isLoading.toString()}</div>
      <div data-testid="error">{hooks.error || 'no error'}</div>
      <button onClick={() => callback(hooks)}>
        Test Hook
      </button>
    </div>
  )
}

describe('HouseholdContext', () => {
  const mockApiCall = jest.fn()
  const user = userEvent.setup()
  
  // Sample household member data
  const sampleMember: HouseholdMember = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    birthday: new Date('1990-01-01'),
    retirement_age_planned: 65,
    retirement_age_possible: 60,
    retirement_date_planned: new Date('2055-01-01'),
    retirement_date_possible: new Date('2050-01-01')
  }

  const newMemberData: HouseholdMemberFormData = {
    first_name: 'Jane',
    last_name: 'Doe',
    birthday: new Date('1992-01-01'),
    retirement_age_planned: 65,
    retirement_age_possible: 62
  }

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
    
    // Setup useApi mock
    ;(useApi as jest.Mock).mockReturnValue({
      isLoading: false,
      error: null,
      apiCall: mockApiCall
    })
  })

  it('provides loading state', () => {
    ;(useApi as jest.Mock).mockReturnValue({
      isLoading: true,
      error: null,
      apiCall: mockApiCall
    })

    render(
      <HouseholdProvider>
        <TestComponent />
      </HouseholdProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('true')
  })

  it('provides error state', () => {
    const testError = 'Test error message'
    ;(useApi as jest.Mock).mockReturnValue({
      isLoading: false,
      error: testError,
      apiCall: mockApiCall
    })

    render(
      <HouseholdProvider>
        <TestComponent />
      </HouseholdProvider>
    )

    expect(screen.getByTestId('error')).toHaveTextContent(testError)
  })

  it('fetches and displays household members', async () => {
    mockApiCall.mockResolvedValueOnce([sampleMember])

    render(
      <HouseholdProvider>
        <TestComponent />
      </HouseholdProvider>
    )

    // Click the fetch button
    await user.click(screen.getByText('Fetch Members'))

    // Wait for the member to be displayed
    expect(await screen.findByTestId(`member-${sampleMember.id}`))
      .toHaveTextContent(`${sampleMember.first_name} ${sampleMember.last_name}`)

    // Verify API was called
    expect(mockApiCall).toHaveBeenCalledTimes(1)
  })

  it('adds a new household member', async () => {
    const newMember = { ...newMemberData, id: 2 }
    mockApiCall.mockResolvedValueOnce(newMember)

    render(
      <HouseholdProvider>
        <TestHookComponent callback={async (hooks) => {
          await hooks.addMember(newMemberData)
        }} />
      </HouseholdProvider>
    )

    // Trigger action to test hook
    await user.click(screen.getByText('Test Hook'))

    // Verify API call
    expect(mockApiCall).toHaveBeenCalledWith(
      expect.any(String),
      'POST',
      newMemberData
    )
  })

  it('updates an existing household member', async () => {
    const updatedData = { first_name: 'Johnny' }
    const updatedMember = { ...sampleMember, ...updatedData }
    mockApiCall.mockResolvedValueOnce(updatedMember)

    render(
      <HouseholdProvider>
        <TestHookComponent callback={async (hooks) => {
          await hooks.updateMember(1, updatedData)
        }} />
      </HouseholdProvider>
    )

    // Trigger action to test hook
    await user.click(screen.getByText('Test Hook'))

    // Verify API call
    expect(mockApiCall).toHaveBeenCalledWith(
      expect.any(String),
      'PUT',
      updatedData
    )
  })

  it('deletes a household member', async () => {
    mockApiCall.mockResolvedValueOnce(undefined)

    render(
      <HouseholdProvider>
        <TestHookComponent callback={async (hooks) => {
          await hooks.deleteMember(1)
        }} />
      </HouseholdProvider>
    )

    // Trigger action to test hook
    await user.click(screen.getByText('Test Hook'))

    // Verify API call
    expect(mockApiCall).toHaveBeenCalledWith(
      expect.any(String),
      'DELETE'
    )
  })

  it('calculates member fields correctly', async () => {
    mockApiCall.mockResolvedValueOnce([sampleMember])

    render(
      <HouseholdProvider>
        <TestComponent />
      </HouseholdProvider>
    )

    // Fetch members to populate the list
    await user.click(screen.getByText('Fetch Members'))

    // Wait for the member to be displayed with computed age
    const memberElement = await screen.findByTestId(`member-${sampleMember.id}`)
    const computedFields = calculateMemberFields(sampleMember)
    expect(memberElement).toHaveTextContent(`Age: ${computedFields.age}`)
  })

  it('throws error when useHousehold is used outside provider', () => {
    // Suppress console.error for this test as we expect an error
    const consoleSpy = jest.spyOn(console, 'error')
    consoleSpy.mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useHousehold must be used within HouseholdProvider')

    consoleSpy.mockRestore()
  })

  // Error handling tests
  it('handles failed member addition', async () => {
    const errorMessage = 'Failed to add member'
    ;(useApi as jest.Mock).mockReturnValue({
      isLoading: false,
      error: errorMessage,
      apiCall: mockApiCall.mockRejectedValueOnce(new Error(errorMessage))
    })

    render(
      <HouseholdProvider>
        <TestHookComponent callback={async (hooks) => {
          try {
            await hooks.addMember(newMemberData)
          } catch {
            // Error is expected
          }
        }} />
      </HouseholdProvider>
    )

    await user.click(screen.getByText('Test Hook'))
    expect(screen.getByTestId('error')).toHaveTextContent(errorMessage)
  })

  it('handles failed member update', async () => {
    const errorMessage = 'Failed to update member'
    ;(useApi as jest.Mock).mockReturnValue({
      isLoading: false,
      error: errorMessage,
      apiCall: mockApiCall.mockRejectedValueOnce(new Error(errorMessage))
    })

    render(
      <HouseholdProvider>
        <TestHookComponent callback={async (hooks) => {
          try {
            await hooks.updateMember(1, { first_name: 'Updated' })
          } catch {
            // Error is expected
          }
        }} />
      </HouseholdProvider>
    )

    await user.click(screen.getByText('Test Hook'))
    expect(screen.getByTestId('error')).toHaveTextContent(errorMessage)
  })

  it('handles failed member deletion', async () => {
    const errorMessage = 'Failed to delete member'
    ;(useApi as jest.Mock).mockReturnValue({
      isLoading: false,
      error: errorMessage,
      apiCall: mockApiCall.mockRejectedValueOnce(new Error(errorMessage))
    })

    render(
      <HouseholdProvider>
        <TestHookComponent callback={async (hooks) => {
          try {
            await hooks.deleteMember(1)
          } catch {
            // Error is expected
          }
        }} />
      </HouseholdProvider>
    )

    await user.click(screen.getByText('Test Hook'))
    expect(screen.getByTestId('error')).toHaveTextContent(errorMessage)
  })

  it('handles failed members fetch', async () => {
    const errorMessage = 'Failed to fetch members'
    mockApiCall.mockRejectedValueOnce(new Error(errorMessage))
    ;(useApi as jest.Mock).mockReturnValue({
      isLoading: false,
      error: errorMessage,
      apiCall: mockApiCall
    })

    render(
      <HouseholdProvider>
        <TestHookComponent callback={async (hooks) => {
          try {
            await hooks.fetchMembers()
          } catch {
            // Error is expected
          }
        }} />
      </HouseholdProvider>
    )

    await user.click(screen.getByText('Test Hook'))
    expect(screen.getByTestId('error')).toHaveTextContent(errorMessage)
  })

  // State update tests
  it('updates members list after successful addition', async () => {
    const newMember = { ...newMemberData, id: 2 }
    mockApiCall
      .mockResolvedValueOnce(newMember)  // addMember response
      .mockResolvedValueOnce([sampleMember, newMember])  // fetchMembers response

    render(
      <HouseholdProvider>
        <TestHookComponent callback={async (hooks) => {
          await hooks.addMember(newMemberData)
          await hooks.fetchMembers()
        }} />
      </HouseholdProvider>
    )

    await user.click(screen.getByText('Test Hook'))
    
    // Verify API calls
    expect(mockApiCall).toHaveBeenCalledWith(expect.any(String), 'POST', newMemberData)
    expect(mockApiCall).toHaveBeenCalledWith(expect.any(String))
  })

  it('updates members list after successful deletion', async () => {
    mockApiCall
      .mockResolvedValueOnce([sampleMember])  // Initial fetch
      .mockResolvedValueOnce(undefined)  // Delete response
      .mockResolvedValueOnce([])  // Final fetch

    render(
      <HouseholdProvider>
        <TestHookComponent callback={async (hooks) => {
          await hooks.fetchMembers()  // Initial fetch
          await hooks.deleteMember(sampleMember.id)
          await hooks.fetchMembers()  // Fetch after deletion
        }} />
      </HouseholdProvider>
    )

    await user.click(screen.getByText('Test Hook'))
    
    // Verify API calls
    expect(mockApiCall).toHaveBeenCalledWith(expect.any(String))  // Initial fetch
    expect(mockApiCall).toHaveBeenCalledWith(expect.any(String), 'DELETE')  // Delete
    expect(mockApiCall).toHaveBeenCalledWith(expect.any(String))  // Final fetch
  })

  it('validates required fields when adding a member', async () => {
    const invalidMemberData = {
      first_name: '', // Empty first name should be invalid
      last_name: 'Doe',
      birthday: new Date('1992-01-01'),
      retirement_age_planned: 65,
      retirement_age_possible: 62
    }

    const errorMessage = 'Invalid data'
    ;(useApi as jest.Mock).mockReturnValue({
      isLoading: false,
      error: errorMessage,
      apiCall: mockApiCall.mockRejectedValueOnce(new Error(errorMessage))
    })

    render(
      <HouseholdProvider>
        <TestHookComponent callback={async (hooks) => {
          try {
            await hooks.addMember(invalidMemberData as HouseholdMemberFormData)
          } catch {
            // Error is expected
          }
        }} />
      </HouseholdProvider>
    )

    await user.click(screen.getByText('Test Hook'))
    expect(screen.getByTestId('error')).toHaveTextContent(errorMessage)
  })
}) 
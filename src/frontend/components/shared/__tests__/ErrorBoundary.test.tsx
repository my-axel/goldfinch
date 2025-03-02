/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '../ErrorBoundary'

// Mock dependencies
jest.mock('@/frontend/components/ui/alert', () => ({
  Alert: jest.fn(({ children }) => <div data-testid="mock-alert">{children}</div>),
  AlertTitle: jest.fn(({ children }) => <div data-testid="mock-alert-title">{children}</div>),
  AlertDescription: jest.fn(({ children }) => <div data-testid="mock-alert-description">{children}</div>)
}))

jest.mock('@/frontend/components/ui/button', () => ({
  Button: jest.fn(({ children, onClick }) => (
    <button data-testid="mock-button" onClick={onClick}>
      {children}
    </button>
  ))
}))

jest.mock('lucide-react', () => ({
  RefreshCw: () => <div data-testid="mock-refresh-icon" />
}))

describe('ErrorBoundary', () => {
  const originalConsoleError = console.error
  beforeAll(() => {
    // Suppress console.error for error boundary tests
    console.error = jest.fn()
  })

  afterAll(() => {
    console.error = originalConsoleError
  })

  it('should render children when there is no error', () => {
    const TestChild = () => <div data-testid="test-child">Test Content</div>

    render(
      <ErrorBoundary>
        <TestChild />
      </ErrorBoundary>
    )

    expect(screen.getByTestId('test-child')).toBeInTheDocument()
    expect(screen.queryByTestId('mock-alert')).not.toBeInTheDocument()
  })

  it('should render error message when there is an error', () => {
    const ErrorComponent = () => {
      throw new Error('Test error')
    }

    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    )

    expect(screen.getByTestId('mock-alert')).toBeInTheDocument()
    expect(screen.getByText('An error occurred while loading the pension data.')).toBeInTheDocument()
  })

  it('should render custom error message when provided', () => {
    const customError = 'Custom error message'
    const ErrorComponent = () => {
      throw new Error('Test error')
    }

    render(
      <ErrorBoundary errorMessage={customError}>
        <ErrorComponent />
      </ErrorBoundary>
    )

    expect(screen.getByTestId('mock-alert')).toBeInTheDocument()
    expect(screen.getByText(customError)).toBeInTheDocument()
  })

  it('should call onError callback when error occurs', () => {
    const onError = jest.fn()
    const error = new Error('Test error')
    const ErrorComponent = () => {
      throw error
    }

    render(
      <ErrorBoundary onError={onError}>
        <ErrorComponent />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalledWith(error)
  })
}) 
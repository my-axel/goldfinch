/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react'
import { LoadingState } from '../LoadingState'

// Mock dependencies
jest.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="mock-loader" />
}))

describe('LoadingState', () => {
  it('should render with default message', () => {
    render(<LoadingState />)
    
    const container = screen.getByRole('status')
    expect(container).toBeInTheDocument()
    expect(container).toHaveAttribute('aria-live', 'polite')
    expect(container).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center', 'min-h-[200px]', 'space-y-4')
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.getByTestId('mock-loader')).toBeInTheDocument()
  })

  it('should render with custom message', () => {
    const customMessage = 'Custom loading message'
    render(<LoadingState message={customMessage} />)
    
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(customMessage)).toBeInTheDocument()
    expect(screen.getByTestId('mock-loader')).toBeInTheDocument()
  })

  it('should render with custom className', () => {
    const customClass = 'custom-class'
    render(<LoadingState className={customClass} />)
    
    const container = screen.getByRole('status')
    expect(container).toHaveClass(customClass)
  })

  it('should merge custom className with default classes', () => {
    const customClass = 'custom-class'
    render(<LoadingState className={customClass} />)
    
    const container = screen.getByRole('status')
    expect(container).toHaveClass(
      'flex',
      'flex-col',
      'items-center',
      'justify-center',
      'min-h-[200px]',
      'space-y-4',
      customClass
    )
  })
}) 
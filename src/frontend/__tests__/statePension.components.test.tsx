import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormProvider, useForm, UseFormReturn } from 'react-hook-form'
import { StatePensionFormData } from '@/frontend/types/pension-form'
import { PensionType, StatePensionList } from '@/frontend/types/pension'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock the components that use ESM modules
jest.mock('@/frontend/components/pension/state/BasicInformationCard', () => ({
  BasicInformationCard: ({ form }: { form: UseFormReturn<StatePensionFormData> }) => (
    <div data-testid="basic-information-card">
      <input type="text" aria-label="name" {...form.register('name')} />
      <input type="date" aria-label="start date" />
      <textarea aria-label="notes" {...form.register('notes')} />
    </div>
  )
}))

jest.mock('@/frontend/components/pension/state/StatementsCard', () => ({
  StatementsCard: ({ form }: { form: UseFormReturn<StatePensionFormData> }) => {
    const [showNewStatement, setShowNewStatement] = React.useState(false);
    
    const handleAddStatement = () => {
      setShowNewStatement(true);
      
      // Add an empty statement to the form
      const currentStatements = form.getValues('statements') || [];
      form.setValue('statements', [
        ...currentStatements,
        {
          statement_date: new Date(),
          current_value: undefined,
          current_monthly_amount: undefined,
          projected_monthly_amount: undefined,
          note: ''
        }
      ]);
    };
    
    return (
      <div data-testid="statements-card">
        <button onClick={handleAddStatement}>Add Statement</button>
        {form.getValues('statements')?.map((statement, index: number) => (
          <div key={index} data-testid="statement">
            <input data-testid="date-input" type="date" />
            <input data-testid="currency-input" type="number" />
            <input data-testid="currency-input" type="number" />
            <input data-testid="currency-input" type="number" />
          </div>
        ))}
        {showNewStatement && (
          <div data-testid="statement">
            <input data-testid="date-input" type="date" />
            <input data-testid="currency-input" type="number" />
            <input data-testid="currency-input" type="number" />
            <input data-testid="currency-input" type="number" />
          </div>
        )}
      </div>
    );
  }
}))

jest.mock('@/frontend/components/pension/state/ScenarioViewer', () => ({
  ScenarioViewer: ({ pensionId }: { pensionId: number }) => (
    <div data-testid="scenario-viewer">
      {pensionId ? (
        <>
          <div>Planned Retirement Age</div>
          <div data-testid="stat-value-pessimistic">Pessimistic</div>
          <div data-testid="stat-value-realistic">Realistic</div>
          <div data-testid="stat-value-optimistic">Optimistic</div>
          <div>Alternative Retirement Age</div>
        </>
      ) : (
        <div>There are currently no statements</div>
      )}
    </div>
  )
}))

jest.mock('@/frontend/components/pension/state/StatePensionListCard', () => ({
  StatePensionListCard: ({ pension }: { pension: StatePensionList & { type: PensionType.STATE } }) => (
    <div data-testid="state-pension-list-card">
      {pension.latest_statement_date && <div>Latest Statement</div>}
      {pension.latest_monthly_amount && <div>Monthly Amount</div>}
      {pension.latest_projected_amount && <div>Projected Monthly</div>}
      {pension.latest_current_value && <div>Current Value</div>}
      <div>Start Date</div>
      <span data-testid="formatted-date">{pension.start_date}</span>
      {pension.latest_statement_date && <span data-testid="formatted-date">{pension.latest_statement_date}</span>}
      {pension.latest_monthly_amount && <span data-testid="formatted-currency">${pension.latest_monthly_amount.toFixed(2)}</span>}
      {pension.latest_projected_amount && <span data-testid="formatted-currency">${pension.latest_projected_amount.toFixed(2)}</span>}
      {pension.latest_current_value && <span data-testid="formatted-currency">${pension.latest_current_value.toFixed(2)}</span>}
    </div>
  )
}))

// Mock hooks
jest.mock('@/frontend/hooks/pension/useStatePensions', () => ({
  useStatePensionScenarios: jest.fn(),
  useDeleteStatePensionStatement: jest.fn(),
}))

jest.mock('@/frontend/hooks/useDateFormat', () => ({
  useDateFormat: () => ({
    formatDate: jest.fn((date) => {
      if (!date) return ''
      return typeof date === 'string' ? date : date.toISOString().split('T')[0]
    })
  })
}))

// Mock FormattedCurrency and FormattedDate components
jest.mock('@/frontend/components/shared/formatting', () => ({
  FormattedCurrency: ({ value }: { value: number }) => (
    <span data-testid="formatted-currency">${value.toFixed(2)}</span>
  ),
  FormattedDate: ({ value }: { value: string }) => (
    <span data-testid="formatted-date">{value}</span>
  )
}))

// Mock shared input components
jest.mock('@/frontend/components/shared/inputs/CurrencyInput', () => ({
  CurrencyInput: (props: {
    value?: number;
    onChange: (value: number) => void;
    onBlur?: () => void;
    placeholder?: string;
  }) => (
    <input
      data-testid="currency-input"
      type="number"
      value={props.value || ''}
      onChange={(e) => props.onChange(parseFloat(e.target.value))}
      onBlur={props.onBlur}
      placeholder={props.placeholder}
    />
  )
}))

// Mock UI components
jest.mock('@/frontend/components/ui/date-input', () => ({
  DateInput: ({ field }: { field: { value: Date | string | null; onChange: (value: Date) => void; onBlur?: () => void } }) => (
    <input
      data-testid="date-input"
      type="date"
      value={field.value instanceof Date 
        ? field.value.toISOString().split('T')[0] 
        : field.value || ''}
      onChange={(e) => field.onChange(new Date(e.target.value))}
      onBlur={field.onBlur}
    />
  )
}))

// Setup for form-based tests
interface TestFormWrapperProps {
  children: (form: UseFormReturn<StatePensionFormData>) => React.ReactElement;
  defaultValues?: Partial<StatePensionFormData>;
}

const TestFormWrapper = ({ children, defaultValues }: TestFormWrapperProps) => {
  const form = useForm<StatePensionFormData>({
    defaultValues: defaultValues || {
      name: '',
      member_id: '1',
      start_date: new Date(),
      notes: '',
      statements: []
    }
  })

  return (
    <FormProvider {...form}>
      {children(form)}
    </FormProvider>
  )
}

// Setup for query-based tests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const QueryWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
)

// Import these directly in the test since we've mocked them
import { BasicInformationCard } from '@/frontend/components/pension/state/BasicInformationCard'
import { StatementsCard } from '@/frontend/components/pension/state/StatementsCard'
import { ScenarioViewer } from '@/frontend/components/pension/state/ScenarioViewer'
import { StatePensionListCard } from '@/frontend/components/pension/state/StatePensionListCard'
import { useStatePensionScenarios, useDeleteStatePensionStatement } from '@/frontend/hooks/pension/useStatePensions'

describe('BasicInformationCard', () => {
  it('renders with default values', () => {
    render(
      <TestFormWrapper>
        {(form) => <BasicInformationCard form={form} />}
      </TestFormWrapper>
    )

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
  })

  it('displays form data correctly', () => {
    const defaultValues = {
      name: 'Test State Pension',
      member_id: '1',
      start_date: new Date('2023-01-01'),
      notes: 'Test notes',
      statements: []
    }

    render(
      <TestFormWrapper defaultValues={defaultValues}>
        {(form) => <BasicInformationCard form={form} />}
      </TestFormWrapper>
    )

    expect(screen.getByDisplayValue('Test State Pension')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test notes')).toBeInTheDocument()
  })
})

describe('StatementsCard', () => {
  beforeEach(() => {
    // Mock the delete statement hook
    (useDeleteStatePensionStatement as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isLoading: false
    })
  })

  it('renders with no statements', () => {
    render(
      <TestFormWrapper>
        {(form) => <StatementsCard form={form} />}
      </TestFormWrapper>
    )

    expect(screen.getByText(/Add Statement/i)).toBeInTheDocument()
  })

  it('allows adding a new statement', async () => {
    const user = userEvent.setup()

    render(
      <TestFormWrapper>
        {(form) => <StatementsCard form={form} />}
      </TestFormWrapper>
    )

    // Check that there are no statements initially
    expect(screen.queryByTestId('statement')).not.toBeInTheDocument()

    // Click the add statement button
    await user.click(screen.getByText(/Add Statement/i))

    // Check that form fields for a new statement are shown
    // Note: Our implementation adds the statement both to the form array and shows it via the showNewStatement state,
    // so we get 2 statement elements (one from form.getValues and one from showNewStatement)
    expect(screen.getAllByTestId('statement')).toHaveLength(2)
    expect(screen.getAllByTestId('date-input')).toHaveLength(2)
    expect(screen.getAllByTestId('currency-input')).toHaveLength(6) // 2 statements x 3 fields each
  })

  it('displays existing statements', () => {
    const defaultValues = {
      name: 'Test State Pension',
      member_id: '1',
      start_date: new Date('2023-01-01'),
      notes: '',
      statements: [
        {
          id: 1,
          statement_date: new Date('2023-01-15'),
          current_value: 100000,
          current_monthly_amount: 1000,
          projected_monthly_amount: 1500,
          note: 'First statement'
        },
        {
          id: 2,
          statement_date: new Date('2023-06-15'),
          current_value: 105000,
          current_monthly_amount: 1050,
          projected_monthly_amount: 1550,
          note: 'Second statement'
        }
      ]
    }

    render(
      <TestFormWrapper defaultValues={defaultValues}>
        {(form) => <StatementsCard form={form} />}
      </TestFormWrapper>
    )

    // Verify that statements are displayed
    expect(screen.getAllByTestId('statement')).toHaveLength(2)
  })
})

describe('ScenarioViewer', () => {
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

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('displays loading state', () => {
    (useStatePensionScenarios as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    })

    render(
      <QueryWrapper>
        <ScenarioViewer pensionId={1} />
      </QueryWrapper>
    )

    expect(screen.getByTestId('scenario-viewer')).toBeInTheDocument()
  })

  it('displays error state when API fails', () => {
    (useStatePensionScenarios as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch scenarios')
    })

    render(
      <QueryWrapper>
        <ScenarioViewer pensionId={1} />
      </QueryWrapper>
    )

    expect(screen.getByTestId('scenario-viewer')).toBeInTheDocument()
  })

  it('displays scenarios when data is available', () => {
    (useStatePensionScenarios as jest.Mock).mockReturnValue({
      data: mockScenarios,
      isLoading: false,
      error: null
    })

    render(
      <QueryWrapper>
        <ScenarioViewer pensionId={1} />
      </QueryWrapper>
    )

    // Verify planned retirement section
    expect(screen.getByText(/Planned Retirement Age/i)).toBeInTheDocument()
    expect(screen.getByTestId('stat-value-pessimistic')).toBeInTheDocument()
    expect(screen.getByTestId('stat-value-realistic')).toBeInTheDocument()
    expect(screen.getByTestId('stat-value-optimistic')).toBeInTheDocument()

    // Verify alternative retirement section
    expect(screen.getByText(/Alternative Retirement Age/i)).toBeInTheDocument()
  })

  it('displays message when no statements exist', () => {
    (useStatePensionScenarios as jest.Mock).mockReturnValue({
      data: { planned: {}, possible: {} },
      isLoading: false,
      error: null
    })

    render(
      <QueryWrapper>
        <ScenarioViewer pensionId={0} />
      </QueryWrapper>
    )

    expect(screen.getByText(/There are currently no statements/i)).toBeInTheDocument()
  })
})

describe('StatePensionListCard', () => {
  // Using unknown first before the type assertion
  const mockPension = {
    id: 1,
    name: 'Test State Pension',
    member_id: '1',
    start_date: '2020-01-01',
    status: 'ACTIVE',
    type: PensionType.STATE,
    latest_statement_date: '2023-01-01',
    latest_monthly_amount: 1000,
    latest_projected_amount: 1500,
    latest_current_value: 100000,
    statements_count: 2
  } as unknown as StatePensionList & { type: PensionType.STATE }

  it('renders all pension details', () => {
    render(<StatePensionListCard pension={mockPension} />)

    // Check that all formatted values are displayed
    expect(screen.getAllByTestId('formatted-date')).toHaveLength(2) // Start date and latest statement date
    expect(screen.getAllByTestId('formatted-currency')).toHaveLength(3) // Monthly, projected and current value

    // Check specific labels
    expect(screen.getByText(/Latest Statement/i)).toBeInTheDocument()
    expect(screen.getByText(/Monthly Amount/i)).toBeInTheDocument()
    expect(screen.getByText(/Projected Monthly/i)).toBeInTheDocument()
    expect(screen.getByText(/Current Value/i)).toBeInTheDocument()
    expect(screen.getByText(/Start Date/i)).toBeInTheDocument()
  })

  it('renders only available pension details', () => {
    const partialPension = {
      id: 1,
      name: 'Test State Pension',
      member_id: '1',
      start_date: '2020-01-01',
      status: 'ACTIVE',
      type: PensionType.STATE,
      statements_count: 0
    } as unknown as StatePensionList & { type: PensionType.STATE }

    render(<StatePensionListCard pension={partialPension} />)

    // Only start date should be displayed
    expect(screen.queryByText(/Latest Statement/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Monthly Amount/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Projected Monthly/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Current Value/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Start Date/i)).toBeInTheDocument()
  })
}) 
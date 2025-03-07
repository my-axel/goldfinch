/**
 * Pension Context - Type Definitions
 * 
 * This file contains all type definitions for the Pension Context system.
 * It serves as the central place for defining the shape of the context
 * and the types of operations it provides.
 * 
 * Key Types:
 * ---------
 * - PensionContribution: Represents a contribution to a pension
 * - PensionContextType: The main interface for the pension context
 * 
 * How to Add a New Operation:
 * -------------------------
 * 1. Add the operation signature to the PensionContextType interface
 * 2. Implement the operation in the appropriate file
 * 3. Initialize and use the operation in index.tsx
 * 
 * Type Naming Conventions:
 * ----------------------
 * - Use descriptive names that indicate the purpose of the type
 * - Use PascalCase for type names
 * - Use camelCase for function and property names
 * - Use descriptive parameter names
 */

import { Pension } from "@/frontend/types/pension"
import { PensionType, ETFPension, InsurancePension, CompanyPension, PensionCompanyStatement } from "@/frontend/types/pension"

import { PensionStatistics, PensionStatusUpdate } from "@/frontend/types/pension-statistics"

/**
 * Represents a contribution to a pension
 */
export interface PensionContribution {
    id: number
    pension_id: number
    date: string
    amount: number
    planned_amount: number
    is_manual_override: boolean
    note?: string
  }
  
/**
 * The main interface for the pension context
 * This interface defines all operations and state available in the context
 */
export interface PensionContextType {
isLoading: boolean
error: string | null
pensions: Pension[]
selectedPension: Pension | null
fetchPensions: (memberId?: number) => Promise<void>
fetchPension: (id: number, pensionType?: PensionType) => Promise<void>
createEtfPension: (pension: Omit<ETFPension, 'id' | 'current_value'>) => Promise<void>
createInsurancePension: (pension: Omit<InsurancePension, 'id' | 'current_value'>) => Promise<InsurancePension>
createInsurancePensionWithStatement: (
    pension: Omit<InsurancePension, 'id' | 'current_value'>,
    statements: Array<{
    statement_date: string,
    value: number,
    total_contributions: number,
    total_benefits: number,
    costs_amount: number,
    costs_percentage: number,
    note?: string,
    projections?: Array<{
        scenario_type: 'with_contributions' | 'without_contributions',
        return_rate: number,
        value_at_retirement: number,
        monthly_payout: number
    }>
    }>
) => Promise<void>
createCompanyPension: (pension: Omit<CompanyPension, 'id' | 'current_value'>) => Promise<CompanyPension>
createCompanyPensionWithStatement: (
    pension: Omit<CompanyPension, 'id' | 'current_value'>,
    statement: {
    statement_date: string,
    value: number,
    note?: string,
    retirement_projections?: Array<{
        retirement_age: number,
        monthly_payout: number,
        total_capital: number
    }>
    }
) => Promise<void>
updateEtfPension: (id: number, pension: Omit<ETFPension, 'id' | 'current_value'>) => Promise<void>
updateInsurancePension: (id: number, pension: Omit<InsurancePension, 'id' | 'current_value'>) => Promise<void>
updateCompanyPension: (id: number, pension: Omit<CompanyPension, 'id' | 'current_value'>) => Promise<void>
updateCompanyPensionWithStatement: (
    id: number, 
    pension: Omit<CompanyPension, 'id' | 'current_value'>,
    statements: Array<{
    id: number,
    statement_date: string,
    value: number,
    note?: string,
    retirement_projections?: Array<{
        id?: number,
        retirement_age: number,
        monthly_payout: number,
        total_capital: number
    }>
    }>
) => Promise<void>
deletePension: (id: number) => Promise<void>
addOneTimeInvestment: (pensionId: number, data: { 
    amount: number, 
    investment_date: string, 
    note?: string 
}) => Promise<void>
createContributionHistory: (pensionId: number, data: {
    amount: number,
    date: string,
    is_manual: boolean,
    note?: string
}) => Promise<void>
realizeHistoricalContributions: (pensionId: number) => Promise<void>
getPensionStatistics: (pensionId: number) => Promise<PensionStatistics>
updatePensionStatus: (pensionId: number, status: PensionStatusUpdate) => Promise<void>
pensionStatistics: Record<number, PensionStatistics>
isLoadingStatistics: Record<number, boolean>
fetchPensionStatistics: (pensionId: number, pensionType?: PensionType) => Promise<PensionStatistics>
createCompanyPensionStatement: (pensionId: number, data: {
    statement_date: string,
    value: number,
    note?: string,
    retirement_projections?: Array<{
    retirement_age: number,
    monthly_payout: number,
    total_capital: number
    }>
}) => Promise<void>
getCompanyPensionStatements: (pensionId: number) => Promise<PensionCompanyStatement[]>
getLatestCompanyPensionStatement: (pensionId: number) => Promise<PensionCompanyStatement | null>
getCompanyPensionStatement: (pensionId: number, statementId: number) => Promise<PensionCompanyStatement>
updateCompanyPensionStatement: (pensionId: number, statementId: number, data: {
    statement_date: string,
    value: number,
    note?: string,
    retirement_projections?: Array<{
    retirement_age: number,
    monthly_payout: number,
    total_capital: number
    }>
}) => Promise<void>
deleteCompanyPensionStatement: (pensionId: number, statementId: number) => Promise<void>
deleteInsurancePensionStatement: (pensionId: number, statementId: number) => Promise<void>
updateInsurancePensionWithStatement: (
    id: number,
    pension: Omit<InsurancePension, 'id' | 'current_value'>,
    statements: Array<{
    id: number,
    statement_date: string,
    value: number,
    total_contributions: number,
    total_benefits: number,
    costs_amount: number,
    costs_percentage: number,
    note?: string,
    projections?: Array<{
        id?: number,
        scenario_type: 'with_contributions' | 'without_contributions',
        return_rate: number,
        value_at_retirement: number,
        monthly_payout: number
    }>
    }>
) => Promise<void>
updateInsurancePensionStatement: (
    pensionId: number,
    statementId: number,
    data: {
    statement_date: string,
    value: number,
    total_contributions: number,
    total_benefits: number,
    costs_amount: number,
    costs_percentage: number,
    note?: string,
    projections?: Array<{
        scenario_type: 'with_contributions' | 'without_contributions',
        return_rate: number,
        value_at_retirement: number,
        monthly_payout: number
    }>
    }
) => Promise<void>
}
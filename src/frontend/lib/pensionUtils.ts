import { ETFPensionList } from "@/frontend/types/pension";

/**
 * Check if an ETF pension needs its value calculated.
 * 
 * Returns true if:
 * - It's an ETF pension
 * - It's an existing investment
 * - Has existing units
 * - Current value is 0 or very close to 0 (indicating pending calculation)
 */
export function needsValueCalculation(pension: ETFPensionList): boolean {
  return (
    pension.existing_units !== undefined &&
    pension.existing_units > 0 &&
    (pension.current_value === 0 || 
     Math.abs(pension.current_value) < 0.001) // Handle very small values close to zero
  );
} 
"use client"

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  type UseQueryOptions
} from '@tanstack/react-query'
import { settingsService } from '@/frontend/services/settings'
import { FrontendSettings, Settings } from '@/frontend/types/settings'
import { api } from '@/frontend/lib/api-client'

// Query key factory for settings
const settingsKeys = {
  all: ['settings'] as const,
}

// Convert API settings to frontend settings format
function apiToFrontendSettings(apiSettings: Settings): FrontendSettings {
  return {
    ui_locale: apiSettings.ui_locale,
    number_locale: apiSettings.number_locale,
    currency: apiSettings.currency,
    projection_pessimistic_rate: apiSettings.projection_pessimistic_rate,
    projection_realistic_rate: apiSettings.projection_realistic_rate,
    projection_optimistic_rate: apiSettings.projection_optimistic_rate,
    state_pension_pessimistic_rate: apiSettings.state_pension_pessimistic_rate,
    state_pension_realistic_rate: apiSettings.state_pension_realistic_rate,
    state_pension_optimistic_rate: apiSettings.state_pension_optimistic_rate,
    inflation_rate: apiSettings.inflation_rate,
  }
}

// Type for our query key
type SettingsQueryKey = typeof settingsKeys.all

// Hook to fetch settings
export function useSettings(
  options?: Omit<UseQueryOptions<FrontendSettings, Error, FrontendSettings, SettingsQueryKey>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: async () => {
      const apiSettings = await settingsService.getSettings()
      const frontendSettings = apiToFrontendSettings(apiSettings)
      
      // Update API client locale for number parsing
      api.setLocale(frontendSettings.number_locale)
      
      return frontendSettings
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  })
}

// Mutation hook to update settings
export function useUpdateSettings() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (settings: Partial<FrontendSettings>) => 
      settingsService.updateSettings(settings),
    onSuccess: (updatedApiSettings) => {
      // Convert API response to frontend settings format
      const updatedSettings = apiToFrontendSettings(updatedApiSettings)
      
      // Update the cache with the updated settings
      queryClient.setQueryData(settingsKeys.all, updatedSettings)
      
      // Update API client locale for number parsing
      api.setLocale(updatedSettings.number_locale)
    }
  })
} 
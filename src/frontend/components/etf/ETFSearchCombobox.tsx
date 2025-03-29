"use client"

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/frontend/components/ui/command"
import { Button } from "@/frontend/components/ui/button"
import { Input } from "@/frontend/components/ui/input"
import { cn } from "@/frontend/lib/utils"
import { Check, Search } from "lucide-react"
import { useState } from "react"
import { useETFs, useETFSearch, useYFinanceSearch, useETF } from "@/frontend/hooks/useETF"
import { isYFinanceETF, ETF, YFinanceETF } from "@/frontend/types/etf"
import { useDebounce } from "@/frontend/hooks/useDebounce"

interface ETFSearchComboboxProps {
  value?: string
  onSelect: (etf: { id: string, name: string }) => void
  readOnly?: boolean
}

export function ETFSearchCombobox({ value, onSelect, readOnly = false }: ETFSearchComboboxProps) {
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Use the new React Query hooks
  const { data: specificETF } = useETF(value, { enabled: !!value })
  const { data: etfs = [] } = useETFs()
  
  // Only debounce if we have at least 3 characters
  const shouldSearch = searchTerm.length >= 3
  const debouncedSearchTerm = useDebounce(shouldSearch ? searchTerm : "", 1000)
  
  // Use React Query for database ETF search
  const { data: searchResults = [], isLoading: isSearchLoading } = 
    useETFSearch(debouncedSearchTerm)
  
  // Use React Query for YFinance search
  const { 
    data: yfinanceResults = [], 
    isLoading: isYFinanceLoading
  } = useYFinanceSearch(debouncedSearchTerm)
  
  // Determine if we are currently searching
  const isSearching = isSearchLoading || isYFinanceLoading
  
  // Get the selected ETF details
  const selectedEtf = specificETF || etfs.find(etf => etf.id === value) ||
    (yfinanceResults.find(etf => etf.symbol === value) as YFinanceETF | undefined)

  const displayName = selectedEtf && (
    isYFinanceETF(selectedEtf) 
      ? selectedEtf.longName || selectedEtf.shortName || selectedEtf.symbol
      : (selectedEtf as ETF).name
  )

  return (
    <div className="flex gap-2 relative">
      {!readOnly && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowSearch(!showSearch)}
        >
          <Search className="h-4 w-4" />
        </Button>
      )}
      <Input
        readOnly
        value={selectedEtf ? `${isYFinanceETF(selectedEtf) ? selectedEtf.symbol : (selectedEtf as ETF).symbol} - ${displayName}` : ""}
        placeholder={readOnly ? "" : "Select an ETF..."}
        className="flex-1"
      />

      {showSearch && !readOnly && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-[400px] rounded-md border bg-popover shadow-md">
          <Command>
            <CommandInput
              placeholder="Search ETFs (min. 3 characters)..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              {!shouldSearch ? (
                <CommandEmpty>Enter at least 3 characters to search...</CommandEmpty>
              ) : isSearching ? (
                <CommandEmpty>Searching...</CommandEmpty>
              ) : searchResults.length === 0 && yfinanceResults.length === 0 ? (
                <CommandEmpty>No ETF found.</CommandEmpty>
              ) : (
                <>
                  {searchResults.length > 0 && (
                    <CommandGroup heading="Database Results">
                      {searchResults.map(etf => (
                        <CommandItem
                          key={etf.id}
                          value={etf.id}
                          onSelect={() => {
                            onSelect({ id: etf.id, name: etf.name })
                            setSearchTerm("")
                            setShowSearch(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === etf.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {etf.symbol} - {etf.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {yfinanceResults.length > 0 && (
                    <CommandGroup heading="YFinance Results">
                      {yfinanceResults.map(etf => (
                        <CommandItem
                          key={etf.symbol}
                          value={etf.symbol}
                          onSelect={() => {
                            onSelect({
                              id: etf.symbol,
                              name: etf.longName || etf.shortName || etf.symbol
                            })
                            setSearchTerm("")
                            setShowSearch(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === etf.symbol ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {etf.symbol} - {etf.longName || etf.shortName || etf.symbol}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
} 
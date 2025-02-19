"use client"

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/frontend/components/ui/command"
import { Button } from "@/frontend/components/ui/button"
import { Input } from "@/frontend/components/ui/input"
import { cn } from "@/frontend/lib/utils"
import { Check, Search } from "lucide-react"
import { useState, useEffect } from "react"
import { useETF } from "@/frontend/context/ETFContext"
import { isYFinanceETF, ETF,YFinanceETF } from "@/frontend/types/etf"
import { useDebounce } from "@/frontend/hooks/useDebounce"

interface ETFSearchComboboxProps {
  value?: string
  onSelect: (etf: { id: string, name: string }) => void
  readOnly?: boolean
}

export function ETFSearchCombobox({ value, onSelect, readOnly = false }: ETFSearchComboboxProps) {
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [yfinanceResults, setYfinanceResults] = useState<YFinanceETF[]>([])
  const [selectedYFinanceETF, setSelectedYFinanceETF] = useState<YFinanceETF | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const { etfs, isLoading, error } = useETF()
  
  // Only debounce if we have at least 3 characters
  const shouldSearch = searchTerm.length >= 3
  const debouncedSearchTerm = useDebounce(shouldSearch ? searchTerm : "", 1000)
    
  useEffect(() => {
    if (value) {
      const foundInDB = etfs.find(etf => etf.id === value)
      if (foundInDB) return
      
      // If not found in DB and we don't have it in state, search YFinance
      if (!selectedYFinanceETF || selectedYFinanceETF.symbol !== value) {
        const controller = new AbortController();
        
        const searchYFinance = async () => {
          try {
            const response = await fetch(
              `/api/v1/etf/search?query=${encodeURIComponent(value)}`,
              { signal: controller.signal }
            )
            if (!response.ok) {
              if (response.status === 429) {
                console.error('Rate limit reached, please try again later')
                return
              }
              throw new Error(`HTTP error! status: ${response.status}`)
            }
            const [yfinanceData] = await response.json()
            if (yfinanceData && yfinanceData.symbol === value) {
              setSelectedYFinanceETF(yfinanceData)
            }
          } catch (error: unknown) {
            if (error instanceof Error && error.name === 'AbortError') return
            console.error('Error fetching YFinance ETF:', error)
          }
        }
        searchYFinance()
        return () => controller.abort()
      }
    }
  }, [value, etfs, selectedYFinanceETF])

  const selectedEtf = etfs.find(etf => etf.id === value) || 
    (value === selectedYFinanceETF?.symbol ? selectedYFinanceETF : null)

  useEffect(() => {
    // Only search if we have a debounced term (which means we had >= 3 chars)
    if (!debouncedSearchTerm) {
      setYfinanceResults([])
      return
    }

    const controller = new AbortController();
    let isActive = true

    const searchETFs = async () => {
      if (!isActive) return

      setIsSearching(true)
      try {
        const response = await fetch(
          `/api/v1/etf/search?query=${encodeURIComponent(debouncedSearchTerm)}`,
          { signal: controller.signal }
        )
        
        if (!response.ok) {
          if (response.status === 429) {
            console.error('Rate limit reached, please try again later')
            setYfinanceResults([])
            return
          }
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        if (!isActive) return
        
        const data = await response.json()
        if (isActive && Array.isArray(data)) {
          setYfinanceResults(data)
        } else {
          setYfinanceResults([])
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return
        console.error('Error fetching ETFs:', error)
        if (isActive) {
          setYfinanceResults([])
        }
      } finally {
        if (isActive) {
          setIsSearching(false)
        }
      }
    }

    searchETFs()
    return () => { 
      isActive = false
      controller.abort()
    }
  }, [debouncedSearchTerm])

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
        value={selectedEtf ? `${selectedEtf.symbol} - ${displayName}` : ""}
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
              ) : (isLoading || isSearching) ? (
                <CommandEmpty>Searching...</CommandEmpty>
              ) : error ? (
                <CommandEmpty>Error loading ETFs.</CommandEmpty>
              ) : etfs.length === 0 && yfinanceResults.length === 0 ? (
                <CommandEmpty>No ETF found.</CommandEmpty>
              ) : (
                <>
                  {etfs.length > 0 && (
                    <CommandGroup heading="Database Results">
                      {etfs.map(etf => (
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
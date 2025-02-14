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
}

export function ETFSearchCombobox({ value, onSelect }: ETFSearchComboboxProps) {
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [yfinanceResults, setYfinanceResults] = useState<YFinanceETF[]>([])
  const [selectedYFinanceETF, setSelectedYFinanceETF] = useState<YFinanceETF | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const { etfs, isLoading, error } = useETF()
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
    
  useEffect(() => {
    if (value) {
      const foundInDB = etfs.find(etf => etf.id === value)
      if (foundInDB) return // If found in DB, no need to set YFinance ETF
      
      // If not found in DB and we don't have it in state, search YFinance
      if (!selectedYFinanceETF || selectedYFinanceETF.symbol !== value) {
        const searchYFinance = async () => {
          try {
            const response = await fetch(`/api/v1/etf/search?query=${encodeURIComponent(value)}`)
            const [yfinanceData] = await response.json()
            if (yfinanceData && yfinanceData.symbol === value) {
              setSelectedYFinanceETF(yfinanceData)
            }
          } catch (error) {
            console.error('Error fetching YFinance ETF:', error)
          }
        }
        searchYFinance()
      }
    }
  }, [value, etfs, selectedYFinanceETF])

  const selectedEtf = etfs.find(etf => etf.id === value) || 
    (value === selectedYFinanceETF?.symbol ? selectedYFinanceETF : null)

  useEffect(() => {
    let isActive = true

    if (debouncedSearchTerm.length < 2) {
      setYfinanceResults([])
      return
    }

    const searchETFs = async () => {
      if (!isActive) return

      setIsSearching(true)
      try {
        const response = await fetch(`/api/v1/etf/search?query=${encodeURIComponent(debouncedSearchTerm)}`)
        if (!response.ok || !isActive) {
          setYfinanceResults([])
          return
        }
        
        const data = await response.json()
        if (isActive && Array.isArray(data)) {
          setYfinanceResults(data)
        } else {
          setYfinanceResults([])
        }
      } catch (err) {
        console.error('Error fetching ETFs:', err)
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
    return () => { isActive = false }
  }, [debouncedSearchTerm])

  const displayName = selectedEtf && (
    isYFinanceETF(selectedEtf) 
      ? selectedEtf.longName || selectedEtf.shortName || selectedEtf.symbol
      : (selectedEtf as ETF).name
  )

  return (
    <div className="flex gap-2 relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setShowSearch(!showSearch)}
      >
        <Search className="h-4 w-4" />
      </Button>
      <Input
        readOnly
        value={selectedEtf ? `${selectedEtf.symbol} - ${displayName}` : ""}
        placeholder="Select an ETF..."
        className="flex-1"
      />

      {showSearch && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-[400px] rounded-md border bg-popover shadow-md">
          <Command>
            <CommandInput
              placeholder="Search ETFs..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              {(isLoading || isSearching) ? (
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
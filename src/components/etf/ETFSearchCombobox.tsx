"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { mockEtfs } from "@/data/mockData"

interface ETF {
  id: string
  symbol: string
  name: string
  isin?: string
}

interface ETFSearchComboboxProps {
  value?: string
  onSelect: (etf: ETF) => void
}

export function ETFSearchCombobox({ value, onSelect }: ETFSearchComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
  const selectedEtf = value ? mockEtfs.find(etf => etf.id === value) : undefined
  const filteredEtfs = mockEtfs.filter(etf => 
    etf.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    etf.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Command className="border rounded-md">
      <CommandInput
        placeholder={selectedEtf ? `${selectedEtf.symbol} - ${selectedEtf.name}` : "Search ETFs..."}
        value={searchTerm}
        onValueChange={setSearchTerm}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {open && (
        <CommandList>
          {filteredEtfs.length === 0 ? (
            <CommandEmpty>No ETF found.</CommandEmpty>
          ) : (
            <CommandGroup>
              {filteredEtfs.map((etf) => (
                <CommandItem
                  key={etf.id}
                  value={etf.id}
                  onSelect={() => {
                    onSelect(etf)
                    setSearchTerm("")
                    setOpen(false)
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
        </CommandList>
      )}
    </Command>
  )
} 
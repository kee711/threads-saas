// components/ui/ReusableDropdown.tsx
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

type DropdownItem = {
  label: string
  onClick: () => void
}

type ReusableDropdownProps = {
  items: DropdownItem[]
  initialLabel?: string
}

export function ReusableDropdown({ items, initialLabel = 'format' }: ReusableDropdownProps) {
  const [selectedLabel, setSelectedLabel] = useState<string>(initialLabel)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <span>{selectedLabel}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => {
              setSelectedLabel(item.label)
              item.onClick()
            }}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
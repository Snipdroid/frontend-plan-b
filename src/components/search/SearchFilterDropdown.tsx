import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { SearchFilterType } from "@/types"

interface FilterOption {
  type: SearchFilterType
  label: string
  description: string
}

const FILTER_OPTIONS: FilterOption[] = [
  {
    type: "byName",
    label: "By Name",
    description: "Search by app name",
  },
  {
    type: "byPackageName",
    label: "By Package Name",
    description: "Search by package name",
  },
  {
    type: "byMainActivity",
    label: "By Main Activity",
    description: "Search by main activity",
  },
]

interface SearchFilterDropdownProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  disabledTypes: SearchFilterType[]
  onSelect: (type: SearchFilterType) => void
  highlightedIndex: number
  children: React.ReactNode
}

export function SearchFilterDropdown({
  open,
  onOpenChange,
  disabledTypes,
  onSelect,
  highlightedIndex,
  children,
}: SearchFilterDropdownProps) {
  const availableOptions = FILTER_OPTIONS.filter(
    (opt) => !disabledTypes.includes(opt.type)
  )

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>{children}</PopoverAnchor>
      <PopoverContent
        className="w-64 p-1"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="text-xs font-medium text-muted-foreground px-2 py-1.5">
          Filter by
        </div>
        {availableOptions.map((option, index) => (
          <div
            key={option.type}
            onClick={() => onSelect(option.type)}
            className={cn(
              "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
              "hover:bg-accent hover:text-accent-foreground",
              highlightedIndex === index && "bg-accent text-accent-foreground"
            )}
          >
            <div>
              <div className="font-medium">{option.label}</div>
              <div className="text-xs text-muted-foreground">
                {option.description}
              </div>
            </div>
          </div>
        ))}
        {availableOptions.length === 0 && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            All filters applied
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export { FILTER_OPTIONS }

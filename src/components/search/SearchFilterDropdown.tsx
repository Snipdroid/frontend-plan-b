import { useTranslation } from "react-i18next"
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { FILTER_OPTIONS } from "./utils"
import type { SearchFilterType } from "@/types"

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
  const { t } = useTranslation()
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
          {t("search.filterBy")}
        </div>
        {availableOptions.map((option, index) => (
          <div
            key={option.type}
            onClick={() => onSelect(option.type)}
            className={cn(
              "group relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
              "hover:bg-accent hover:text-accent-foreground",
              highlightedIndex === index && "bg-accent text-accent-foreground"
            )}
          >
            <div>
              <div className="font-medium">{t(option.labelKey)}</div>
              <div className={cn(
                "text-xs text-muted-foreground",
                "group-hover:text-accent-foreground",
                highlightedIndex === index && "text-accent-foreground"
              )}>
                {t(option.descriptionKey)}
              </div>
            </div>
          </div>
        ))}
        {availableOptions.length === 0 && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {t("search.allFiltersApplied")}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

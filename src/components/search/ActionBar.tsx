import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ExportButtonGroup } from "./ExportButtonGroup"
import type { SortOption, AppInfo } from "@/types"

interface ActionBarProps {
  selectedApps: AppInfo[]
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
  onCopySelected: () => void
}

export function ActionBar({
  selectedApps,
  sortBy,
  onSortChange,
  onCopySelected,
}: ActionBarProps) {
  const selectedCount = selectedApps.length

  return (
    <div className="sticky top-0 z-10 bg-background py-3 border-b mb-4">
      <div className="flex justify-end items-center gap-2">
        {selectedCount > 0 && (
          <Badge variant="secondary">{selectedCount} selected</Badge>
        )}
        <ExportButtonGroup
          apps={selectedApps}
          disabled={selectedCount === 0}
          onCopy={onCopySelected}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup
              value={sortBy}
              onValueChange={(value) => onSortChange(value as SortOption)}
            >
              <DropdownMenuRadioItem value="relevance">
                Relevance
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="count">Count</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

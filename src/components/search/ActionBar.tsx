import { Copy, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { SortOption } from "@/types"

interface ActionBarProps {
  selectedCount: number
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
  onCopySelected: () => void
}

export function ActionBar({
  selectedCount,
  sortBy,
  onSortChange,
  onCopySelected,
}: ActionBarProps) {
  return (
    <div className="sticky top-0 z-10 bg-background py-3 border-b mb-4">
      <div className="flex justify-end items-center gap-2">
        {selectedCount > 0 && (
          <Badge variant="secondary">{selectedCount} selected</Badge>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={selectedCount === 0}
          onClick={onCopySelected}
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </Button>
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

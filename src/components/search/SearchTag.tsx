import { forwardRef } from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { SearchTag as SearchTagType, SearchFilterType } from "@/types"

interface SearchTagProps {
  tag: SearchTagType
  onRemove: (type: SearchFilterType) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  isFocused?: boolean
}

export const SearchTag = forwardRef<HTMLDivElement, SearchTagProps>(
  ({ tag, onRemove, onKeyDown, isFocused }, ref) => {
    return (
      <Badge
        ref={ref}
        variant="secondary"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Backspace" || e.key === "Delete") {
            e.preventDefault()
            onRemove(tag.type)
          }
          onKeyDown?.(e)
        }}
        className={cn(
          "gap-1 pr-1 cursor-default select-none",
          isFocused && "ring-2 ring-ring ring-offset-1"
        )}
      >
        <span className="text-muted-foreground">{tag.displayLabel}:</span>
        <span>{tag.value}</span>
        <button
          type="button"
          tabIndex={-1}
          onClick={() => onRemove(tag.type)}
          className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
          aria-label={`Remove ${tag.displayLabel} filter`}
        >
          <X className="h-3 w-3" />
        </button>
      </Badge>
    )
  }
)

SearchTag.displayName = "SearchTag"

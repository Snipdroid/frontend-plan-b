import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PageMetadata } from "@/types"

interface AppInfoTablePaginationProps {
  metadata: PageMetadata
  onPageChange: (page: number) => void
  isLoading?: boolean
}

export function AppInfoTablePagination({
  metadata,
  onPageChange,
  isLoading,
}: AppInfoTablePaginationProps) {
  const { page, per, total } = metadata
  const totalPages = Math.ceil(total / per)
  const startItem = (page - 1) * per + 1
  const endItem = Math.min(page * per, total)

  if (total === 0) return null

  return (
    <div className="flex items-center justify-between py-4">
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {total} results
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

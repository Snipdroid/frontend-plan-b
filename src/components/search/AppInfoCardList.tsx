import { Skeleton } from "@/components/ui/skeleton"
import { AppInfoCard } from "./AppInfoCard"
import type { AppInfo } from "@/types"

function getRowKey(app: AppInfo): string {
  return `${app.packageName}-${app.mainActivity}`
}

interface AppInfoCardListProps {
  data: AppInfo[]
  isLoading?: boolean
  selectedIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
  onCardClick: (app: AppInfo) => void
}

function LoadingCards() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4">
          {/* Desktop skeleton */}
          <div className="hidden md:flex md:items-center md:gap-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-4 w-32" />
            <div className="flex flex-col gap-1 ml-auto">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          {/* Mobile skeleton */}
          <div className="flex flex-col gap-2 md:hidden">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      ))}
    </>
  )
}

export function AppInfoCardList({
  data,
  isLoading,
  selectedIds,
  onSelectionChange,
  onCardClick,
}: AppInfoCardListProps) {
  const handleToggleRow = (app: AppInfo) => {
    const key = getRowKey(app)
    const newSelected = new Set(selectedIds)
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    onSelectionChange(newSelected)
  }

  if (isLoading && data.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <LoadingCards />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        No results found
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map((app) => (
        <AppInfoCard
          key={getRowKey(app)}
          app={app}
          isSelected={selectedIds.has(getRowKey(app))}
          onToggle={() => handleToggleRow(app)}
          onClick={() => onCardClick(app)}
        />
      ))}
    </div>
  )
}

export { getRowKey }

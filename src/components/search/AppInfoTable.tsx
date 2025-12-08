import { useState } from "react"
import { ArrowUp } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { useLocalizedName } from "@/hooks"
import { API_BASE_URL } from "@/services/api"
import type { AppInfo, SortOption } from "@/types"

function getAppIconUrl(packageName: string): string {
  const base = API_BASE_URL || ""
  return `${base}/app-icon?packageName=${encodeURIComponent(packageName)}`
}

function getRowKey(app: AppInfo): string {
  return `${app.packageName}-${app.mainActivity}`
}

interface AppInfoTableProps {
  data: AppInfo[]
  isLoading?: boolean
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
  selectedIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
}

function AppInfoRow({
  app,
  isSelected,
  onToggle,
}: {
  app: AppInfo
  isSelected: boolean
  onToggle: () => void
}) {
  const displayName = useLocalizedName(app.localizedNames)
  const [iconError, setIconError] = useState(false)

  return (
    <TableRow>
      <TableCell className="w-10">
        <Checkbox checked={isSelected} onCheckedChange={onToggle} />
      </TableCell>
      <TableCell>
        {iconError ? (
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">
            ?
          </div>
        ) : (
          <img
            src={getAppIconUrl(app.packageName)}
            alt={`${displayName} icon`}
            className="h-10 w-10 rounded-lg object-cover"
            onError={() => setIconError(true)}
          />
        )}
      </TableCell>
      <TableCell className="font-medium">{displayName}</TableCell>
      <TableCell className="font-mono text-sm">{app.packageName}</TableCell>
      <TableCell className="font-mono text-sm">{app.mainActivity}</TableCell>
      <TableCell className="text-right tabular-nums">
        {app.count ?? "-"}
      </TableCell>
    </TableRow>
  )
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-4" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-48" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-40" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-8 ml-auto" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

export function AppInfoTable({
  data,
  isLoading,
  sortBy,
  onSortChange,
  selectedIds,
  onSelectionChange,
}: AppInfoTableProps) {
  const allSelected = data.length > 0 && data.every((app) => selectedIds.has(getRowKey(app)))
  const someSelected = data.some((app) => selectedIds.has(getRowKey(app)))

  const handleSelectAll = () => {
    if (allSelected) {
      const newSelected = new Set(selectedIds)
      data.forEach((app) => newSelected.delete(getRowKey(app)))
      onSelectionChange(newSelected)
    } else {
      const newSelected = new Set(selectedIds)
      data.forEach((app) => newSelected.add(getRowKey(app)))
      onSelectionChange(newSelected)
    }
  }

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

  const handleSortClick = () => {
    onSortChange(sortBy === "count" ? "relevance" : "count")
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
                {...(someSelected && !allSelected ? { "data-state": "indeterminate" } : {})}
              />
            </TableHead>
            <TableHead className="w-16">Icon</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Package Name</TableHead>
            <TableHead>Main Activity</TableHead>
            <TableHead
              className="text-right cursor-pointer select-none hover:bg-muted/50"
              onClick={handleSortClick}
            >
              <span className="inline-flex items-center gap-1">
                Count
                {sortBy === "count" && <ArrowUp className="h-4 w-4" />}
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && data.length === 0 ? (
            <LoadingRows />
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No results found
              </TableCell>
            </TableRow>
          ) : (
            data.map((app) => (
              <AppInfoRow
                key={getRowKey(app)}
                app={app}
                isSelected={selectedIds.has(getRowKey(app))}
                onToggle={() => handleToggleRow(app)}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

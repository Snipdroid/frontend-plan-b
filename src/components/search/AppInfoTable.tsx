import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useLocalizedName } from "@/hooks"
import { API_BASE_URL } from "@/services/api"
import type { AppInfo } from "@/types"

function getAppIconUrl(packageName: string): string {
  const base = API_BASE_URL || ""
  return `${base}/app-icon?packageName=${encodeURIComponent(packageName)}`
}

interface AppInfoTableProps {
  data: AppInfo[]
  isLoading?: boolean
}

function AppInfoRow({ app }: { app: AppInfo }) {
  const displayName = useLocalizedName(app.localizedNames)
  const [iconError, setIconError] = useState(false)

  return (
    <TableRow>
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
    </TableRow>
  )
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
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
        </TableRow>
      ))}
    </>
  )
}

export function AppInfoTable({ data, isLoading }: AppInfoTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Icon</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Package Name</TableHead>
            <TableHead>Main Activity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <LoadingRows />
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No results found
              </TableCell>
            </TableRow>
          ) : (
            data.map((app) => (
              <AppInfoRow key={`${app.packageName}-${app.mainActivity}`} app={app} />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

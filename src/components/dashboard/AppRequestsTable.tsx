import type { ReactNode } from "react"
import { ImageOff, Settings } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface AppRequestsTableColumn {
  key: string
  header: string
  mobileLabel?: string
  width?: string
  render: (item: any) => ReactNode
  className?: string
  showInMobile?: boolean
}

interface AppRequestsTableProps {
  items: any[]
  columns: AppRequestsTableColumn[]
  getIconUrl: (item: any) => string | null
  getAppName: (item: any) => string
  isSystemApp?: (item: any) => boolean
  renderActions: (item: any) => ReactNode
  getItemKey: (item: any) => string
}

export function AppRequestsTable({
  items,
  columns,
  getIconUrl,
  getAppName,
  isSystemApp,
  renderActions,
  getItemKey,
}: AppRequestsTableProps) {
  return (
    <>
      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-3">
        {items.map((item) => {
          const iconUrl = getIconUrl(item)
          const appName = getAppName(item)
          const systemApp = isSystemApp?.(item) ?? false

          return (
            <div key={getItemKey(item)} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  {iconUrl ? (
                    <img
                      src={iconUrl}
                      alt={`${appName} icon`}
                      className="h-10 w-10 rounded object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                        e.currentTarget.nextElementSibling?.classList.remove("hidden")
                      }}
                    />
                  ) : null}
                  <div className={`${iconUrl ? "hidden" : ""} flex h-10 w-10 items-center justify-center rounded bg-muted`}>
                    <ImageOff className="h-5 w-5 text-muted-foreground" />
                  </div>
                  {systemApp && (
                    <div className="absolute -bottom-1 -right-1 bg-background border rounded-full p-0.5">
                      <Settings className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium break-words">
                    {appName}
                  </div>
                  {columns.find(col => col.showInMobile !== false)?.render(item) && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {columns.find(col => col.showInMobile !== false)?.render(item)}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {columns.filter(col => col.mobileLabel).map((col) => (
                  <div key={col.key}>
                    <div className="text-muted-foreground">{col.mobileLabel}</div>
                    <div className={col.className}>{col.render(item)}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                {renderActions(item)}
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block w-full overflow-hidden">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.width}>
                  {col.header}
                </TableHead>
              ))}
              <TableHead className="w-[120px] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const iconUrl = getIconUrl(item)
              const appName = getAppName(item)
              const systemApp = isSystemApp?.(item) ?? false

              return (
                <TableRow key={getItemKey(item)}>
                  <TableCell>
                    <div className="relative inline-block">
                      {iconUrl ? (
                        <img
                          src={iconUrl}
                          alt={`${appName} icon`}
                          className="h-8 w-8 rounded object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                            e.currentTarget.nextElementSibling?.classList.remove("hidden")
                          }}
                        />
                      ) : null}
                      <div className={`${iconUrl ? "hidden" : ""} flex h-8 w-8 items-center justify-center rounded bg-muted`}>
                        <ImageOff className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {systemApp && (
                        <div className="absolute -bottom-1 -right-1 bg-background border rounded-full p-0.5">
                          <Settings className="h-3 w-3 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render(item)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    {renderActions(item)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

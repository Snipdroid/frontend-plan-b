import type { ReactNode } from "react"
import { Settings } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AppIcon } from "@/components/ui/app-icon"

export interface AppRequestsTableColumn<T> {
  key: string
  header: string
  mobileLabel?: string
  width?: string
  render: (item: T) => ReactNode
  className?: string
  showInMobile?: boolean
}

interface AppRequestsTableProps<T> {
  items: T[]
  columns: AppRequestsTableColumn<T>[]
  getPackageName: (item: T) => string | undefined
  getAppName: (item: T) => string
  isSystemApp?: (item: T) => boolean
  renderActions: (item: T) => ReactNode
  getItemKey: (item: T) => string
}

export function AppRequestsTable<T>({
  items,
  columns,
  getPackageName,
  getAppName,
  isSystemApp,
  renderActions,
  getItemKey,
}: AppRequestsTableProps<T>) {
  return (
    <>
      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-3">
        {items.map((item) => {
          const packageName = getPackageName(item)
          const appName = getAppName(item)
          const systemApp = isSystemApp?.(item) ?? false

          return (
            <div key={getItemKey(item)} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  {packageName ? (
                    <AppIcon
                      packageName={packageName}
                      appName={appName}
                      className="h-10 w-10"
                      rounded="md"
                    />
                  ) : (
                    <div className="h-10 w-10 flex items-center justify-center rounded-md bg-muted">
                      <span className="text-muted-foreground text-sm">?</span>
                    </div>
                  )}
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
                  {columns.find(col => col.showInMobile === true)?.render(item) && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {columns.find(col => col.showInMobile === true)?.render(item)}
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
              const packageName = getPackageName(item)
              const appName = getAppName(item)
              const systemApp = isSystemApp?.(item) ?? false

              return (
                <TableRow key={getItemKey(item)}>
                  <TableCell>
                    <div className="relative inline-block">
                      {packageName ? (
                        <AppIcon
                          packageName={packageName}
                          appName={appName}
                          className="h-8 w-8"
                          rounded="md"
                        />
                      ) : (
                        <div className="h-8 w-8 flex items-center justify-center rounded-md bg-muted">
                          <span className="text-muted-foreground text-sm">?</span>
                        </div>
                      )}
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

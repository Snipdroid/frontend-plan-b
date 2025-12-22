import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface ParsedApp {
  packageName: string
  mainActivity: string
  drawableName: string
  status: "valid" | "invalid-drawable" | "duplicate" | "already-adapted"
  reason?: string
  duplicateDrawables?: string[]
}

interface AppFilterPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  apps: ParsedApp[]
  onConfirm: () => void
  onCancel: () => void
}

export function AppFilterPreviewDialog({
  open,
  onOpenChange,
  apps,
  onConfirm,
  onCancel,
}: AppFilterPreviewDialogProps) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<"all" | "valid" | "invalid" | "skipped">("all")

  // Calculate statistics
  const stats = {
    total: apps.length,
    valid: apps.filter((app) => app.status === "valid").length,
    invalidDrawable: apps.filter((app) => app.status === "invalid-drawable").length,
    duplicate: apps.filter((app) => app.status === "duplicate").length,
    alreadyAdapted: apps.filter((app) => app.status === "already-adapted").length,
  }

  const hasErrors = stats.invalidDrawable > 0 || stats.duplicate > 0
  const canProceed = stats.valid > 0

  // Filter apps based on selected filter
  const filteredApps = apps.filter((app) => {
    if (filter === "all") return true
    if (filter === "valid") return app.status === "valid"
    if (filter === "invalid") return app.status === "invalid-drawable" || app.status === "duplicate"
    if (filter === "skipped") return app.status === "already-adapted"
    return true
  })

  const getStatusIcon = (status: ParsedApp["status"], reason?: string) => {
    const icon = (() => {
      switch (status) {
        case "valid":
          return <CheckCircle2 className="h-4 w-4 text-green-600" />
        case "invalid-drawable":
          return <XCircle className="h-4 w-4 text-destructive" />
        case "duplicate":
          return <AlertCircle className="h-4 w-4 text-yellow-600" />
        case "already-adapted":
          return <Info className="h-4 w-4 text-muted-foreground" />
      }
    })()

    // Only show tooltip for non-valid statuses with reasons
    if (status !== "valid" && reason) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">{icon}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{reason}</p>
          </TooltipContent>
        </Tooltip>
      )
    }

    return icon
  }

  const getStatusText = (app: ParsedApp) => {
    switch (app.status) {
      case "valid":
        return t("iconPack.previewStatusValid")
      case "invalid-drawable":
        return app.reason || t("iconPack.previewStatusInvalidDrawable")
      case "duplicate":
        return t("iconPack.previewStatusDuplicate")
      case "already-adapted":
        return t("iconPack.previewStatusAlreadyAdapted")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>{t("iconPack.previewDialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("iconPack.previewDialogDesc")}
          </DialogDescription>
        </DialogHeader>

        {/* Statistics Summary */}
        <div className="flex flex-wrap gap-2 px-6 pb-4">
          <Badge
            variant="outline"
            className={cn(
              "cursor-pointer transition-colors",
              filter === "all" && "bg-primary/10 border-primary"
            )}
            onClick={() => setFilter("all")}
          >
            {t("iconPack.previewTotal")}: {stats.total}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "cursor-pointer transition-colors border-green-600 text-green-600",
              filter === "valid" && "bg-green-50 dark:bg-green-950"
            )}
            onClick={() => setFilter("valid")}
          >
            {t("iconPack.previewValid")}: {stats.valid}
          </Badge>
          {(stats.invalidDrawable > 0 || stats.duplicate > 0) && (
            <Badge
              variant="outline"
              className={cn(
                "cursor-pointer transition-colors border-destructive text-destructive",
                filter === "invalid" && "bg-destructive/10"
              )}
              onClick={() => setFilter("invalid")}
            >
              {t("iconPack.previewInvalid")}: {stats.invalidDrawable + stats.duplicate}
            </Badge>
          )}
          {stats.alreadyAdapted > 0 && (
            <Badge
              variant="outline"
              className={cn(
                "cursor-pointer transition-colors text-muted-foreground",
                filter === "skipped" && "bg-muted"
              )}
              onClick={() => setFilter("skipped")}
            >
              {t("iconPack.previewSkipped")}: {stats.alreadyAdapted}
            </Badge>
          )}
        </div>

        {/* Desktop Table View */}
        <TooltipProvider>
          <div className="hidden md:block flex-1 min-h-0 px-6">
            <ScrollArea className="h-full">
              <div className="min-w-[650px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Status</TableHead>
                      <TableHead className="min-w-[200px]">Package Name</TableHead>
                      <TableHead className="min-w-[200px]">Main Activity</TableHead>
                      <TableHead className="min-w-[150px]">Drawable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApps.map((app, index) => (
                      <TableRow
                        key={index}
                        className={cn(
                          app.status === "invalid-drawable" && "bg-destructive/5",
                          app.status === "duplicate" && "bg-yellow-50 dark:bg-yellow-950/20",
                          app.status === "already-adapted" && "bg-muted/50"
                        )}
                      >
                        <TableCell>{getStatusIcon(app.status, app.reason)}</TableCell>
                        <TableCell className="font-medium">{app.packageName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {app.mainActivity}
                        </TableCell>
                        <TableCell>
                          {app.status === "duplicate" && app.duplicateDrawables ? (
                            <div className="flex flex-wrap gap-1">
                              {app.duplicateDrawables.map((name, i) => (
                                <code
                                  key={i}
                                  className="text-xs bg-yellow-100 dark:bg-yellow-900 px-1.5 py-0.5 rounded"
                                >
                                  {name}
                                </code>
                              ))}
                            </div>
                          ) : (
                            <code
                              className={cn(
                                "text-xs px-1.5 py-0.5 rounded",
                                app.status === "invalid-drawable"
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-muted"
                              )}
                            >
                              {app.drawableName}
                            </code>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </div>
        </TooltipProvider>

        {/* Mobile List View */}
        <TooltipProvider>
          <div className="md:hidden flex-1 min-h-0 px-6">
            <ScrollArea className="h-full">
              <div className="space-y-2 pb-4">
                {filteredApps.map((app, index) => (
                  <div
                    key={index}
                    className={cn(
                      "rounded-lg border p-3 text-sm transition-colors",
                      app.status === "invalid-drawable" && "border-destructive/50 bg-destructive/5",
                      app.status === "duplicate" && "border-yellow-600/50 bg-yellow-50 dark:bg-yellow-950/20",
                      app.status === "already-adapted" && "bg-muted/50",
                      app.status === "valid" && "border-green-600/20"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getStatusIcon(app.status, app.reason)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{app.packageName}</div>
                        <div className="text-muted-foreground text-xs truncate">
                          {app.mainActivity}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {t("iconPack.drawable")}:
                          </span>
                          {app.status === "duplicate" && app.duplicateDrawables ? (
                            <div className="flex flex-wrap gap-1">
                              {app.duplicateDrawables.map((name, i) => (
                                <code
                                  key={i}
                                  className="text-xs bg-yellow-100 dark:bg-yellow-900 px-1.5 py-0.5 rounded"
                                >
                                  {name}
                                </code>
                              ))}
                            </div>
                          ) : (
                            <code
                              className={cn(
                                "text-xs px-1.5 py-0.5 rounded",
                                app.status === "invalid-drawable"
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-muted"
                              )}
                            >
                              {app.drawableName}
                            </code>
                          )}
                        </div>
                        {app.status !== "valid" && (
                          <div
                            className={cn(
                              "mt-2 text-xs",
                              app.status === "invalid-drawable" && "text-destructive",
                              app.status === "duplicate" && "text-yellow-700 dark:text-yellow-500",
                              app.status === "already-adapted" && "text-muted-foreground"
                            )}
                          >
                            {getStatusText(app)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </TooltipProvider>

        {/* Footer with actions */}
        <DialogFooter className="px-6 py-4 border-t flex-col sm:flex-row gap-2">
          <div className="flex-1 text-sm text-muted-foreground">
            {hasErrors && (
              <p className="text-destructive">
                {t("iconPack.previewHasErrors")}
              </p>
            )}
            {canProceed && stats.valid > 0 && (
              <p>
                {t("iconPack.previewWillImport", { count: stats.valid })}
              </p>
            )}
          </div>
          <Button variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!canProceed}
          >
            {t("iconPack.previewConfirm", { count: stats.valid })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Search, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getMissingApps, markAppsAsAdapted } from "@/services/icon-pack"
import { API_BASE_URL } from "@/services/api"
import { DrawableNameDialog } from "./DrawableNameDialog"
import type { AppInfoDTO } from "@/types/icon-pack"

type AutocompleteStage = "idle" | "loading" | "preview" | "submitting" | "complete" | "error"

interface FailedApp {
  app: AppInfoDTO
  error: string
}

interface AutocompleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  iconPackId: string
  accessToken: string
  onComplete: () => void
  designerId?: string
}

export function AutocompleteDialog({
  open,
  onOpenChange,
  iconPackId,
  accessToken,
  onComplete,
  designerId,
}: AutocompleteDialogProps) {
  const { t } = useTranslation()
  const [stage, setStage] = useState<AutocompleteStage>("idle")
  const [missingApps, setMissingApps] = useState<AppInfoDTO[]>([])
  const [drawableNameMap, setDrawableNameMap] = useState<Map<string, string>>(new Map())
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedApp, setSelectedApp] = useState<AppInfoDTO | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successCount, setSuccessCount] = useState(0)
  const [failedApps, setFailedApps] = useState<FailedApp[]>([])

  const resetState = () => {
    setStage("idle")
    setMissingApps([])
    setDrawableNameMap(new Map())
    setSearchQuery("")
    setSelectedApp(null)
    setError(null)
    setSuccessCount(0)
    setFailedApps([])
  }

  // Fetch missing apps when dialog opens
  useEffect(() => {
    if (open && stage === "idle") {
      fetchMissingApps()
    }
  }, [open, stage])

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      resetState()
    }
  }, [open])

  const fetchMissingApps = async () => {
    setStage("loading")
    setError(null)

    try {
      const apps = await getMissingApps(accessToken, iconPackId)
      setMissingApps(apps)
      setStage("preview")
    } catch (err) {
      console.error("Failed to fetch missing apps:", err)
      setError(t("iconPack.autocomplete.error.fetch"))
      setStage("error")
    }
  }

  const filteredApps = useMemo(() => {
    if (!searchQuery) return missingApps

    const query = searchQuery.toLowerCase()
    return missingApps.filter(
      (app) =>
        app.defaultName.toLowerCase().includes(query) ||
        app.packageName.toLowerCase().includes(query) ||
        app.mainActivity.toLowerCase().includes(query)
    )
  }, [missingApps, searchQuery])

  const appsWithDrawableNames = useMemo(() => {
    return filteredApps.filter((app) => app.id && drawableNameMap.has(app.id))
  }, [filteredApps, drawableNameMap])

  const getIconUrl = (packageName: string) => {
    return `${API_BASE_URL}/app-icon?packageName=${encodeURIComponent(packageName)}`
  }

  const handleSetDrawableName = (app: AppInfoDTO) => {
    setSelectedApp(app)
  }

  const handleDrawableNameConfirm = (drawableName: string) => {
    if (selectedApp?.id) {
      const newMap = new Map(drawableNameMap)
      newMap.set(selectedApp.id, drawableName)
      setDrawableNameMap(newMap)
    }
    setSelectedApp(null)
  }

  const handleSubmit = async () => {
    // Validate at least one app has drawable name set
    if (drawableNameMap.size === 0) {
      toast.error(t("iconPack.autocomplete.error.noSelection"))
      return
    }

    setStage("submitting")
    setError(null)

    try {
      // Get apps with drawable names
      const appsToMark = missingApps.filter((app) => app.id && drawableNameMap.has(app.id))
      const appInfoIDs = appsToMark.map((app) => app.id!).filter(Boolean)
      const drawables: Record<string, string> = {}

      appsToMark.forEach((app) => {
        if (app.id) {
          const drawableName = drawableNameMap.get(app.id)
          if (drawableName) {
            drawables[app.id] = drawableName
          }
        }
      })

      // Use Promise.allSettled to handle partial failures
      const results = await Promise.allSettled(
        [markAppsAsAdapted(accessToken, iconPackId, appInfoIDs, true, drawables)]
      )

      const successResults = results.filter((r) => r.status === "fulfilled")
      const failureResults = results.filter((r) => r.status === "rejected")

      setSuccessCount(appInfoIDs.length - failureResults.length)

      if (failureResults.length > 0) {
        const failed: FailedApp[] = appsToMark.map((app) => ({
          app,
          error: "Failed to mark as adapted",
        }))
        setFailedApps(failed)
      }

      setStage("complete")

      if (successResults.length > 0) {
        toast.success(
          t("iconPack.autocomplete.success", { count: successResults[0] ? appInfoIDs.length : 0 })
        )
        onComplete()
      }
    } catch (err) {
      console.error("Failed to mark apps as adapted:", err)
      setError(t("iconPack.autocomplete.error.submit"))
      setStage("error")
    }
  }

  const handleClose = () => {
    if (stage === "loading" || stage === "submitting") {
      return // Prevent closing during operations
    }
    onOpenChange(false)
  }

  const handleRetry = () => {
    if (stage === "error" && missingApps.length === 0) {
      fetchMissingApps()
    } else {
      setStage("preview")
    }
  }

  // Render stage-specific content
  const renderContent = () => {
    switch (stage) {
      case "idle":
      case "loading":
        return (
          <div className="space-y-2 px-6">
            <p className="text-sm text-muted-foreground">{t("iconPack.autocomplete.loading")}</p>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )

      case "preview":
        if (missingApps.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-8 text-center px-6">
              <Check className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-sm text-muted-foreground">
                {t("iconPack.autocomplete.noResults")}
              </p>
            </div>
          )
        }

        return (
          <div className="flex flex-col h-full">
            {/* Search Bar */}
            <div className="px-6 pb-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("iconPack.autocomplete.search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>
              {appsWithDrawableNames.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {t("iconPack.autocomplete.appsSelected", { count: appsWithDrawableNames.length })}
                </p>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block flex-1 min-h-0 px-6">
              <ScrollArea className="h-full">
                <div className="min-w-[800px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Icon</TableHead>
                        <TableHead className="min-w-[180px]">{t("iconPack.autocomplete.table.appName")}</TableHead>
                        <TableHead className="min-w-[220px]">{t("iconPack.autocomplete.table.packageName")}</TableHead>
                        <TableHead className="min-w-[220px]">{t("iconPack.autocomplete.table.mainActivity")}</TableHead>
                        <TableHead className="min-w-[140px]">{t("iconPack.autocomplete.table.drawableName")}</TableHead>
                        <TableHead className="text-right min-w-[120px]">
                          {t("iconPack.autocomplete.table.actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApps.map((app) => {
                        const drawableName = app.id ? drawableNameMap.get(app.id) : null
                        return (
                          <TableRow key={app.id}>
                            <TableCell>
                              <Avatar className="h-8 w-8">
                                <img src={getIconUrl(app.packageName)} alt={app.defaultName} />
                                <AvatarFallback>{app.defaultName[0]}</AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell className="font-medium">{app.defaultName}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {app.packageName}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {app.mainActivity}
                            </TableCell>
                            <TableCell>
                              {drawableName ? (
                                <Badge variant="default" className="font-mono text-xs">
                                  {drawableName}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetDrawableName(app)}
                              >
                                {drawableName
                                  ? t("iconPack.autocomplete.table.edit")
                                  : t("iconPack.autocomplete.setName")}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden flex-1 min-h-0 px-6">
              <ScrollArea className="h-full">
                <div className="space-y-3 pb-4">
                  {filteredApps.map((app) => {
                    const drawableName = app.id ? drawableNameMap.get(app.id) : null
                    return (
                      <div
                        key={app.id}
                        className="rounded-lg border p-4 text-sm space-y-3"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 mt-0.5">
                            <img src={getIconUrl(app.packageName)} alt={app.defaultName} />
                            <AvatarFallback>{app.defaultName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{app.defaultName}</div>
                            <div className="text-xs text-muted-foreground mt-1 space-y-1">
                              <div className="truncate">
                                <span className="font-medium">Package:</span> {app.packageName}
                              </div>
                              <div className="truncate">
                                <span className="font-medium">Activity:</span> {app.mainActivity}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {t("iconPack.autocomplete.table.drawableName")}:
                            </span>
                            {drawableName ? (
                              <Badge variant="default" className="font-mono text-xs truncate">
                                {drawableName}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDrawableName(app)}
                            className="whitespace-nowrap"
                          >
                            {drawableName
                              ? t("iconPack.autocomplete.table.edit")
                              : t("iconPack.autocomplete.setName")}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        )

      case "submitting":
        return (
          <div className="space-y-2 px-6">
            <p className="text-sm text-muted-foreground">{t("iconPack.autocomplete.submitting")}</p>
            <Skeleton className="h-10 w-full" />
          </div>
        )

      case "complete":
        return (
          <div className="flex flex-col items-center justify-center py-8 text-center px-6">
            <Check className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-sm font-medium">
              {failedApps.length > 0
                ? t("iconPack.autocomplete.partialSuccess", {
                    success: successCount,
                    failed: failedApps.length,
                  })
                : t("iconPack.autocomplete.success", { count: successCount })}
            </p>
            {failedApps.length > 0 && (
              <div className="mt-4 w-full text-left">
                <p className="text-sm font-medium mb-2">Failed apps:</p>
                <ScrollArea className="h-[200px] border rounded-md p-2">
                  {failedApps.map((failed) => (
                    <div key={failed.app.id} className="text-xs mb-2">
                      <span className="font-medium">{failed.app.defaultName}</span>
                      <span className="text-muted-foreground"> - {failed.error}</span>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}
          </div>
        )

      case "error":
        return (
          <div className="space-y-4 px-6">
            <div className="rounded-lg border border-destructive p-4">
              <p className="text-sm text-destructive">{error || t("iconPack.autocomplete.error.submit")}</p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Render footer buttons based on stage
  const renderFooter = () => {
    switch (stage) {
      case "idle":
      case "loading":
        return null

      case "preview":
        return (
          <>
            <Button variant="outline" onClick={handleClose}>
              {t("iconPack.autocomplete.cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={drawableNameMap.size === 0}>
              {t("iconPack.autocomplete.submit")}
            </Button>
          </>
        )

      case "submitting":
        return (
          <Button disabled>
            {t("iconPack.autocomplete.submitting")}
          </Button>
        )

      case "complete":
      case "error":
        return (
          <>
            {stage === "error" && (
              <Button variant="outline" onClick={handleRetry}>
                {t("iconPack.autocomplete.retry")}
              </Button>
            )}
            <Button onClick={handleClose}>{t("iconPack.autocomplete.close")}</Button>
          </>
        )

      default:
        return null
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[95vw] h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>{t("iconPack.autocomplete.title")}</DialogTitle>
            <DialogDescription>{t("iconPack.autocomplete.description")}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-hidden">
            {renderContent()}
          </div>

          {renderFooter() && (
            <DialogFooter className="px-6 py-4 border-t">
              {renderFooter()}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {selectedApp && designerId && (
        <DrawableNameDialog
          open={selectedApp !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedApp(null)
          }}
          app={selectedApp}
          iconPackId={iconPackId}
          designerId={designerId}
          onConfirm={handleDrawableNameConfirm}
          isSubmitting={false}
        />
      )}
    </>
  )
}

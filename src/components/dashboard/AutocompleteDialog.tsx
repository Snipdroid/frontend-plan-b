import { useState, useEffect, useMemo, useCallback, startTransition } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Search, Check, ChevronRight, ChevronDown } from "lucide-react"
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
import { AppIcon } from "@/components/ui/app-icon"
import { getMissingApps, markAppsAsAdapted, getIconPackRequests } from "@/services/icon-pack"
import { DrawableNameDialog } from "./DrawableNameDialog"
import type { AppInfoDTO } from "@/types/icon-pack"

type AutocompleteStage = "idle" | "loading" | "preview" | "submitting" | "complete" | "error"

interface FailedApp {
  app: AppInfoDTO
  error: string
}

interface AppGroup {
  packageName: string
  defaultName: string
  apps: AppInfoDTO[]
  drawableName?: string
}

type GroupDrawableName =
  | { status: "none" }
  | { status: "single"; name: string }
  | { status: "multiple" }

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
  const [selectedPackageName, setSelectedPackageName] = useState<string | null>(null)
  const [selectedApp, setSelectedApp] = useState<AppInfoDTO | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [successCount, setSuccessCount] = useState(0)
  const [failedApps, setFailedApps] = useState<FailedApp[]>([])

  const resetState = () => {
    setStage("idle")
    setMissingApps([])
    setDrawableNameMap(new Map())
    setSearchQuery("")
    setSelectedPackageName(null)
    setSelectedApp(null)
    setExpandedGroups(new Set())
    setError(null)
    setSuccessCount(0)
    setFailedApps([])
  }

  const fetchMissingApps = useCallback(async () => {
    setStage("loading")
    setError(null)

    try {
      // Fetch both missing apps and all requests (including adapted) to get drawable names
      const [apps, requestsResponse] = await Promise.all([
        getMissingApps(accessToken, iconPackId),
        getIconPackRequests(accessToken, iconPackId, undefined, undefined, true) // includingAdapted=true
      ])

      // Create a map of package names to drawable names from adapted apps
      const packageToDrawableMap = new Map<string, string>()
      requestsResponse.items.forEach((request) => {
        if (request.iconPackApp?.drawable) {
          packageToDrawableMap.set(request.appInfo.packageName, request.iconPackApp.drawable)
        }
      })

      setMissingApps(apps)

      // Prefill drawable names for all missing apps based on their package name
      const newDrawableNameMap = new Map<string, string>()
      apps.forEach((app) => {
        if (app.id) {
          const drawableName = packageToDrawableMap.get(app.packageName)
          if (drawableName) {
            newDrawableNameMap.set(app.id, drawableName)
          }
        }
      })
      setDrawableNameMap(newDrawableNameMap)

      setStage("preview")
    } catch (err) {
      console.error("Failed to fetch missing apps:", err)
      setError(t("iconPack.autocomplete.error.fetch"))
      setStage("error")
    }
  }, [accessToken, iconPackId, t])

  // Fetch missing apps when dialog opens
  useEffect(() => {
    if (open && stage === "idle") {
      startTransition(() => {
        fetchMissingApps()
      })
    }
  }, [open, stage, fetchMissingApps])

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      startTransition(() => {
        resetState()
      })
    }
  }, [open])

  // Group apps by package name
  const appGroups = useMemo(() => {
    const groups = new Map<string, AppGroup>()

    missingApps.forEach((app) => {
      if (!groups.has(app.packageName)) {
        groups.set(app.packageName, {
          packageName: app.packageName,
          defaultName: app.defaultName,
          apps: [],
        })
      }
      groups.get(app.packageName)!.apps.push(app)
    })

    // Sort groups by package name
    return Array.from(groups.values()).sort((a, b) =>
      a.packageName.localeCompare(b.packageName)
    )
  }, [missingApps])

  // Filter groups based on search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return appGroups

    const query = searchQuery.toLowerCase()
    return appGroups.filter(
      (group) =>
        group.defaultName.toLowerCase().includes(query) ||
        group.packageName.toLowerCase().includes(query) ||
        group.apps.some((app) => app.mainActivity.toLowerCase().includes(query))
    )
  }, [appGroups, searchQuery])

  // Get groups with drawable names set
  const groupsWithDrawableNames = useMemo(() => {
    return filteredGroups.filter((group) => {
      // A group has drawable name if any of its apps have a drawable name
      return group.apps.some((app) => app.id && drawableNameMap.has(app.id))
    })
  }, [filteredGroups, drawableNameMap])

  // Get drawable name for a group (only if all apps have the same drawable name)
  const getGroupDrawableName = (group: AppGroup): GroupDrawableName => {
    const drawableNames = new Set<string>()

    for (const app of group.apps) {
      if (app.id && drawableNameMap.has(app.id)) {
        const name = drawableNameMap.get(app.id)
        if (name) {
          drawableNames.add(name)
        }
      }
    }

    // If no apps have drawable names set
    if (drawableNames.size === 0) {
      return { status: "none" }
    }

    // If all apps have the same drawable name, return it
    if (drawableNames.size === 1) {
      return { status: "single", name: Array.from(drawableNames)[0] }
    }

    // If apps have different drawable names
    return { status: "multiple" }
  }

  const handleSetDrawableNameForGroup = (group: AppGroup) => {
    setSelectedPackageName(group.packageName)
    setSelectedApp(null)
  }

  const handleSetDrawableNameForApp = (app: AppInfoDTO) => {
    setSelectedApp(app)
    setSelectedPackageName(null)
  }

  const toggleGroupExpanded = (packageName: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(packageName)) {
      newExpanded.delete(packageName)
    } else {
      newExpanded.add(packageName)
    }
    setExpandedGroups(newExpanded)
  }

  const handleDrawableNameConfirm = (drawableName: string) => {
    const newMap = new Map(drawableNameMap)

    if (selectedApp) {
      // Setting for individual app
      if (selectedApp.id) {
        newMap.set(selectedApp.id, drawableName)
      }
    } else if (selectedPackageName) {
      // Setting for entire group
      const group = appGroups.find((g) => g.packageName === selectedPackageName)
      if (group) {
        group.apps.forEach((app) => {
          if (app.id) {
            newMap.set(app.id, drawableName)
          }
        })
      }
    }

    setDrawableNameMap(newMap)
    setSelectedPackageName(null)
    setSelectedApp(null)
  }

  // Get a representative app from a group or the selected app for DrawableNameDialog
  const getDialogApp = (): AppInfoDTO | null => {
    if (selectedApp) return selectedApp
    if (selectedPackageName) {
      const group = appGroups.find((g) => g.packageName === selectedPackageName)
      return group?.apps[0] || null
    }
    return null
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
        [markAppsAsAdapted(accessToken, iconPackId, appInfoIDs, true, drawables, {})]
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
              {groupsWithDrawableNames.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {t("iconPack.autocomplete.appsSelected", { count: groupsWithDrawableNames.length })}
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
                        <TableHead className="w-[40px]"></TableHead>
                        <TableHead className="w-[60px]">Icon</TableHead>
                        <TableHead className="min-w-[180px]">{t("iconPack.autocomplete.table.appName")}</TableHead>
                        <TableHead className="min-w-[220px]">{t("iconPack.autocomplete.table.packageName")}</TableHead>
                        <TableHead className="min-w-[180px]">{t("iconPack.autocomplete.table.mainActivity")}</TableHead>
                        <TableHead className="min-w-[140px]">{t("iconPack.autocomplete.table.drawableName")}</TableHead>
                        <TableHead className="text-right min-w-[120px]">
                          {t("iconPack.autocomplete.table.actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGroups.map((group) => {
                        const drawableName = getGroupDrawableName(group)
                        const isExpanded = expandedGroups.has(group.packageName)

                        return (
                          <>
                            {/* Group row */}
                            <TableRow key={group.packageName}>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => toggleGroupExpanded(group.packageName)}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell>
                                <AppIcon
                                  packageName={group.packageName}
                                  appName={group.defaultName}
                                  className="h-8 w-8"
                                  rounded="full"
                                />
                              </TableCell>
                              <TableCell className="font-medium">{group.defaultName}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {group.packageName}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                <Badge variant="secondary" className="font-mono text-xs">
                                  {group.apps.length} {group.apps.length === 1 ? 'activity' : 'activities'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {drawableName.status === "multiple" ? (
                                  <Badge variant="secondary" className="text-xs">
                                    {t("iconPack.autocomplete.multipleNames")}
                                  </Badge>
                                ) : drawableName.status === "single" ? (
                                  <Badge variant="default" className="font-mono text-xs">
                                    {drawableName.name}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSetDrawableNameForGroup(group)}
                                >
                                  {drawableName.status !== "none"
                                    ? t("iconPack.autocomplete.table.edit")
                                    : t("iconPack.autocomplete.setName")}
                                </Button>
                              </TableCell>
                            </TableRow>

                            {/* Individual app rows when expanded */}
                            {isExpanded && group.apps.map((app) => {
                              const appDrawableName = app.id ? drawableNameMap.get(app.id) : null
                              return (
                                <TableRow key={app.id} className="bg-muted/30">
                                  <TableCell colSpan={5} className="text-sm text-muted-foreground font-mono pl-12">
                                    {app.mainActivity}
                                  </TableCell>
                                  <TableCell>
                                    {appDrawableName ? (
                                      <Badge variant="default" className="font-mono text-xs">
                                        {appDrawableName}
                                      </Badge>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleSetDrawableNameForApp(app)}
                                    >
                                      {appDrawableName
                                        ? t("iconPack.autocomplete.table.edit")
                                        : t("iconPack.autocomplete.setName")}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </>
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
                  {filteredGroups.map((group) => {
                    const drawableName = getGroupDrawableName(group)
                    const isExpanded = expandedGroups.has(group.packageName)

                    return (
                      <div
                        key={group.packageName}
                        className="rounded-lg border p-4 text-sm space-y-3"
                      >
                        {/* Group Header */}
                        <div className="flex items-start gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 mt-1"
                            onClick={() => toggleGroupExpanded(group.packageName)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          <AppIcon
                            packageName={group.packageName}
                            appName={group.defaultName}
                            className="h-10 w-10"
                            rounded="full"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{group.defaultName}</div>
                            <div className="text-xs text-muted-foreground mt-1 space-y-1">
                              <div className="truncate">
                                <span className="font-medium">Package:</span> {group.packageName}
                              </div>
                              <div>
                                <Badge variant="secondary" className="font-mono text-xs">
                                  {group.apps.length} {group.apps.length === 1 ? 'activity' : 'activities'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Group Drawable Name and Action */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {t("iconPack.autocomplete.table.drawableName")}:
                            </span>
                            {drawableName.status === "multiple" ? (
                              <Badge variant="secondary" className="text-xs truncate">
                                {t("iconPack.autocomplete.multipleNames")}
                              </Badge>
                            ) : drawableName.status === "single" ? (
                              <Badge variant="default" className="font-mono text-xs truncate">
                                {drawableName.name}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDrawableNameForGroup(group)}
                            className="whitespace-nowrap"
                          >
                            {drawableName.status !== "none"
                              ? t("iconPack.autocomplete.table.edit")
                              : t("iconPack.autocomplete.setName")}
                          </Button>
                        </div>

                        {/* Individual Apps (when expanded) */}
                        {isExpanded && (
                          <div className="space-y-2 pt-2 border-t">
                            {group.apps.map((app) => {
                              const appDrawableName = app.id ? drawableNameMap.get(app.id) : null
                              return (
                                <div
                                  key={app.id}
                                  className="bg-muted/30 rounded-md p-3 space-y-2"
                                >
                                  <div className="text-xs font-mono break-all">
                                    {app.mainActivity}
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {t("iconPack.autocomplete.table.drawableName")}:
                                      </span>
                                      {appDrawableName ? (
                                        <Badge variant="default" className="font-mono text-xs truncate">
                                          {appDrawableName}
                                        </Badge>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">-</span>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleSetDrawableNameForApp(app)}
                                      className="whitespace-nowrap text-xs"
                                    >
                                      {appDrawableName
                                        ? t("iconPack.autocomplete.table.edit")
                                        : t("iconPack.autocomplete.setName")}
                                    </Button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
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

      {(selectedPackageName || selectedApp) && designerId && getDialogApp() && (
        <DrawableNameDialog
          key={getDialogApp()!.id}
          open={selectedPackageName !== null || selectedApp !== null}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedPackageName(null)
              setSelectedApp(null)
            }
          }}
          app={getDialogApp()!}
          iconPackId={iconPackId}
          designerId={designerId}
          onConfirm={handleDrawableNameConfirm}
          isSubmitting={false}
        />
      )}
    </>
  )
}

import { useState, useEffect, useMemo, useCallback } from "react"
import JSZip from "jszip"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Slider } from "@/components/ui/slider"
import { AppIcon } from "@/components/ui/app-icon"
import { getIconPackAdaptedApps } from "@/services/icon-pack"
import {
  generateAppfilterXml,
  generateDrawableXml,
  generateIconPackXml,
  buildDrawableMap,
  extractCategories,
  type AppfilterItem,
} from "@/lib/xml-generator"
import type { IconPackVersionDTO, IconPackAppDTO } from "@/types/icon-pack"

type ExportStage = "fetching" | "configuring" | "exporting" | "complete" | "error"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  iconPackId: string
  accessToken: string
  versions: IconPackVersionDTO[]
}

interface ExportDialogContentProps {
  onClose: () => void
  iconPackId: string
  accessToken: string
  versions: IconPackVersionDTO[]
}

function ExportDialogContent({
  onClose,
  iconPackId,
  accessToken,
  versions,
}: ExportDialogContentProps) {
  const { t } = useTranslation()

  // Sort versions by createdAt descending (newest first)
  const sortedVersions = useMemo(() => {
    return [...versions]
      .filter((v) => v.createdAt)
      .sort(
        (a, b) =>
          new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
      )
  }, [versions])

  // Compute initial slider bounds (captured at mount time)
  const initialBounds = useMemo(() => {
    const now = Date.now()

    if (sortedVersions.length === 0) {
      // No versions: use last 30 days as range
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
      return { min: thirtyDaysAgo, max: now, initial: now }
    }

    // Left bound: 2nd newest version or oldest version if only 1
    const leftBoundVersion =
      sortedVersions.length >= 2
        ? sortedVersions[1]
        : sortedVersions[sortedVersions.length - 1]

    const leftBound = new Date(leftBoundVersion.createdAt!).getTime()

    // Initial value: latest version's createdAt
    const initial = new Date(sortedVersions[0].createdAt!).getTime()

    return { min: leftBound, max: now, initial }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - only compute once on mount

  const [stage, setStage] = useState<ExportStage>("fetching")
  const [allApps, setAllApps] = useState<IconPackAppDTO[]>([])
  const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 0 })
  const [cutoffTimestamp, setCutoffTimestamp] = useState<number>(initialBounds.initial)
  const [error, setError] = useState<string | null>(null)

  // Version markers for the slider
  const versionMarkers = useMemo(() => {
    return sortedVersions
      .filter((v) => {
        const ts = new Date(v.createdAt!).getTime()
        return ts >= initialBounds.min && ts <= initialBounds.max
      })
      .map((v) => ({
        timestamp: new Date(v.createdAt!).getTime(),
        label: v.versionString,
      }))
  }, [sortedVersions, initialBounds])

  // Filter "New" apps based on cutoff timestamp
  const newApps = useMemo(() => {
    return allApps
      .filter((app) => {
        if (!app.createdAt) return false
        return new Date(app.createdAt).getTime() > cutoffTimestamp
      })
      .sort((a, b) => {
        // Sort by createdAt descending (newest first)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
      })
  }, [allApps, cutoffTimestamp])

  const fetchAllApps = useCallback(async () => {
    try {
      const apps: IconPackAppDTO[] = []
      let page = 1
      const perPage = 500
      let hasMore = true
      let total = 0

      while (hasMore) {
        const response = await getIconPackAdaptedApps(
          accessToken,
          iconPackId,
          page,
          perPage
        )

        apps.push(...response.items)

        if (page === 1) {
          total = response.metadata.total
          setFetchProgress({ current: response.items.length, total })
        } else {
          setFetchProgress({ current: apps.length, total })
        }

        hasMore = response.items.length === perPage
        page++
      }

      setAllApps(apps)
      setStage("configuring")
    } catch (err) {
      console.error("Failed to fetch adapted apps:", err)
      setError(
        err instanceof Error ? err.message : t("iconPack.exportError")
      )
      setStage("error")
    }
  }, [accessToken, iconPackId, t])

  // Start fetching on mount
  useEffect(() => {
    fetchAllApps()
  }, [fetchAllApps])

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExport = async () => {
    setStage("exporting")
    try {
      // Convert apps to appfilter items
      const appfilterItems: AppfilterItem[] = allApps
        .filter(
          (app) =>
            app.appInfo?.packageName && app.appInfo?.mainActivity && app.drawable
        )
        .map((app) => ({
          packageName: app.appInfo!.packageName,
          mainActivity: app.appInfo!.mainActivity,
          drawable: app.drawable,
        }))

      // Build drawable map and extract categories
      const drawableMap = buildDrawableMap(allApps, cutoffTimestamp)
      const categories = extractCategories(drawableMap)

      const zip = new JSZip()
      zip.file("appfilter.xml", generateAppfilterXml(appfilterItems))
      zip.file("drawable.xml", generateDrawableXml(drawableMap, categories))
      zip.file("icon_pack.xml", generateIconPackXml(drawableMap, categories))

      const zipBlob = await zip.generateAsync({ type: "blob" })
      downloadBlob(zipBlob, "xml.zip")

      setStage("complete")
      toast.success(t("iconPack.exportSuccess"))
    } catch (err) {
      console.error("Failed to export:", err)
      setError(
        err instanceof Error ? err.message : t("iconPack.exportError")
      )
      setStage("error")
    }
  }

  const handleRetry = () => {
    setStage("fetching")
    setError(null)
    fetchAllApps()
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  switch (stage) {
    case "fetching":
      return (
        <div className="space-y-4 py-4">
          <Progress
            value={
              fetchProgress.total > 0
                ? (fetchProgress.current / fetchProgress.total) * 100
                : 0
            }
          />
          <p className="text-sm text-muted-foreground text-center">
            {fetchProgress.total > 0
              ? t("iconPack.exportFetching", {
                  current: fetchProgress.current,
                  total: fetchProgress.total,
                })
              : t("common.loading")}
          </p>
        </div>
      )

    case "configuring":
      return (
        <div className="space-y-6 py-4">
          {/* Timeline Slider */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">
                {t("iconPack.exportSliderLabel")}
              </h4>
              <p className="text-xs text-muted-foreground">
                {t("iconPack.exportSliderDesc")}
              </p>
            </div>

            {/* Slider with markers */}
            <div className="relative pt-6 pb-2">
              {/* Version markers */}
              <div className="absolute top-0 left-0 right-0 h-6">
                {versionMarkers.map((marker) => {
                  const percent =
                    ((marker.timestamp - initialBounds.min) /
                      (initialBounds.max - initialBounds.min)) *
                    100
                  return (
                    <div
                      key={marker.timestamp}
                      className="absolute flex flex-col items-center"
                      style={{
                        left: `${percent}%`,
                        transform: "translateX(-50%)",
                      }}
                    >
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {marker.label}
                      </span>
                      <div className="w-px h-2 bg-muted-foreground/50" />
                    </div>
                  )
                })}
                {/* "Now" marker on the right */}
                <div
                  className="absolute flex flex-col items-center"
                  style={{ left: "100%", transform: "translateX(-50%)" }}
                >
                  <span className="text-xs text-muted-foreground">
                    {t("iconPack.exportNow")}
                  </span>
                  <div className="w-px h-2 bg-muted-foreground/50" />
                </div>
              </div>

              <Slider
                value={[cutoffTimestamp]}
                min={initialBounds.min}
                max={initialBounds.max}
                step={1000 * 60 * 60} // 1 hour steps
                onValueChange={([value]) => setCutoffTimestamp(value)}
                className="mt-2"
              />
            </div>
          </div>

          {/* New apps preview */}
          {newApps.length > 0 && (
            <ScrollArea className="h-[300px] border rounded-md">
              <div className="divide-y">
                {newApps.map((app) => {
                  const packageName = app.appInfo?.packageName
                  const appName = app.appInfo?.defaultName ?? "App"
                  return (
                    <div
                      key={app.id}
                      className="flex items-start gap-3 p-3"
                    >
                      <div className="flex-shrink-0">
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
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {app.appInfo?.defaultName ?? "-"}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono truncate">
                          {app.appInfo?.packageName ?? "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          drawable: <span className="font-mono">{app.drawable}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}

          <div className="flex items-center justify-between gap-2">
            <Badge variant={newApps.length > 0 ? "default" : "secondary"}>
              {newApps.length > 0
                ? t("iconPack.exportNewAppsAfterDate", { count: newApps.length, date: formatDate(cutoffTimestamp) })
                : t("iconPack.exportNoNewApps")}
            </Badge>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleExport}>{t("iconPack.exportConfirm")}</Button>
            </div>
          </div>
        </div>
      )

    case "exporting":
      return (
        <div className="space-y-4 py-4">
          <Progress value={undefined} />
          <p className="text-sm text-muted-foreground text-center">
            {t("iconPack.exporting")}
          </p>
        </div>
      )

    case "complete":
      return (
        <div className="space-y-4 py-4">
          <div className="text-center">
            <Badge variant="default" className="text-sm">
              {t("iconPack.exportSuccess")}
            </Badge>
          </div>
          <Button onClick={onClose} className="w-full">
            {t("common.close")}
          </Button>
        </div>
      )

    case "error":
      return (
        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-destructive p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRetry} variant="default" className="flex-1">
              {t("common.retry")}
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              {t("common.close")}
            </Button>
          </div>
        </div>
      )

    default:
      return null
  }
}

export function ExportDialog({
  open,
  onOpenChange,
  iconPackId,
  accessToken,
  versions,
}: ExportDialogProps) {
  const { t } = useTranslation()

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("iconPack.exportDialogTitle")}</DialogTitle>
          <DialogDescription>{t("iconPack.exportDialogDesc")}</DialogDescription>
        </DialogHeader>
        {open && (
          <ExportDialogContent
            onClose={handleClose}
            iconPackId={iconPackId}
            accessToken={accessToken}
            versions={versions}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

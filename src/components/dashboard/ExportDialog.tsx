import { useState, useEffect, useMemo, useCallback } from "react"
import JSZip from "jszip"
import xmlFormat from "xml-formatter"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ImageOff } from "lucide-react"
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
import { getIconPackAdaptedApps } from "@/services/icon-pack"
import { API_BASE_URL } from "@/services/api"
import type { IconPackVersionDTO, IconPackAppDTO } from "@/types/icon-pack"

type ExportStage = "fetching" | "configuring" | "exporting" | "complete" | "error"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  iconPackId: string
  accessToken: string
  versions: IconPackVersionDTO[]
}

export function ExportDialog({
  open,
  onOpenChange,
  iconPackId,
  accessToken,
  versions,
}: ExportDialogProps) {
  const { t } = useTranslation()
  const [stage, setStage] = useState<ExportStage>("fetching")
  const [allApps, setAllApps] = useState<IconPackAppDTO[]>([])
  const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 0 })
  const [cutoffTimestamp, setCutoffTimestamp] = useState<number>(Date.now())
  const [error, setError] = useState<string | null>(null)

  // Sort versions by createdAt descending (newest first)
  const sortedVersions = useMemo(() => {
    return [...versions]
      .filter((v) => v.createdAt)
      .sort(
        (a, b) =>
          new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
      )
  }, [versions])

  // Calculate slider bounds
  const sliderBounds = useMemo(() => {
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
  }, [sortedVersions])

  // Version markers for the slider
  const versionMarkers = useMemo(() => {
    return sortedVersions
      .filter((v) => {
        const ts = new Date(v.createdAt!).getTime()
        return ts >= sliderBounds.min && ts <= sliderBounds.max
      })
      .map((v) => ({
        timestamp: new Date(v.createdAt!).getTime(),
        label: v.versionString,
      }))
  }, [sortedVersions, sliderBounds])

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

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStage("fetching")
      setAllApps([])
      setFetchProgress({ current: 0, total: 0 })
      setCutoffTimestamp(sliderBounds.initial)
      setError(null)
      fetchAllApps()
    }
  }, [open, sliderBounds.initial])

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

  const serializeXml = (doc: Document): string => {
    const serializer = new XMLSerializer()
    const xmlString = serializer.serializeToString(doc)
    return xmlFormat('<?xml version="1.0" encoding="utf-8"?>' + xmlString, {
      indentation: "\t",
      collapseContent: true,
    })
  }

  const generateAppfilterXml = (apps: IconPackAppDTO[]): string => {
    const doc = document.implementation.createDocument(null, "appfilter", null)
    const root = doc.documentElement

    for (const app of apps) {
      if (app.appInfo?.packageName && app.appInfo?.mainActivity && app.drawable) {
        const item = doc.createElement("item")
        item.setAttribute(
          "component",
          `ComponentInfo{${app.appInfo.packageName}/${app.appInfo.mainActivity}}`
        )
        item.setAttribute("drawable", app.drawable)
        root.appendChild(item)
      }
    }

    return serializeXml(doc)
  }

  const generateDrawableXml = (
    apps: IconPackAppDTO[],
    cutoff: number
  ): string => {
    const doc = document.implementation.createDocument(null, "resources", null)
    const root = doc.documentElement

    // Add version element
    const versionEl = doc.createElement("version")
    versionEl.textContent = "1"
    root.appendChild(versionEl)

    // Build drawable map: drawable -> { categories: Set<string>, isNew: boolean }
    const drawableMap = new Map<
      string,
      { categories: Set<string>; isNew: boolean }
    >()

    for (const app of apps) {
      if (!app.drawable) continue

      const existing = drawableMap.get(app.drawable)
      const appDate = app.createdAt ? new Date(app.createdAt).getTime() : null
      const isNewApp = appDate !== null && appDate > cutoff

      if (existing) {
        for (const cat of app.categories ?? []) {
          existing.categories.add(cat)
        }
        if (isNewApp) {
          existing.isNew = true
        }
      } else {
        drawableMap.set(app.drawable, {
          categories: new Set(app.categories ?? []),
          isNew: isNewApp,
        })
      }
    }

    // Collect all unique categories and sort alphabetically
    const allCategories = new Set<string>()
    for (const { categories } of drawableMap.values()) {
      for (const cat of categories) {
        allCategories.add(cat)
      }
    }
    const sortedCategories = Array.from(allCategories).sort((a, b) =>
      a.localeCompare(b)
    )

    // Helper to add a category section
    const addCategorySection = (title: string, drawables: string[]) => {
      const category = doc.createElement("category")
      category.setAttribute("title", title)
      root.appendChild(category)

      for (const drawable of drawables) {
        const item = doc.createElement("item")
        item.setAttribute("drawable", drawable)
        root.appendChild(item)
      }
    }

    // "New" category
    const newDrawables = Array.from(drawableMap.entries())
      .filter(([, data]) => data.isNew)
      .map(([drawable]) => drawable)
      .sort((a, b) => a.localeCompare(b))

    if (newDrawables.length > 0) {
      addCategorySection("New", newDrawables)
    }

    // Regular categories
    for (const categoryName of sortedCategories) {
      const categoryDrawables = Array.from(drawableMap.entries())
        .filter(([, data]) => data.categories.has(categoryName))
        .map(([drawable]) => drawable)
        .sort((a, b) => a.localeCompare(b))

      if (categoryDrawables.length > 0) {
        addCategorySection(categoryName, categoryDrawables)
      }
    }

    // "All" category
    const allDrawables = Array.from(drawableMap.keys()).sort((a, b) =>
      a.localeCompare(b)
    )
    addCategorySection("All", allDrawables)

    return serializeXml(doc)
  }

  const generateIconPackXml = (
    apps: IconPackAppDTO[],
    cutoff: number
  ): string => {
    const doc = document.implementation.createDocument(null, "resources", null)
    const root = doc.documentElement
    root.setAttribute("xmlns:tools", "http://schemas.android.com/tools")
    root.setAttribute("tools:ignore", "ExtraTranslation")

    // Build drawable map: drawable -> { categories: Set<string>, isNew: boolean }
    const drawableMap = new Map<
      string,
      { categories: Set<string>; isNew: boolean }
    >()

    for (const app of apps) {
      if (!app.drawable) continue

      const existing = drawableMap.get(app.drawable)
      const appDate = app.createdAt ? new Date(app.createdAt).getTime() : null
      const isNewApp = appDate !== null && appDate > cutoff

      if (existing) {
        for (const cat of app.categories ?? []) {
          existing.categories.add(cat)
        }
        if (isNewApp) {
          existing.isNew = true
        }
      } else {
        drawableMap.set(app.drawable, {
          categories: new Set(app.categories ?? []),
          isNew: isNewApp,
        })
      }
    }

    // Get all drawables sorted
    const allDrawables = Array.from(drawableMap.keys()).sort((a, b) =>
      a.localeCompare(b)
    )

    // Get new drawables
    const newDrawables = Array.from(drawableMap.entries())
      .filter(([, data]) => data.isNew)
      .map(([drawable]) => drawable)
      .sort((a, b) => a.localeCompare(b))

    // Get all unique categories sorted
    const allCategories = new Set<string>()
    for (const { categories } of drawableMap.values()) {
      for (const cat of categories) {
        allCategories.add(cat)
      }
    }
    const sortedCategories = Array.from(allCategories).sort((a, b) =>
      a.localeCompare(b)
    )

    // Helper to add a string-array
    const addStringArray = (name: string, items: string[]) => {
      const stringArray = doc.createElement("string-array")
      stringArray.setAttribute("name", name)
      root.appendChild(stringArray)

      for (const item of items) {
        const itemEl = doc.createElement("item")
        itemEl.textContent = item
        stringArray.appendChild(itemEl)
      }
    }

    // icons_preview - all drawables
    addStringArray("icons_preview", allDrawables)

    // icon_filters - list of filter names
    const filters = ["All"]
    if (newDrawables.length > 0) {
      filters.push("New")
    }
    filters.push(...sortedCategories)
    addStringArray("icon_filters", filters)

    // All category
    addStringArray("All", allDrawables)

    // New category (if any)
    if (newDrawables.length > 0) {
      addStringArray("New", newDrawables)
    }

    // Regular categories
    for (const categoryName of sortedCategories) {
      const categoryDrawables = Array.from(drawableMap.entries())
        .filter(([, data]) => data.categories.has(categoryName))
        .map(([drawable]) => drawable)
        .sort((a, b) => a.localeCompare(b))

      if (categoryDrawables.length > 0) {
        addStringArray(categoryName, categoryDrawables)
      }
    }

    return serializeXml(doc)
  }

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
      const zip = new JSZip()

      zip.file("appfilter.xml", generateAppfilterXml(allApps))
      zip.file("drawable.xml", generateDrawableXml(allApps, cutoffTimestamp))
      zip.file("icon_pack.xml", generateIconPackXml(allApps, cutoffTimestamp))

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

  const handleClose = () => {
    onOpenChange(false)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getIconUrl = (packageName?: string) => {
    if (!packageName) return null
    return `${API_BASE_URL}/app-icon?packageName=${encodeURIComponent(packageName)}`
  }

  const renderContent = () => {
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
                      ((marker.timestamp - sliderBounds.min) /
                        (sliderBounds.max - sliderBounds.min)) *
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
                  min={sliderBounds.min}
                  max={sliderBounds.max}
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
                    const iconUrl = getIconUrl(app.appInfo?.packageName)
                    return (
                      <div
                        key={app.id}
                        className="flex items-start gap-3 p-3"
                      >
                        <div className="flex-shrink-0">
                          {iconUrl ? (
                            <img
                              src={iconUrl}
                              alt={`${app.appInfo?.defaultName ?? "App"} icon`}
                              className="h-8 w-8 rounded object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = "none"
                                e.currentTarget.nextElementSibling?.classList.remove(
                                  "hidden"
                                )
                              }}
                            />
                          ) : null}
                          <div
                            className={`${iconUrl ? "hidden" : ""} flex h-8 w-8 items-center justify-center rounded bg-muted`}
                          >
                            <ImageOff className="h-4 w-4 text-muted-foreground" />
                          </div>
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
                <Button variant="outline" onClick={handleClose}>
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
            <Button onClick={handleClose} className="w-full">
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
              <Button onClick={handleClose} variant="outline" className="flex-1">
                {t("common.close")}
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("iconPack.exportDialogTitle")}</DialogTitle>
          <DialogDescription>{t("iconPack.exportDialogDesc")}</DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}

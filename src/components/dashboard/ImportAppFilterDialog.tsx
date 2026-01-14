import { useState, useRef, useCallback } from "react"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { parseAppFilterXml } from "@/lib/appfilter-parser"
import { getIconPackAdaptedApps, markAppsAsAdapted } from "@/services/icon-pack"
import { createAppInfo, searchAppInfo } from "@/services/app-info"
import type { AppInfo, AppInfoDTO, AppInfoCreateSingleRequest } from "@/types/app-info"
import { ChevronDown, ChevronUp, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { AppFilterPreviewDialog, type ParsedApp } from "./AppFilterPreviewDialog"
import { ImportCategoriesDialog, type CategoryImportResult } from "./ImportCategoriesDialog"
import { ImportSubmitDialog } from "./ImportSubmitDialog"

type ImportStage =
  | "idle"
  | "parsing"
  | "preview"
  | "categories"
  | "submit"
  | "fetching"
  | "searching"
  | "creating"
  | "marking"
  | "complete"
  | "error"

interface FailedApp {
  packageName: string
  mainActivity: string
  drawableName: string
  error: string
}

interface ImportAppFilterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  iconPackId: string
  accessToken: string
  onImportComplete: () => void
}

export function ImportAppFilterDialog({
  open,
  onOpenChange,
  iconPackId,
  accessToken,
  onImportComplete,
}: ImportAppFilterDialogProps) {
  const { t } = useTranslation()
  const [stage, setStage] = useState<ImportStage>("idle")
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successCount, setSuccessCount] = useState(0)
  const [parsedApps, setParsedApps] = useState<ParsedApp[]>([])
  const [categoryImport, setCategoryImport] = useState<CategoryImportResult | undefined>(undefined)
  const [searchFailures, setSearchFailures] = useState<FailedApp[]>([])
  const [creationFailures, setCreationFailures] = useState<FailedApp[]>([])
  const [foundCount, setFoundCount] = useState(0)
  const [searchProgress, setSearchProgress] = useState({ current: 0, total: 0 })
  const [isSearchFailedOpen, setIsSearchFailedOpen] = useState(false)
  const [isCreationFailedOpen, setIsCreationFailedOpen] = useState(false)
  const [currentBatch, setCurrentBatch] = useState(0)
  const [totalBatches, setTotalBatches] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const resetState = () => {
    setStage("idle")
    setFile(null)
    setError(null)
    setSuccessCount(0)
    setParsedApps([])
    setCategoryImport(undefined)
    setSearchFailures([])
    setCreationFailures([])
    setFoundCount(0)
    setSearchProgress({ current: 0, total: 0 })
    setIsSearchFailedOpen(false)
    setIsCreationFailedOpen(false)
    setCurrentBatch(0)
    setTotalBatches(0)
  }

  const fetchAllAdaptedApps = useCallback(async (): Promise<Set<string>> => {
    const adaptedSet = new Set<string>()
    let page = 1
    const perPage = 500
    let hasMore = true

    while (hasMore) {
      const response = await getIconPackAdaptedApps(
        accessToken,
        iconPackId,
        page,
        perPage
      )

      for (const item of response.items) {
        if (item.appInfo) {
          const key = `${item.appInfo.packageName}|${item.appInfo.mainActivity}`
          adaptedSet.add(key)
        }
      }

      const totalPages = Math.ceil(response.metadata.total / perPage)
      hasMore = page < totalPages
      page++
    }

    return adaptedSet
  }, [accessToken, iconPackId])

  const validateDrawableName = useCallback((name: string): string | null => {
    if (!name || name.length === 0) {
      return t("errors.drawableNameEmpty")
    }

    // Must start with a letter
    if (!/^[a-z]/.test(name)) {
      return t("errors.drawableNameMustStartWithLetter")
    }

    // Can only contain lowercase letters, numbers, and underscores
    if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      return t("errors.drawableNameInvalidChars")
    }

    return null
  }, [t])

  const processImport = useCallback(async (file: File) => {
    try {
      // Stage 1: Parse XML
      setStage("parsing")
      const xmlContent = await file.text()
      const entries = parseAppFilterXml(xmlContent)

      if (entries.length === 0) {
        setError(t("iconPack.importNoEntries"))
        setStage("error")
        return
      }

      // Stage 2: Fetch already-adapted apps
      setStage("fetching")
      const adaptedSet = await fetchAllAdaptedApps()

      // Stage 3: Validate and categorize all apps
      const entryMap = new Map<string, { drawableNames: string[]; entries: typeof entries }>()

      // Group by (packageName, mainActivity)
      for (const entry of entries) {
        const key = `${entry.packageName}|${entry.mainActivity}`
        if (!entryMap.has(key)) {
          entryMap.set(key, { drawableNames: [], entries: [] })
        }
        const group = entryMap.get(key)!
        group.drawableNames.push(entry.drawableName)
        group.entries.push(entry)
      }

      // Build parsed apps array with status
      const parsed: ParsedApp[] = []
      for (const [key, group] of entryMap.entries()) {
        const [packageName, mainActivity] = key.split("|")
        const firstEntry = group.entries[0]

        // Check if already adapted
        if (adaptedSet.has(key)) {
          parsed.push({
            packageName,
            mainActivity,
            drawableName: firstEntry.drawableName,
            status: "already-adapted",
          })
          continue
        }

        // Check for duplicate with different drawable names
        const uniqueDrawableNames = [...new Set(group.drawableNames)]
        if (uniqueDrawableNames.length > 1) {
          parsed.push({
            packageName,
            mainActivity,
            drawableName: firstEntry.drawableName,
            status: "duplicate",
            duplicateDrawables: uniqueDrawableNames,
            reason: t("iconPack.previewStatusDuplicate"),
          })
          continue
        }

        // Validate drawable name
        const validationError = validateDrawableName(firstEntry.drawableName)
        if (validationError) {
          parsed.push({
            packageName,
            mainActivity,
            drawableName: firstEntry.drawableName,
            status: "invalid-drawable",
            reason: validationError,
          })
          continue
        }

        // Valid app
        parsed.push({
          packageName,
          mainActivity,
          drawableName: firstEntry.drawableName,
          status: "valid",
        })
      }

      setParsedApps(parsed)
      setStage("preview")
    } catch (err) {
      console.error("Import error:", err)
      setError(
        err instanceof Error
          ? err.message
          : t("errors.importAppFilter")
      )
      setStage("error")
      toast.error(t("errors.importAppFilter"))
    }
  }, [fetchAllAdaptedApps, validateDrawableName, t])

  const handleFilesAdded = useCallback(async (files: File[]) => {
    if (files.length === 0) return

    const selectedFile = files[0]
    setFile(selectedFile)
    await processImport(selectedFile)
  }, [processImport])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (stage === "idle") {
      setIsDragOver(true)
    }
  }, [stage])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      if (stage !== "idle") return

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.name.toLowerCase().endsWith(".xml")
      )

      if (files.length > 0) {
        handleFilesAdded(files)
      }
    },
    [stage, handleFilesAdded]
  )

  const handleClick = useCallback(() => {
    if (stage === "idle") {
      inputRef.current?.click()
    }
  }, [stage])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      if (files.length > 0) {
        handleFilesAdded(files)
      }
      e.target.value = ""
    },
    [handleFilesAdded]
  )

  const searchForExistingApps = async (
    entries: ReturnType<typeof parseAppFilterXml>
  ): Promise<{
    existing: Map<string, AppInfo>
    failures: FailedApp[]
  }> => {
    const SEARCH_CONCURRENCY = 10
    const existingMap = new Map<string, AppInfo>()
    const searchFailures: FailedApp[] = []

    for (let i = 0; i < entries.length; i += SEARCH_CONCURRENCY) {
      const batch = entries.slice(i, i + SEARCH_CONCURRENCY)

      const batchResults = await Promise.all(
        batch.map(async (entry) => {
          try {
            const result = await searchAppInfo({
              byPackageName: entry.packageName,
              byMainActivity: entry.mainActivity,
              sortBy: "count",
              page: 1,
              per: 10,
            })

            // Find exact match (ILIKE returns partial matches)
            const exactMatch = result.items.find(
              (app) =>
                app.packageName === entry.packageName &&
                app.mainActivity === entry.mainActivity
            )

            return { entry, app: exactMatch || null, error: null }
          } catch (error) {
            console.warn("Search failed for", entry.packageName, error)
            return {
              entry,
              app: null,
              error: error instanceof Error ? error.message : t("errors.searchFailed"),
            }
          }
        })
      )

      batchResults.forEach(({ entry, app, error }) => {
        const key = `${entry.packageName}|${entry.mainActivity}`
        if (app) {
          existingMap.set(key, app)
        } else if (error) {
          searchFailures.push({
            packageName: entry.packageName,
            mainActivity: entry.mainActivity,
            drawableName: entry.drawableName,
            error,
          })
        }
      })

      // Update progress
      setSearchProgress({
        current: Math.min(i + SEARCH_CONCURRENCY, entries.length),
        total: entries.length,
      })
    }

    return { existing: existingMap, failures: searchFailures }
  }

  const executeImport = async (categoryImport?: CategoryImportResult) => {
    try {
      // Get only valid apps to import
      const validApps = parsedApps.filter((app) => app.status === "valid")

      if (validApps.length === 0) {
        toast.info(t("iconPack.importNoValidApps"))
        handleClose()
        return
      }

      // Stage 3: Search for existing apps
      setStage("searching")
      setSearchProgress({ current: 0, total: validApps.length })
      const { existing: existingAppsMap, failures: searchFails } =
        await searchForExistingApps(validApps)

      setSearchFailures(searchFails)
      setFoundCount(existingAppsMap.size)

      // Separate existing apps from apps that need creation
      const existingApps: AppInfo[] = []
      const missingApps = validApps.filter((app) => {
        const key = `${app.packageName}|${app.mainActivity}`
        const existing = existingAppsMap.get(key)
        if (existing) {
          existingApps.push(existing)
          return false
        }
        return true
      })

      // Stage 4: Create missing app info in batches
      setStage("creating")
      const createdApps: AppInfoDTO[] = []
      const creationFails: FailedApp[] = []

      if (missingApps.length > 0) {
        const createRequests: AppInfoCreateSingleRequest[] = missingApps.map(
          (app) => ({
            packageName: app.packageName,
            mainActivity: app.mainActivity,
            defaultName: app.packageName.split(".").pop() || app.packageName,
            localizedName: app.packageName.split(".").pop() || app.packageName,
            languageCode: "--",
          })
        )

        // Batch createAppInfo calls
        // IMPORTANT: /app-info/create has strict rate limits (burst: 20, avg: 20 per 7 days)
        // We must NOT retry failed batches individually to avoid hitting rate limits
        const createBatchSize = 25
        const createBatches = Math.ceil(
          createRequests.length / createBatchSize
        )

        for (let i = 0; i < createBatches; i++) {
          const batchStart = i * createBatchSize
          const batchEnd = Math.min(
            (i + 1) * createBatchSize,
            createRequests.length
          )
          const batch = createRequests.slice(batchStart, batchEnd)

          try {
            const batchResult = await createAppInfo(batch)
            createdApps.push(...batchResult)
          } catch (error) {
            // Record all apps in failed batch as creation failures
            // Do NOT retry individually due to strict rate limits
            const errorMessage = error instanceof Error ? error.message : t("errors.batchCreationFailed")
            for (let j = 0; j < batch.length; j++) {
              const originalApp = missingApps[batchStart + j]
              creationFails.push({
                packageName: originalApp.packageName,
                mainActivity: originalApp.mainActivity,
                drawableName: originalApp.drawableName,
                error: errorMessage,
              })
            }
          }
        }
      }

      setCreationFailures(creationFails)

      // Combine existing and created apps for marking
      const allApps: (AppInfo | AppInfoDTO)[] = [...existingApps, ...createdApps]

      if (allApps.length === 0) {
        // All searches and creations failed
        setSuccessCount(0)
        setStage("complete")
        return
      }

      // Stage 5: Mark as adapted in batches
      setStage("marking")
      const markBatchSize = 25
      const batches: (AppInfo | AppInfoDTO)[][] = []
      for (let i = 0; i < allApps.length; i += markBatchSize) {
        batches.push(allApps.slice(i, i + markBatchSize))
      }

      setTotalBatches(batches.length)

      let successfulCount = 0
      for (let i = 0; i < batches.length; i++) {
        setCurrentBatch(i + 1)
        const batch = batches[i]

        const appInfoIDs = batch.map((app) => app.id!).filter(Boolean)
        const drawables: Record<string, string> = {}
        const categories: Record<string, string[]> = {}

        // Match drawable names from original valid apps
        for (const app of batch) {
          const validApp = validApps.find(
            (a) =>
              a.packageName === app.packageName &&
              a.mainActivity === app.mainActivity
          )
          if (validApp && app.id) {
            drawables[app.id] = validApp.drawableName
            const normalizedDrawable = validApp.drawableName.trim().toLowerCase()
            const importedCategories =
              categoryImport?.drawableToCategories?.[normalizedDrawable] ?? []
            if (importedCategories.length > 0) {
              categories[app.id] = importedCategories
            }
          }
        }

        await markAppsAsAdapted(
          accessToken,
          iconPackId,
          appInfoIDs,
          true,
          drawables,
          categories
        )

        successfulCount += batch.length
      }

      setSuccessCount(successfulCount)
      setStage("complete")

      // Show success toast
      toast.success(
        t("iconPack.importSuccess", { count: successfulCount })
      )

      // Refresh adapted apps list
      onImportComplete()
    } catch (err) {
      console.error("Import error:", err)
      setError(
        err instanceof Error ? err.message : t("errors.importAppFilter")
      )
      setStage("error")
      toast.error(t("errors.importAppFilter"))
    }
  }

  const handlePreviewConfirm = () => {
    setStage("categories")
  }

  const handleCategoriesBack = () => {
    setStage("preview")
  }

  const handleCategoriesConfirm = (result?: CategoryImportResult) => {
    setCategoryImport(result)
    setStage("submit")
  }

  const handleSubmitBack = () => {
    setStage("categories")
  }

  const handleSubmitConfirm = async () => {
    await executeImport(categoryImport)
  }

  const handlePreviewCancel = () => {
    resetState()
  }

  const handleRetry = () => {
    if (file) {
      processImport(file)
    } else {
      resetState()
    }
  }

  const handleClose = () => {
    resetState()
    onOpenChange(false)
  }

  const renderContent = () => {
    switch (stage) {
      case "idle":
        return (
          <div className="space-y-4">
            <div
              onClick={handleClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 transition-colors cursor-pointer",
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">
                  {t("iconPack.importSelectFile")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("iconPack.importSelectFileDesc")}
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".xml"
                onChange={handleInputChange}
                className="hidden"
              />
            </div>
          </div>
        )

      case "parsing":
      case "fetching":
      case "searching":
      case "creating":
      case "marking":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <p className="text-sm text-muted-foreground">
              {stage === "parsing" && t("iconPack.importParsing")}
              {stage === "fetching" && t("iconPack.importChecking")}
              {stage === "searching" &&
                t("iconPack.importSearching", {
                  current: searchProgress.current,
                  total: searchProgress.total,
                })}
              {stage === "creating" && t("iconPack.importCreating")}
              {stage === "marking" &&
                t("iconPack.importMarking", {
                  current: currentBatch,
                  total: totalBatches,
                })}
            </p>
          </div>
        )

      case "complete":
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="default" className="text-sm">
                {t("iconPack.importSuccess", { count: successCount })}
              </Badge>
              {foundCount > 0 && (
                <Badge variant="secondary" className="text-sm">
                  {t("iconPack.importFound", { count: foundCount })}
                </Badge>
              )}
              {searchFailures.length > 0 && (
                <Badge variant="destructive" className="text-sm">
                  {t("iconPack.importSearchFailed", {
                    count: searchFailures.length,
                  })}
                </Badge>
              )}
              {creationFailures.length > 0 && (
                <Badge variant="destructive" className="text-sm">
                  {t("iconPack.importCreationFailed", {
                    count: creationFailures.length,
                  })}
                </Badge>
              )}
            </div>

            {searchFailures.length > 0 && (
              <Collapsible
                open={isSearchFailedOpen}
                onOpenChange={setIsSearchFailedOpen}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    <span>{t("iconPack.importSearchFailedList")}</span>
                    {isSearchFailedOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {searchFailures.map((app, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-destructive/50 p-3 text-sm"
                      >
                        <div className="font-medium truncate">{app.packageName}</div>
                        <div className="text-muted-foreground text-xs truncate">
                          {app.mainActivity}
                        </div>
                        <div className="text-destructive text-xs mt-1">{app.error}</div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {creationFailures.length > 0 && (
              <Collapsible
                open={isCreationFailedOpen}
                onOpenChange={setIsCreationFailedOpen}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    <span>{t("iconPack.importCreationFailedList")}</span>
                    {isCreationFailedOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {creationFailures.map((app, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-destructive/50 p-3 text-sm"
                      >
                        <div className="font-medium truncate">{app.packageName}</div>
                        <div className="text-muted-foreground text-xs truncate">
                          {app.mainActivity}
                        </div>
                        <div className="text-destructive text-xs mt-1">{app.error}</div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            <Button onClick={handleClose} className="w-full">
              {t("common.close")}
            </Button>
          </div>
        )

      case "error":
        return (
          <div className="space-y-4">
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
    <>
      <Dialog
        open={
          open &&
          stage !== "preview" &&
          stage !== "categories" &&
          stage !== "submit"
        }
        onOpenChange={onOpenChange}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("iconPack.importDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("iconPack.importDialogDesc")}
            </DialogDescription>
          </DialogHeader>
          {renderContent()}
        </DialogContent>
      </Dialog>

      <AppFilterPreviewDialog
        open={stage === "preview"}
        onOpenChange={(open) => {
          if (!open) {
            handlePreviewCancel()
          }
        }}
        apps={parsedApps}
        onConfirm={handlePreviewConfirm}
        onCancel={handlePreviewCancel}
      />

      <ImportCategoriesDialog
        open={stage === "categories"}
        onOpenChange={(open) => {
          if (!open) {
            handlePreviewCancel()
          }
        }}
        validApps={parsedApps.filter((a) => a.status === "valid")}
        onBack={handleCategoriesBack}
        onConfirm={handleCategoriesConfirm}
      />

      <ImportSubmitDialog
        open={stage === "submit"}
        onOpenChange={(open) => {
          if (!open) {
            handlePreviewCancel()
          }
        }}
        validApps={parsedApps.filter((a) => a.status === "valid")}
        categoryImport={categoryImport}
        onBack={handleSubmitBack}
        onSubmit={handleSubmitConfirm}
      />
    </>
  )
}

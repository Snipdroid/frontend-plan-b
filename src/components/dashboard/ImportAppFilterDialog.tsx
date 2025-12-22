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
import { createAppInfo } from "@/services/app-info"
import type { AppInfoDTO, AppInfoCreateSingleRequest } from "@/types/app-info"
import { ChevronDown, ChevronUp, Upload } from "lucide-react"
import { cn } from "@/lib/utils"

type ImportStage =
  | "idle"
  | "parsing"
  | "fetching"
  | "creating"
  | "marking"
  | "complete"
  | "error"

interface SkippedApp {
  packageName: string
  mainActivity: string
  drawableName: string
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
  const [skipped, setSkipped] = useState<SkippedApp[]>([])
  const [isSkippedOpen, setIsSkippedOpen] = useState(false)
  const [currentBatch, setCurrentBatch] = useState(0)
  const [totalBatches, setTotalBatches] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const resetState = () => {
    setStage("idle")
    setFile(null)
    setError(null)
    setSuccessCount(0)
    setSkipped([])
    setIsSkippedOpen(false)
    setCurrentBatch(0)
    setTotalBatches(0)
  }

  const handleFilesAdded = async (files: File[]) => {
    if (files.length === 0) return

    const selectedFile = files[0]
    setFile(selectedFile)
    await processImport(selectedFile)
  }

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
    [stage]
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
    []
  )

  const fetchAllAdaptedApps = async (): Promise<Set<string>> => {
    const adaptedSet = new Set<string>()
    let page = 1
    const perPage = 100
    let hasMore = true

    while (hasMore) {
      const response = await getIconPackAdaptedApps(
        accessToken,
        iconPackId,
        page,
        perPage
      )

      for (const app of response.items) {
        const key = `${app.packageName}|${app.mainActivity}`
        adaptedSet.add(key)
      }

      const totalPages = Math.ceil(response.metadata.total / perPage)
      hasMore = page < totalPages
      page++
    }

    return adaptedSet
  }

  const processImport = async (file: File) => {
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

      // Stage 2: Fetch all adapted apps
      setStage("fetching")
      const adaptedSet = await fetchAllAdaptedApps()

      // Filter entries: separate already adapted from to-process
      const toProcess: typeof entries = []
      const skippedList: SkippedApp[] = []

      for (const entry of entries) {
        const key = `${entry.packageName}|${entry.mainActivity}`
        if (adaptedSet.has(key)) {
          skippedList.push({
            packageName: entry.packageName,
            mainActivity: entry.mainActivity,
            drawableName: entry.drawableName,
          })
        } else {
          toProcess.push(entry)
        }
      }

      setSkipped(skippedList)

      if (toProcess.length === 0) {
        // All apps already adapted
        setSuccessCount(0)
        setStage("complete")
        toast.success(t("iconPack.importSuccess", { count: 0 }))
        return
      }

      // Stage 3: Create/get app info in batches
      setStage("creating")
      const createRequests: AppInfoCreateSingleRequest[] = toProcess.map(
        (entry) => ({
          packageName: entry.packageName,
          mainActivity: entry.mainActivity,
          defaultName:
            entry.packageName.split(".").pop() || entry.packageName,
          localizedName:
            entry.packageName.split(".").pop() || entry.packageName,
          languageCode: "--",
        })
      )

      // Batch createAppInfo calls to avoid 413 Payload Too Large
      const createBatchSize = 25
      const createdApps: AppInfoDTO[] = []
      const createBatches = Math.ceil(createRequests.length / createBatchSize)

      for (let i = 0; i < createBatches; i++) {
        const batchStart = i * createBatchSize
        const batchEnd = Math.min((i + 1) * createBatchSize, createRequests.length)
        const batch = createRequests.slice(batchStart, batchEnd)

        const batchResult = await createAppInfo(batch)
        createdApps.push(...batchResult)
      }

      // Stage 4: Mark as adapted in batches
      setStage("marking")
      const markBatchSize = 25
      const batches: AppInfoDTO[][] = []
      for (let i = 0; i < createdApps.length; i += markBatchSize) {
        batches.push(createdApps.slice(i, i + markBatchSize))
      }

      setTotalBatches(batches.length)

      let successfulCount = 0
      for (let i = 0; i < batches.length; i++) {
        setCurrentBatch(i + 1)
        const batch = batches[i]

        const appInfoIDs = batch.map((app) => app.id!).filter(Boolean)
        const drawables: Record<string, string> = {}

        // Match drawable names from original entries
        for (const app of batch) {
          const entry = toProcess.find(
            (e) =>
              e.packageName === app.packageName &&
              e.mainActivity === app.mainActivity
          )
          if (entry && app.id) {
            drawables[app.id] = entry.drawableName
          }
        }

        await markAppsAsAdapted(
          accessToken,
          iconPackId,
          appInfoIDs,
          true,
          drawables
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
        err instanceof Error
          ? err.message
          : t("errors.importAppFilter")
      )
      setStage("error")
      toast.error(t("errors.importAppFilter"))
    }
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
            <div className="flex gap-2">
              <Badge variant="default" className="text-sm">
                {t("iconPack.importSuccess", { count: successCount })}
              </Badge>
              {skipped.length > 0 && (
                <Badge variant="secondary" className="text-sm">
                  {t("iconPack.importSkipped", { count: skipped.length })}
                </Badge>
              )}
            </div>

            {skipped.length > 0 && (
              <Collapsible open={isSkippedOpen} onOpenChange={setIsSkippedOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    <span>{t("iconPack.importSkippedList")}</span>
                    {isSkippedOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {skipped.map((app, index) => (
                      <div
                        key={index}
                        className="rounded-lg border p-3 text-sm"
                      >
                        <div className="font-medium truncate">{app.packageName}</div>
                        <div className="text-muted-foreground text-xs truncate">
                          {app.mainActivity}
                        </div>
                        <div className="text-muted-foreground text-xs mt-1">
                          {t("iconPack.drawable")}: {app.drawableName}
                        </div>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
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
  )
}

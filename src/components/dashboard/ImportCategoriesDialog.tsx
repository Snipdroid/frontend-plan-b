import { useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Upload, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { parseIconPackCategoryXml } from "@/lib/icon-pack-category-parser"
import { cn } from "@/lib/utils"

export interface CategoryImportResult {
  drawableToCategories: Record<string, string[]>
}

interface ImportCategoriesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  validApps: { drawableName: string }[]
  onBack: () => void
  onConfirm: (result?: CategoryImportResult) => void
}

function normalizeDrawableName(drawableName: string): string {
  return drawableName.trim().toLowerCase()
}

export function ImportCategoriesDialog({
  open,
  onOpenChange,
  validApps,
  onBack,
  onConfirm,
}: ImportCategoriesDialogProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const [categoryXmlFileName, setCategoryXmlFileName] = useState<string | null>(null)
  const [categorySourceType, setCategorySourceType] = useState<
    "drawable" | "icon_pack" | null
  >(null)
  const [categoryToDrawables, setCategoryToDrawables] = useState<
    Record<string, string[]>
  >({})
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [categoryImportError, setCategoryImportError] = useState<string | null>(null)

  const validDrawableToCount = useMemo(() => {
    const map = new Map<string, number>()
    for (const app of validApps) {
      const key = normalizeDrawableName(app.drawableName)
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  }, [validApps])

  const categoriesForUi = useMemo(() => {
    const sortedCategoryNames = Object.keys(categoryToDrawables).sort((a, b) =>
      a.localeCompare(b)
    )

    return sortedCategoryNames.map((categoryName) => {
      const drawables = categoryToDrawables[categoryName] ?? []
      let appCount = 0
      for (const drawable of drawables) {
        appCount += validDrawableToCount.get(drawable) ?? 0
      }

      return {
        name: categoryName,
        drawableCount: drawables.length,
        appCount,
        selected: selectedCategories.has(categoryName),
      }
    })
  }, [categoryToDrawables, selectedCategories, validDrawableToCount])

  const clearCategoryImport = () => {
    setCategoryXmlFileName(null)
    setCategorySourceType(null)
    setCategoryToDrawables({})
    setSelectedCategories(new Set())
    setCategoryImportError(null)
    setIsDragOver(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCategoryFileSelect = async (file: File) => {
    try {
      setCategoryImportError(null)
      const content = await file.text()
      const parsed = parseIconPackCategoryXml(content)

      setCategoryXmlFileName(file.name)
      setCategorySourceType(parsed.sourceType)
      setCategoryToDrawables(parsed.categoryToDrawables)
      setSelectedCategories(new Set(Object.keys(parsed.categoryToDrawables)))
    } catch (err) {
      setCategoryImportError(
        err instanceof Error ? err.message : t("iconPack.importCategoriesInvalidXml")
      )
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (categoryXmlFileName) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    if (categoryXmlFileName) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.name.toLowerCase().endsWith(".xml")
    )
    const first = files[0]
    if (first) {
      await handleCategoryFileSelect(first)
    }
  }

  const buildCategoryImportResult = (): CategoryImportResult | undefined => {
    if (Object.keys(categoryToDrawables).length === 0) return undefined
    if (selectedCategories.size === 0) return undefined

    const drawableToCategories = new Map<string, Set<string>>()
    for (const [categoryName, drawables] of Object.entries(categoryToDrawables)) {
      if (!selectedCategories.has(categoryName)) continue
      for (const drawable of drawables) {
        const set = drawableToCategories.get(drawable) ?? new Set<string>()
        set.add(categoryName)
        drawableToCategories.set(drawable, set)
      }
    }

    const record: Record<string, string[]> = {}
    for (const [drawable, categories] of drawableToCategories.entries()) {
      record[drawable] = Array.from(categories).sort((a, b) => a.localeCompare(b))
    }

    return Object.keys(record).length > 0 ? { drawableToCategories: record } : undefined
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("iconPack.importCategoriesDialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("iconPack.importCategoriesDialogDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!categoryXmlFileName && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                fileInputRef.current?.click()
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">
                  {t("iconPack.importCategoriesSelectFile")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("iconPack.importCategoriesSelectFileDesc")}
                </p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".xml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleCategoryFileSelect(file)
              e.target.value = ""
            }}
          />

          {categoryXmlFileName && (
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 min-w-0">
              <code className="text-xs font-medium truncate flex-1">
                {categoryXmlFileName}
              </code>
              {categorySourceType && (
                <Badge variant="secondary" className="shrink-0">
                  {categorySourceType === "drawable"
                    ? t("iconPack.importCategoriesSourceDrawable")
                    : t("iconPack.importCategoriesSourceIconPack")}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 shrink-0"
                onClick={clearCategoryImport}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {categoryImportError && (
            <div className="text-sm text-destructive">
              {categoryImportError}
            </div>
          )}

          {categoryXmlFileName && categoriesForUi.length > 0 && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setSelectedCategories(new Set(Object.keys(categoryToDrawables)))
                  }
                >
                  {t("iconPack.importCategoriesSelectAll")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategories(new Set())}
                >
                  {t("iconPack.importCategoriesSelectNone")}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {t("iconPack.importCategoriesHint")}
                </span>
              </div>

              <ScrollArea className="h-[40vh]">
                <div className="grid gap-2 md:grid-cols-2 pr-3">
                  {categoriesForUi.map((cat) => (
                    <label
                      key={cat.name}
                      className="flex items-start gap-2 rounded-md border px-3 py-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={cat.selected}
                        onCheckedChange={(checked) => {
                          setSelectedCategories((prev) => {
                            const next = new Set(prev)
                            if (checked) next.add(cat.name)
                            else next.delete(cat.name)
                            return next
                          })
                        }}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {cat.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t("iconPack.importCategoriesCounts", {
                            apps: cat.appCount,
                            drawables: cat.drawableCount,
                          })}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onBack}>
            {t("common.back")}
          </Button>
          <Button
            onClick={() => onConfirm(buildCategoryImportResult())}
          >
            {t("common.next")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

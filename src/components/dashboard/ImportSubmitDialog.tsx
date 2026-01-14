import { useMemo } from "react"
import { useTranslation } from "react-i18next"
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
import type { CategoryImportResult } from "./ImportCategoriesDialog"

interface ImportSubmitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  validApps: { drawableName: string }[]
  categoryImport?: CategoryImportResult
  onBack: () => void
  onSubmit: () => void
}

function normalizeDrawableName(drawableName: string): string {
  return drawableName.trim().toLowerCase()
}

export function ImportSubmitDialog({
  open,
  onOpenChange,
  validApps,
  categoryImport,
  onBack,
  onSubmit,
}: ImportSubmitDialogProps) {
  const { t } = useTranslation()

  const summary = useMemo(() => {
    const uniqueDrawables = new Set(validApps.map((a) => normalizeDrawableName(a.drawableName)))
    const drawableToCategories = categoryImport?.drawableToCategories ?? {}
    const categorizedDrawables = new Set(Object.keys(drawableToCategories))

    let appsWithCategories = 0
    for (const app of validApps) {
      const key = normalizeDrawableName(app.drawableName)
      if ((drawableToCategories[key]?.length ?? 0) > 0) {
        appsWithCategories += 1
      }
    }

    return {
      validApps: validApps.length,
      uniqueDrawables: uniqueDrawables.size,
      categorizedDrawables: categorizedDrawables.size,
      appsWithCategories,
    }
  }, [validApps, categoryImport])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("iconPack.importSubmitTitle")}</DialogTitle>
          <DialogDescription>
            {t("iconPack.importSubmitDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {t("iconPack.importSubmitApps", { count: summary.validApps })}
          </Badge>
          <Badge variant="outline">
            {t("iconPack.importSubmitDrawables", { count: summary.uniqueDrawables })}
          </Badge>
          <Badge variant="outline">
            {t("iconPack.importSubmitCategorizedDrawables", { count: summary.categorizedDrawables })}
          </Badge>
          <Badge variant="outline">
            {t("iconPack.importSubmitAppsWithCategories", { count: summary.appsWithCategories })}
          </Badge>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onBack}>
            {t("common.back")}
          </Button>
          <Button onClick={onSubmit}>
            {t("common.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

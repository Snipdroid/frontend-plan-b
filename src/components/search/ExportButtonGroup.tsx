import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CustomTemplateDialog } from "./CustomTemplateDialog"
import { getBestDrawableName } from "@/lib/drawable"
import type { AppInfo } from "@/types"

interface ExportButtonGroupProps {
  apps: AppInfo[]
  disabled?: boolean
  onCopy: () => void
}

export function ExportButtonGroup({
  apps,
  disabled,
  onCopy,
}: ExportButtonGroupProps) {
  const { t } = useTranslation()
  const [customDialogOpen, setCustomDialogOpen] = useState(false)

  const handleCopyAppfilter = async () => {
    const text = apps
      .map((app) => {
        const drawable = getBestDrawableName(app)
        return `<item component="ComponentInfo{${app.packageName}/${app.mainActivity}}" drawable="${drawable}"/>`
      })
      .join("\n")

    try {
      await navigator.clipboard.writeText(text)
      toast.success(t("export.appfilterCopied"))
    } catch {
      toast.error(t("export.copyFailed"))
    }
  }

  const handleCopyDrawable = async () => {
    const text = apps
      .map((app) => {
        const drawable = getBestDrawableName(app)
        return `<item drawable="${drawable}" />`
      })
      .join("\n")

    try {
      await navigator.clipboard.writeText(text)
      toast.success(t("export.drawableCopied"))
    } catch {
      toast.error(t("export.copyFailed"))
    }
  }

  const handleCopy = async () => {
    onCopy()
    toast.success(t("export.copied"))
  }

  return (
    <>
      {/* Mobile: Single dropdown with all options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="md:hidden"
            disabled={disabled}
          >
            {t("export.copy")}
            <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={handleCopyAppfilter}>
            {t("export.appfilter")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleCopyDrawable}>
            {t("export.drawable")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleCopy}>
            {t("export.plainText")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              setCustomDialogOpen(true)
            }}
          >
            {t("export.custom")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Desktop: Button group with dropdown */}
      <div className="hidden md:inline-flex">
        <Button
          variant="outline"
          size="sm"
          className="rounded-r-none border-r-0"
          disabled={disabled}
          onClick={handleCopyAppfilter}
        >
          {t("export.appfilter")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-none border-r-0"
          disabled={disabled}
          onClick={handleCopyDrawable}
        >
          {t("export.drawable")}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="rounded-l-none"
              disabled={disabled}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={handleCopy}>
              {t("export.plainText")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                setCustomDialogOpen(true)
              }}
            >
              {t("export.custom")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CustomTemplateDialog
        open={customDialogOpen}
        onOpenChange={setCustomDialogOpen}
        apps={apps}
      />
    </>
  )
}

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Plus, Minus, ChevronDown, Tags } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CustomTemplateDialog } from "@/components/search/CustomTemplateDialog"
import { convertAppInfoDTOToAppInfo, copyAppfilter, copyDrawable, copyIconPack } from "@/lib/copy-utils"
import {
  generateAppfilterSnippet,
  generateDrawableSnippet,
  generateIconPackSnippet,
} from "@/lib/xml-generator"
import type {
  AppInfoDTO,
  AppInfoWithRequestCount,
  IconPackVersionRequestRecordResponse,
  IconPackAppDTO,
} from "@/types/icon-pack"

interface AppActionDropdownProps {
  item: AppInfoWithRequestCount | IconPackVersionRequestRecordResponse | AppInfoDTO | IconPackAppDTO
  isAdapted: boolean
  isMarking: boolean
  onToggleAdapted: (adapted: boolean) => void
  disabled?: boolean
  onEditCategories?: () => void
}

/**
 * Extracts AppInfoDTO from various item types used in different tables
 */
function extractAppInfoDTO(
  item: AppInfoWithRequestCount | IconPackVersionRequestRecordResponse | AppInfoDTO | IconPackAppDTO
): AppInfoDTO | null {
  // AppInfoWithRequestCount has nested appInfo
  if ("appInfo" in item && "count" in item) {
    return (item as AppInfoWithRequestCount).appInfo ?? null
  }
  // IconPackAppDTO has nested appInfo and drawable
  if ("appInfo" in item && "drawable" in item) {
    return (item as IconPackAppDTO).appInfo ?? null
  }
  // IconPackVersionRequestRecordResponse has nested requestRecord.appInfo
  if ("requestRecord" in item) {
    return item.requestRecord.appInfo ?? null
  }
  // AppInfoDTO is used directly
  return item as AppInfoDTO
}

/**
 * Extracts the drawable name from IconPackAppDTO if available.
 * Returns null for other item types.
 */
function extractDrawable(
  item: AppInfoWithRequestCount | IconPackVersionRequestRecordResponse | AppInfoDTO | IconPackAppDTO
): string | null {
  // IconPackAppDTO has drawable field
  if ("appInfo" in item && "drawable" in item) {
    return (item as IconPackAppDTO).drawable ?? null
  }
  // IconPackVersionRequestRecordResponse may have iconPackApp with drawable
  if ("requestRecord" in item && "iconPackApp" in item) {
    return (item as IconPackVersionRequestRecordResponse).iconPackApp?.drawable ?? null
  }
  return null
}

export function AppActionDropdown({
  item,
  isAdapted,
  isMarking,
  onToggleAdapted,
  disabled,
  onEditCategories,
}: AppActionDropdownProps) {
  const { t } = useTranslation()
  const [customDialogOpen, setCustomDialogOpen] = useState(false)

  const appInfoDTO = extractAppInfoDTO(item)
  const appInfo = appInfoDTO ? convertAppInfoDTOToAppInfo(appInfoDTO) : null
  const storedDrawable = extractDrawable(item)

  const handleCopyAppfilter = async () => {
    if (!appInfoDTO) return
    // Use stored drawable for adapted apps, otherwise use default copy function
    if (storedDrawable) {
      const text = generateAppfilterSnippet([{
        packageName: appInfoDTO.packageName,
        mainActivity: appInfoDTO.mainActivity,
        drawable: storedDrawable,
      }])
      try {
        await navigator.clipboard.writeText(text)
        toast.success(t("export.appfilterCopied"))
      } catch {
        toast.error(t("export.copyFailed"))
      }
    } else if (appInfo) {
      await copyAppfilter([appInfo], t("export.appfilterCopied"), t("export.copyFailed"))
    }
  }

  const handleCopyDrawable = async () => {
    // Use stored drawable for adapted apps, otherwise use default copy function
    if (storedDrawable) {
      const text = generateDrawableSnippet([storedDrawable])
      try {
        await navigator.clipboard.writeText(text)
        toast.success(t("export.drawableCopied"))
      } catch {
        toast.error(t("export.copyFailed"))
      }
    } else if (appInfo) {
      await copyDrawable([appInfo], t("export.drawableCopied"), t("export.copyFailed"))
    }
  }

  const handleCopyIconPack = async () => {
    // Use stored drawable for adapted apps, otherwise use default copy function
    if (storedDrawable) {
      const text = generateIconPackSnippet([storedDrawable])
      try {
        await navigator.clipboard.writeText(text)
        toast.success(t("export.iconpackCopied"))
      } catch {
        toast.error(t("export.copyFailed"))
      }
    } else if (appInfo) {
      await copyIconPack([appInfo], t("export.iconpackCopied"), t("export.copyFailed"))
    }
  }

  const handleOpenCustomDialog = () => {
    setCustomDialogOpen(true)
  }

  return (
    <>
      {/* Mobile: Single dropdown with all actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="md:hidden"
            disabled={disabled || isMarking}
          >
            {isAdapted ? t("common.remove") : t("common.add")}
            <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => onToggleAdapted(!isAdapted)}
            disabled={disabled || isMarking}
          >
            {isAdapted ? (
              <>
                <Minus className="h-4 w-4 mr-2" />
                {t("actions.removeFromAdapted")}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                {t("actions.addToAdapted")}
              </>
            )}
          </DropdownMenuItem>
          {isAdapted && onEditCategories && (
            <DropdownMenuItem onSelect={onEditCategories}>
              <Tags className="h-4 w-4 mr-2" />
              {t("iconPack.editCategories")}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleCopyAppfilter}>
            {t("actions.copyAppfilter")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleCopyDrawable}>
            {t("actions.copyDrawable")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleCopyIconPack}>
            {t("actions.copyIconpack")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleOpenCustomDialog}>
            {t("actions.customCopy")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Desktop: Button group with dropdown */}
      <div className="hidden md:inline-flex">
        <Button
          variant={isAdapted ? "destructive" : "outline"}
          size="sm"
          className="rounded-r-none"
          onClick={() => onToggleAdapted(!isAdapted)}
          disabled={disabled || isMarking}
        >
          {isAdapted ? (
            <>
              <Minus className="h-4 w-4 mr-1" />
              {t("common.remove")}
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" />
              {t("common.add")}
            </>
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="rounded-l-none border-l-0"
              disabled={disabled || isMarking}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isAdapted && onEditCategories && (
              <>
                <DropdownMenuItem onSelect={onEditCategories}>
                  <Tags className="h-4 w-4 mr-2" />
                  {t("iconPack.editCategories")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onSelect={handleCopyAppfilter}>
              {t("actions.copyAppfilter")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleCopyDrawable}>
              {t("actions.copyDrawable")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleCopyIconPack}>
              {t("actions.copyIconpack")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleOpenCustomDialog}>
              {t("actions.customCopy")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {appInfo && (
        <CustomTemplateDialog
          open={customDialogOpen}
          onOpenChange={setCustomDialogOpen}
          apps={[appInfo]}
        />
      )}
    </>
  )
}

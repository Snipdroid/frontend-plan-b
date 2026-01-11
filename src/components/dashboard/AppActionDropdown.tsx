import { useState } from "react"
import { useTranslation } from "react-i18next"
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
 * Extracts AppInfoDTO and optional drawable from various item types.
 */
function extractAppData(
  item: AppInfoWithRequestCount | IconPackVersionRequestRecordResponse | AppInfoDTO | IconPackAppDTO
): { appInfoDTO: AppInfoDTO | null; drawable?: string } {
  // IconPackAppDTO has nested appInfo and drawable
  if ("appInfo" in item && "drawable" in item) {
    const dto = item as IconPackAppDTO
    return { appInfoDTO: dto.appInfo ?? null, drawable: dto.drawable }
  }
  // AppInfoWithRequestCount has nested appInfo
  if ("appInfo" in item && "count" in item) {
    return { appInfoDTO: (item as AppInfoWithRequestCount).appInfo ?? null }
  }
  // IconPackVersionRequestRecordResponse has nested requestRecord.appInfo
  if ("requestRecord" in item) {
    const response = item as IconPackVersionRequestRecordResponse
    return {
      appInfoDTO: response.requestRecord.appInfo ?? null,
      drawable: response.iconPackApp?.drawable,
    }
  }
  // AppInfoDTO is used directly
  return { appInfoDTO: item as AppInfoDTO }
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

  const { appInfoDTO, drawable } = extractAppData(item)
  const appInfo = appInfoDTO ? convertAppInfoDTOToAppInfo(appInfoDTO, drawable) : null

  const handleCopyAppfilter = () => {
    if (appInfo) copyAppfilter([appInfo], t("export.appfilterCopied"), t("export.copyFailed"))
  }

  const handleCopyDrawable = () => {
    if (appInfo) copyDrawable([appInfo], t("export.drawableCopied"), t("export.copyFailed"))
  }

  const handleCopyIconPack = () => {
    if (appInfo) copyIconPack([appInfo], t("export.iconpackCopied"), t("export.copyFailed"))
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
          <DropdownMenuItem onSelect={() => setCustomDialogOpen(true)}>
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
            <DropdownMenuItem onSelect={() => setCustomDialogOpen(true)}>
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

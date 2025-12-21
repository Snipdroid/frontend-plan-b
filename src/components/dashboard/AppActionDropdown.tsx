import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Minus, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CustomTemplateDialog } from "@/components/search/CustomTemplateDialog"
import { convertAppInfoDTOToAppInfo, copyAppfilter, copyDrawable } from "@/lib/copy-utils"
import type {
  AppInfoDTO,
  AppInfoWithRequestCount,
  IconPackVersionRequestRecordResponse,
} from "@/types/icon-pack"

interface AppActionDropdownProps {
  item: AppInfoWithRequestCount | IconPackVersionRequestRecordResponse | AppInfoDTO
  isAdapted: boolean
  isMarking: boolean
  onToggleAdapted: (adapted: boolean) => void
  disabled?: boolean
}

/**
 * Extracts AppInfoDTO from various item types used in different tables
 */
function extractAppInfoDTO(
  item: AppInfoWithRequestCount | IconPackVersionRequestRecordResponse | AppInfoDTO
): AppInfoDTO | null {
  // AppInfoWithRequestCount has nested appInfo
  if ("appInfo" in item) {
    return item.appInfo ?? null
  }
  // IconPackVersionRequestRecordResponse has nested requestRecord.appInfo
  if ("requestRecord" in item) {
    return item.requestRecord.appInfo ?? null
  }
  // AppInfoDTO is used directly
  return item as AppInfoDTO
}

export function AppActionDropdown({
  item,
  isAdapted,
  isMarking,
  onToggleAdapted,
  disabled,
}: AppActionDropdownProps) {
  const { t } = useTranslation()
  const [customDialogOpen, setCustomDialogOpen] = useState(false)

  const appInfoDTO = extractAppInfoDTO(item)
  const appInfo = appInfoDTO ? convertAppInfoDTOToAppInfo(appInfoDTO) : null

  const handleCopyAppfilter = async () => {
    if (!appInfo) return
    await copyAppfilter(
      [appInfo],
      t("export.appfilterCopied"),
      t("export.copyFailed")
    )
  }

  const handleCopyDrawable = async () => {
    if (!appInfo) return
    await copyDrawable(
      [appInfo],
      t("export.drawableCopied"),
      t("export.copyFailed")
    )
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
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleCopyAppfilter}>
            {t("actions.copyAppfilter")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleCopyDrawable}>
            {t("actions.copyDrawable")}
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
            <DropdownMenuItem onSelect={handleCopyAppfilter}>
              {t("actions.copyAppfilter")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleCopyDrawable}>
              {t("actions.copyDrawable")}
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

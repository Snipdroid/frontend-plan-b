import { useState, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { useAuth } from "react-oidc-context"
import { useTranslation } from "react-i18next"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { getIconPacks, markAppsAsAdapted } from "@/services/icon-pack"
import { getDesignerMe } from "@/services/designer"
import { DrawableNameDialog } from "@/components/dashboard/DrawableNameDialog"
import type { AppInfo } from "@/types"
import type { IconPackDTO, AppInfoDTO } from "@/types/icon-pack"

interface MarkAsAdaptedDialogProps {
  app: AppInfo
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface IconPackListProps {
  iconPacks: IconPackDTO[]
  selectedIconPackId: string
  onSelect: (iconPackId: string) => void
  searchPlaceholder: string
  emptyText: string
}

function IconPackList({
  iconPacks,
  selectedIconPackId,
  onSelect,
  searchPlaceholder,
  emptyText,
}: IconPackListProps) {
  return (
    <Command>
      <CommandInput placeholder={searchPlaceholder} />
      <CommandList>
        <CommandEmpty>{emptyText}</CommandEmpty>
        <CommandGroup>
          {iconPacks.map((pack) => (
            <CommandItem
              key={pack.id}
              value={pack.name}
              onSelect={() => onSelect(pack.id!)}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  selectedIconPackId === pack.id ? "opacity-100" : "opacity-0"
                )}
              />
              {pack.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

function toAppInfoDTO(app: AppInfo): AppInfoDTO {
  const defaultName =
    app.localizedNames.find((ln) => ln.languageCode === "--")?.name ??
    app.localizedNames[0]?.name ??
    app.packageName
  return {
    id: app.id,
    packageName: app.packageName,
    mainActivity: app.mainActivity,
    defaultName,
    count: app.count ?? 0,
  }
}

export function MarkAsAdaptedDialog({
  app,
  open,
  onOpenChange,
  onSuccess,
}: MarkAsAdaptedDialogProps) {
  const auth = useAuth()
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  const [step, setStep] = useState<"selectIconPack" | "enterDrawable">(
    "selectIconPack"
  )
  const [iconPacks, setIconPacks] = useState<IconPackDTO[]>([])
  const [selectedIconPackId, setSelectedIconPackId] = useState<string>("")
  const [designerId, setDesignerId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [comboboxOpen, setComboboxOpen] = useState(false)

  // Fetch icon packs and designer ID when dialog opens
  useEffect(() => {
    if (!open || !auth.user?.access_token) return

    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    Promise.all([
      getIconPacks(auth.user.access_token),
      getDesignerMe(auth.user.access_token),
    ])
      .then(([packs, designer]) => {
        setIconPacks(packs)
        setDesignerId(designer.id ?? null)
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Failed to fetch data")
        }
      })
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [open, auth.user?.access_token])

  const selectedIconPack = iconPacks.find(
    (pack) => pack.id === selectedIconPackId
  )

  const handleIconPackSelect = (iconPackId: string) => {
    setSelectedIconPackId(iconPackId === selectedIconPackId ? "" : iconPackId)
    setComboboxOpen(false)
  }

  const handleNext = () => {
    if (selectedIconPackId) {
      setStep("enterDrawable")
    }
  }

  const handleDrawableConfirm = async (drawableName: string, categories: string[]) => {
    if (!auth.user?.access_token || !selectedIconPackId) return

    setIsSubmitting(true)
    setError(null)

    try {
      await markAppsAsAdapted(
        auth.user.access_token,
        selectedIconPackId,
        [app.id],
        true,
        { [app.id]: drawableName },
        { [app.id]: categories }
      )
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to mark app as adapted"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset state when closing
      setStep("selectIconPack")
      setSelectedIconPackId("")
      setError(null)
      setComboboxOpen(false)
    }
    onOpenChange(open)
  }

  // Step 2: Show DrawableNameDialog
  if (step === "enterDrawable" && selectedIconPackId && designerId) {
    return (
      <DrawableNameDialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            // Go back to step 1 instead of closing completely
            setStep("selectIconPack")
          }
        }}
        app={toAppInfoDTO(app)}
        iconPackId={selectedIconPackId}
        designerId={designerId}
        onConfirm={handleDrawableConfirm}
        isSubmitting={isSubmitting}
      />
    )
  }

  // Step 1: Icon pack selection
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialogs.markAsAdapted.title")}</DialogTitle>
          <DialogDescription>
            {t("dialogs.markAsAdapted.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : iconPacks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("dialogs.markAsAdapted.noIconPacks")}
            </p>
          ) : isMobile ? (
            <Drawer open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <DrawerTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full justify-between"
                >
                  {selectedIconPack
                    ? selectedIconPack.name
                    : t("dialogs.markAsAdapted.selectIconPack")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="mt-4 border-t">
                  <IconPackList
                    iconPacks={iconPacks}
                    selectedIconPackId={selectedIconPackId}
                    onSelect={handleIconPackSelect}
                    searchPlaceholder={t("dialogs.markAsAdapted.searchIconPack")}
                    emptyText={t("dialogs.markAsAdapted.noIconPackFound")}
                  />
                </div>
              </DrawerContent>
            </Drawer>
          ) : (
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full justify-between"
                >
                  {selectedIconPack
                    ? selectedIconPack.name
                    : t("dialogs.markAsAdapted.selectIconPack")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
              >
                <IconPackList
                  iconPacks={iconPacks}
                  selectedIconPackId={selectedIconPackId}
                  onSelect={handleIconPackSelect}
                  searchPlaceholder={t("dialogs.markAsAdapted.searchIconPack")}
                  emptyText={t("dialogs.markAsAdapted.noIconPackFound")}
                />
              </PopoverContent>
            </Popover>
          )}

          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleNext}
            disabled={!selectedIconPackId || iconPacks.length === 0}
          >
            {t("common.next")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

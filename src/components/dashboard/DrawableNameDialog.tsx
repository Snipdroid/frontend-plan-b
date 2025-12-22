import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Check, ChevronsUpDown } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { toDrawableName } from "@/lib/drawable"
import { useIsMobile } from "@/hooks/use-mobile"
import { getDrawableNameSuggestions } from "@/services/icon-pack"
import type {
  AppInfoDTO,
  DrawableNameSuggestion,
  SuggestionSource,
} from "@/types/icon-pack"

interface DrawableNameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  app: AppInfoDTO
  iconPackId: string
  designerId: string
  onConfirm: (drawableName: string) => void
  isSubmitting?: boolean
}

interface SuggestionItemProps {
  suggestion: DrawableNameSuggestion
  isSelected: boolean
  onSelect: () => void
}

function SuggestionItem({
  suggestion,
  isSelected,
  onSelect,
}: SuggestionItemProps) {
  const { t } = useTranslation()

  const getBadgeVariant = (
    source: SuggestionSource
  ): "default" | "secondary" | "outline" => {
    switch (source) {
      case "iconpack":
        return "default"
      case "designer":
        return "secondary"
      case "none":
        return "outline"
    }
  }

  return (
    <CommandItem value={suggestion.drawable} onSelect={onSelect}>
      <Check
        className={cn(
          "mr-2 h-4 w-4",
          isSelected ? "opacity-100" : "opacity-0"
        )}
      />
      <span className="flex-1 font-mono text-sm">{suggestion.drawable}</span>
      <Badge variant={getBadgeVariant(suggestion.from)} className="ml-2">
        {t(`dialogs.drawableName.source.${suggestion.from}`)}
      </Badge>
    </CommandItem>
  )
}

export function DrawableNameDialog({
  open,
  onOpenChange,
  app,
  iconPackId,
  designerId,
  onConfirm,
  isSubmitting = false,
}: DrawableNameDialogProps) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  const [inputValue, setInputValue] = useState("")
  const [suggestions, setSuggestions] = useState<DrawableNameSuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [comboboxOpen, setComboboxOpen] = useState(false)

  // Fetch suggestions when dialog opens
  useEffect(() => {
    if (!open) return

    const controller = new AbortController()
    setIsLoadingSuggestions(true)

    getDrawableNameSuggestions(app.packageName, iconPackId, designerId)
      .then((data) => {
        // Sort: iconpack > designer > none
        const sortOrder = { iconpack: 0, designer: 1, none: 2 }
        const sorted = data.sort((a, b) => sortOrder[a.from] - sortOrder[b.from])
        setSuggestions(sorted)

        // Pre-fill with first suggestion or auto-generated name
        if (sorted.length > 0) {
          setInputValue(sorted[0].drawable)
        } else {
          setInputValue(toDrawableName(app.defaultName))
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch suggestions:", err)
          setSuggestions([])
          // Fallback to auto-generated name
          setInputValue(toDrawableName(app.defaultName))
        }
      })
      .finally(() => setIsLoadingSuggestions(false))

    return () => controller.abort()
  }, [open, app.packageName, app.defaultName, iconPackId, designerId])

  // Validation
  const validateDrawableName = (name: string): string | null => {
    if (!name.trim()) {
      return t("dialogs.drawableName.errorRequired")
    }

    if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      return t("dialogs.drawableName.errorInvalidFormat")
    }

    return null
  }

  // Handle input change
  const handleInputChange = (value: string) => {
    setInputValue(value)
    setValidationError(validateDrawableName(value))
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (drawable: string) => {
    setInputValue(drawable)
    setValidationError(validateDrawableName(drawable))
    setComboboxOpen(false)
  }

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const error = validateDrawableName(inputValue)
    if (error) {
      setValidationError(error)
      return
    }

    onConfirm(inputValue.trim())
  }

  // Handle dialog close
  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      setInputValue("")
      setSuggestions([])
      setValidationError(null)
      setComboboxOpen(false)
    }
    onOpenChange(open)
  }

  // Filter suggestions based on input
  const filteredSuggestions = suggestions.filter((s) =>
    s.drawable.toLowerCase().includes(inputValue.toLowerCase())
  )

  const SuggestionsList = () => (
    <Command shouldFilter={false}>
      <CommandInput
        placeholder={t("dialogs.drawableName.searchPlaceholder")}
        value={inputValue}
        onValueChange={handleInputChange}
      />
      <CommandList>
        <CommandEmpty>{t("dialogs.drawableName.noSuggestions")}</CommandEmpty>
        <CommandGroup>
          {filteredSuggestions.map((suggestion) => (
            <SuggestionItem
              key={suggestion.drawable}
              suggestion={suggestion}
              isSelected={inputValue === suggestion.drawable}
              onSelect={() => handleSuggestionSelect(suggestion.drawable)}
            />
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("dialogs.drawableName.title")}</DialogTitle>
            <DialogDescription>
              {t("dialogs.drawableName.description", {
                appName: app.defaultName,
                packageName: app.packageName,
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <label className="text-sm font-medium">
              {t("dialogs.drawableName.inputLabel")}
            </label>

            {isLoadingSuggestions ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : suggestions.length === 0 ? (
              // No suggestions - simple input
              <Input
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={t("dialogs.drawableName.inputPlaceholder")}
                disabled={isSubmitting}
                autoFocus
                className={cn(
                  "font-mono",
                  validationError && "border-destructive"
                )}
              />
            ) : isMobile ? (
              // Mobile - Drawer
              <Drawer open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <DrawerTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="w-full justify-between font-mono"
                    disabled={isSubmitting}
                  >
                    {inputValue || t("dialogs.drawableName.inputPlaceholder")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <div className="mt-4 border-t">
                    <SuggestionsList />
                  </div>
                </DrawerContent>
              </Drawer>
            ) : (
              // Desktop - Popover
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="w-full justify-between font-mono"
                    disabled={isSubmitting}
                  >
                    {inputValue || t("dialogs.drawableName.inputPlaceholder")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                >
                  <SuggestionsList />
                </PopoverContent>
              </Popover>
            )}

            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={!!validationError || !inputValue.trim() || isSubmitting}
            >
              {isSubmitting ? t("common.loading") : t("common.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

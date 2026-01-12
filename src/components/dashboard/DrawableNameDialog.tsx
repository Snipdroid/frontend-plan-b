import { useState, useEffect, useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Check, ChevronsUpDown, Edit2, Sparkles, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toDrawableName } from "@/lib/drawable"
import { useIsMobile } from "@/hooks/use-mobile"
import { useDrawableNameSuggestions } from "@/hooks/swr"
import type {
  AppInfoDTO,
  DrawableNameSuggestion,
  SuggestionSource,
} from "@/types/icon-pack"

const MAX_CATEGORY_LENGTH = 50

interface DrawableNameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  app: AppInfoDTO
  iconPackId: string
  designerId: string
  onConfirm: (drawableName: string, categories: string[]) => void
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
      case "iconPack":
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
  const [validationError, setValidationError] = useState<string | null>(null)
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [mode, setMode] = useState<"custom" | "suggestions">("custom")

  // Categories state
  const [categories, setCategories] = useState<string[]>([])
  const [categoryInput, setCategoryInput] = useState("")
  const [categoryError, setCategoryError] = useState<string | null>(null)

  // Use SWR hook for fetching suggestions (only when dialog is open)
  const {
    data: rawSuggestions = [],
    isLoading: isLoadingSuggestions,
  } = useDrawableNameSuggestions(open ? app.packageName : undefined, iconPackId, designerId)

  // Process suggestions: filter, sort, deduplicate (keep in component - UI-specific logic)
  const suggestions = useMemo(() => {
    // Filter out suggestions with empty drawable names
    const validSuggestions = rawSuggestions.filter(s => s.drawable && s.drawable.trim() !== "")

    // Sort by priority: iconPack > designer > none
    const sortOrder = { iconPack: 0, designer: 1, none: 2 }
    const sorted = validSuggestions.sort((a, b) => sortOrder[a.from] - sortOrder[b.from])

    // Deduplicate by drawable name, keeping the one with highest priority (closest to user)
    return Array.from(
      sorted.reduce((map, suggestion) => {
        // Only add if drawable name doesn't exist yet (first occurrence = highest priority)
        if (!map.has(suggestion.drawable)) {
          map.set(suggestion.drawable, suggestion)
        }
        return map
      }, new Map<string, DrawableNameSuggestion>()).values()
    )
  }, [rawSuggestions])

  // Validation - must be declared before useEffect that uses it
  const validateDrawableName = useCallback((name: string): string | null => {
    if (!name.trim()) {
      return t("dialogs.drawableName.errorRequired")
    }

    if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      return t("dialogs.drawableName.errorInvalidFormat")
    }

    return null
  }, [t])

  // Pre-fill input when dialog opens or suggestions change
  useEffect(() => {
    if (open && !inputValue) {
      if (suggestions.length > 0) {
        const prefillValue = suggestions[0].drawable
        setInputValue(prefillValue)
        setValidationError(validateDrawableName(prefillValue))
        setMode("suggestions")
      } else if (!isLoadingSuggestions) {
        const generatedValue = toDrawableName(app.defaultName)
        setInputValue(generatedValue)
        setValidationError(validateDrawableName(generatedValue))
      }
    }
  }, [open, suggestions, app.defaultName, validateDrawableName, isLoadingSuggestions, inputValue])

  // Handle input change
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value)
    setValidationError(validateDrawableName(value))
  }, [validateDrawableName])

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((drawable: string) => {
    setInputValue(drawable)
    setValidationError(validateDrawableName(drawable))
    setComboboxOpen(false)
  }, [validateDrawableName])

  // Category handling
  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addCategory()
    }
  }

  const addCategory = () => {
    const trimmed = categoryInput.trim()
    if (!trimmed) return

    if (trimmed.length > MAX_CATEGORY_LENGTH) {
      setCategoryError(t("iconPack.categoryTooLong"))
      return
    }

    if (categories.includes(trimmed)) {
      setCategoryInput("")
      return
    }

    setCategories([...categories, trimmed])
    setCategoryInput("")
    setCategoryError(null)
  }

  const removeCategory = (category: string) => {
    setCategories(categories.filter((c) => c !== category))
  }

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const error = validateDrawableName(inputValue)
    if (error) {
      setValidationError(error)
      return
    }

    onConfirm(inputValue.trim(), categories)
  }

  // Handle dialog close
  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      setInputValue("")
      setValidationError(null)
      setComboboxOpen(false)
      setMode("custom") // Reset mode
      setCategories([])
      setCategoryInput("")
      setCategoryError(null)
    }
    onOpenChange(open)
  }

  // Filter suggestions based on input
  const filteredSuggestions = suggestions.filter((s) =>
    s.drawable.toLowerCase().includes(inputValue.toLowerCase())
  )

  const SuggestionsList = useMemo(() => (
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
  ), [filteredSuggestions, inputValue, t, handleInputChange, handleSuggestionSelect])

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
            {isLoadingSuggestions ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <>
                {/* Custom Input Card */}
                <Card
                  className={cn(
                    "cursor-pointer transition-all hover:bg-accent/50",
                    mode === "custom" && "ring-2 ring-primary bg-accent/10"
                  )}
                  onClick={() => setMode("custom")}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Edit2 className="h-4 w-4" />
                      {t("dialogs.drawableName.customOption.title")}
                    </CardTitle>
                    <CardDescription>
                      {t("dialogs.drawableName.customOption.description")}
                    </CardDescription>
                  </CardHeader>
                  {mode === "custom" && (
                    <CardContent>
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
                      {validationError && (
                        <p className="text-sm text-destructive mt-2">
                          {validationError}
                        </p>
                      )}
                    </CardContent>
                  )}
                </Card>

                {/* Suggestions Card - Only show if suggestions exist */}
                {suggestions.length > 0 && (
                  <Card
                    className={cn(
                      "cursor-pointer transition-all hover:bg-accent/50",
                      mode === "suggestions" && "ring-2 ring-primary bg-accent/10"
                    )}
                    onClick={() => setMode("suggestions")}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        {t("dialogs.drawableName.suggestionsOption.title")}
                        <Badge variant="secondary" className="ml-auto">
                          {suggestions.length}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {t("dialogs.drawableName.suggestionsOption.description")}
                      </CardDescription>
                    </CardHeader>
                    {mode === "suggestions" && (
                      <CardContent>
                        {isMobile ? (
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
                                {SuggestionsList}
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
                              {SuggestionsList}
                            </PopoverContent>
                          </Popover>
                        )}
                      </CardContent>
                    )}
                  </Card>
                )}
              </>
            )}

            {/* Categories Section */}
            {!isLoadingSuggestions && (
              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="categories-input">
                  {t("iconPack.categories")}
                </Label>

                {/* Category chips */}
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {categories.map((category) => (
                      <Badge
                        key={category}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {category}
                        <button
                          type="button"
                          onClick={() => removeCategory(category)}
                          className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                          disabled={isSubmitting}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Category input */}
                <Input
                  id="categories-input"
                  value={categoryInput}
                  onChange={(e) => {
                    setCategoryInput(e.target.value)
                    setCategoryError(null)
                  }}
                  onKeyDown={handleCategoryKeyDown}
                  placeholder={t("iconPack.categoriesPlaceholder")}
                  disabled={isSubmitting}
                  className={cn(categoryError && "border-destructive")}
                />
                {categoryError && (
                  <p className="text-sm text-destructive">{categoryError}</p>
                )}
              </div>
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

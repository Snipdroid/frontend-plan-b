import { useState } from "react"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { useAuth } from "react-oidc-context"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useAppTags } from "@/hooks"
import { convertAppInfoDTOToAppInfo } from "@/lib/copy-utils"
import { AddTagDialog } from "@/components/search/AddTagDialog"
import type { AppInfoDTO } from "@/types/icon-pack"

const MAX_CATEGORY_LENGTH = 50

interface CategoriesEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appName: string
  appInfo?: AppInfoDTO
  initialCategories: string[]
  onConfirm: (categories: string[]) => void
  isSubmitting?: boolean
}

export function CategoriesEditDialog({
  open,
  onOpenChange,
  appName,
  appInfo,
  initialCategories,
  onConfirm,
  isSubmitting = false,
}: CategoriesEditDialogProps) {
  const { t } = useTranslation()
  const auth = useAuth()

  // Fetch app tags for suggestions
  const { data: tags = [], mutate: mutateTags } = useAppTags(appInfo?.id)

  // Convert AppInfoDTO to AppInfo for AddTagDialog
  const appInfoForDialog = appInfo ? convertAppInfoDTOToAppInfo(appInfo) : null

  // State for AddTagDialog
  const [addTagDialogOpen, setAddTagDialogOpen] = useState(false)

  // Initialize state directly from props - component remounts with key
  const [categories, setCategories] = useState<string[]>(initialCategories)
  const [categoryInput, setCategoryInput] = useState("")
  const [categoryError, setCategoryError] = useState<string | null>(null)

  // Filter tag suggestions (exclude already-selected categories)
  const tagSuggestions = tags.filter(tag => !categories.includes(tag.name))

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

  const addCategoryFromTag = (tagName: string) => {
    if (!categories.includes(tagName)) {
      setCategories([...categories, tagName])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm(categories)
  }

  // Component remounts with key, so no manual reset needed
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("iconPack.editCategories")}</DialogTitle>
            <DialogDescription>{appName}</DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <Label htmlFor="categories-input">{t("iconPack.categories")}</Label>

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

            {/* Tag suggestions */}
            {tagSuggestions.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">
                  {t("iconPack.suggestionsFromTags")}
                </p>
                <div className="flex flex-wrap gap-1">
                  {tagSuggestions.map((tag) => (
                    <Badge
                      key={tag.id ?? tag.name}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => addCategoryFromTag(tag.name)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : tags.length === 0 && appInfoForDialog ? (
              <p className="text-sm text-muted-foreground">
                {t("iconPack.noTagsForSuggestions")}{" "}
                <button
                  type="button"
                  className="underline hover:text-foreground"
                  onClick={() => {
                    if (!auth.isAuthenticated) {
                      auth.signinRedirect()
                      return
                    }
                    setAddTagDialogOpen(true)
                  }}
                >
                  {t("iconPack.addTagsForApp")}
                </button>
              </p>
            ) : null}
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("common.loading") : t("common.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {appInfoForDialog && (
        <AddTagDialog
          app={appInfoForDialog}
          currentTags={tags}
          open={addTagDialogOpen}
          onOpenChange={setAddTagDialogOpen}
          onTagAdded={() => mutateTags()}
        />
      )}
    </Dialog>
  )
}

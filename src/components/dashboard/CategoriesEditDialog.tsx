import { useState, useEffect, startTransition } from "react"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
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

const MAX_CATEGORY_LENGTH = 50

interface CategoriesEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appName: string
  initialCategories: string[]
  onConfirm: (categories: string[]) => void
  isSubmitting?: boolean
}

export function CategoriesEditDialog({
  open,
  onOpenChange,
  appName,
  initialCategories,
  onConfirm,
  isSubmitting = false,
}: CategoriesEditDialogProps) {
  const { t } = useTranslation()

  const [categories, setCategories] = useState<string[]>([])
  const [categoryInput, setCategoryInput] = useState("")
  const [categoryError, setCategoryError] = useState<string | null>(null)

  // Initialize categories when dialog opens
  useEffect(() => {
    if (open) {
      startTransition(() => {
        setCategories([...initialCategories])
        setCategoryInput("")
        setCategoryError(null)
      })
    }
  }, [open, initialCategories])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm(categories)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      setCategories([])
      setCategoryInput("")
      setCategoryError(null)
    }
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
    </Dialog>
  )
}

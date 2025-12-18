import { useState, useEffect } from "react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getAllTags, addTagToApp, getTagsForApp } from "@/services/app-info"
import type { AppInfo, Tag } from "@/types"

interface AddTagDialogProps {
  app: AppInfo
  currentTags: Tag[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onTagAdded: (newTags: Tag[]) => void
}

export function AddTagDialog({
  app,
  currentTags,
  open,
  onOpenChange,
  onTagAdded,
}: AddTagDialogProps) {
  const auth = useAuth()
  const { t } = useTranslation()
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [selectedTagId, setSelectedTagId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all available tags when dialog opens
  useEffect(() => {
    if (!open) return

    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    getAllTags(controller.signal)
      .then(setAllTags)
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Failed to fetch tags")
        }
      })
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [open])

  // Filter out tags already on the app
  const availableTags = allTags.filter(
    (tag) => !currentTags.some((ct) => ct.id === tag.id)
  )

  const handleAddTag = async () => {
    if (!selectedTagId || !auth.user?.access_token) return

    setIsAdding(true)
    setError(null)

    try {
      await addTagToApp(app.id, selectedTagId, auth.user.access_token)
      // Refetch tags after adding
      const updatedTags = await getTagsForApp(app.id)
      onTagAdded(updatedTags)
      onOpenChange(false)
      setSelectedTagId("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add tag")
    } finally {
      setIsAdding(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedTagId("")
      setError(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialogs.addTag.title")}</DialogTitle>
          <DialogDescription>
            {t("dialogs.addTag.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : availableTags.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("dialogs.addTag.noAvailableTags")}
            </p>
          ) : (
            <Select value={selectedTagId} onValueChange={setSelectedTagId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("dialogs.addTag.selectTag")} />
              </SelectTrigger>
              <SelectContent>
                {availableTags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id!}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isAdding}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleAddTag}
            disabled={!selectedTagId || isAdding || !auth.isAuthenticated}
          >
            {isAdding ? t("common.loading") : t("common.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

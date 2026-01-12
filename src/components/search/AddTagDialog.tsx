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
import { getAllTags, addTagToApp } from "@/services/app-info"
import type { AppInfo, Tag } from "@/types"

interface AddTagDialogProps {
  app: AppInfo
  currentTags: Tag[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onTagAdded: () => void
}

interface TagListProps {
  tags: Tag[]
  selectedTagId: string
  onSelect: (tagId: string) => void
  searchPlaceholder: string
  emptyText: string
}

function TagList({ tags, selectedTagId, onSelect, searchPlaceholder, emptyText }: TagListProps) {
  return (
    <Command>
      <CommandInput placeholder={searchPlaceholder} />
      <CommandList>
        <CommandEmpty>{emptyText}</CommandEmpty>
        <CommandGroup>
          {tags.map((tag) => (
            <CommandItem
              key={tag.id}
              value={tag.name}
              onSelect={() => onSelect(tag.id!)}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  selectedTagId === tag.id ? "opacity-100" : "opacity-0"
                )}
              />
              {tag.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
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
  const isMobile = useIsMobile()
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [selectedTagId, setSelectedTagId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [comboboxOpen, setComboboxOpen] = useState(false)

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

  const selectedTag = availableTags.find((tag) => tag.id === selectedTagId)

  const handleAddTag = async () => {
    if (!selectedTagId || !auth.user?.access_token) return

    setIsAdding(true)
    setError(null)

    try {
      await addTagToApp(app.id, selectedTagId, auth.user.access_token)
      onTagAdded()
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
      setComboboxOpen(false)
    }
    onOpenChange(open)
  }

  const handleTagSelect = (tagId: string) => {
    setSelectedTagId(tagId === selectedTagId ? "" : tagId)
    setComboboxOpen(false)
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
          ) : isMobile ? (
            <Drawer open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <DrawerTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full justify-between"
                >
                  {selectedTag
                    ? selectedTag.name
                    : t("dialogs.addTag.selectTag")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="mt-4 border-t">
                  <TagList
                    tags={availableTags}
                    selectedTagId={selectedTagId}
                    onSelect={handleTagSelect}
                    searchPlaceholder={t("dialogs.addTag.searchTag")}
                    emptyText={t("dialogs.addTag.noTagFound")}
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
                  {selectedTag
                    ? selectedTag.name
                    : t("dialogs.addTag.selectTag")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <TagList
                  tags={availableTags}
                  selectedTagId={selectedTagId}
                  onSelect={handleTagSelect}
                  searchPlaceholder={t("dialogs.addTag.searchTag")}
                  emptyText={t("dialogs.addTag.noTagFound")}
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

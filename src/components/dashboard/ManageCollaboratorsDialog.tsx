import { useState, useCallback } from "react"
import { useAuth } from "react-oidc-context"
import { useTranslation } from "react-i18next"
import { Check, ChevronsUpDown } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  addIconPackCollaborators,
  removeIconPackCollaborators,
} from "@/services/icon-pack"
import { searchDesigners } from "@/services/designer"
import { CollaboratorListItem } from "./CollaboratorListItem"
import { useIconPackCollaborators } from "@/hooks/swr"
import type { DesignerDTO } from "@/types/user"

interface ManageCollaboratorsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  iconPackId: string
  iconPackName: string
  isOwner: boolean
  currentUserId: string
  onCollaboratorsChanged: () => void
}

export function ManageCollaboratorsDialog({
  open,
  onOpenChange,
  iconPackId,
  isOwner,
  currentUserId,
  onCollaboratorsChanged,
}: ManageCollaboratorsDialogProps) {
  const auth = useAuth()
  const { t } = useTranslation()

  // Use SWR hook for collaborators
  const {
    data: collaborators = [],
    isLoading,
    mutate: refreshCollaborators,
  } = useIconPackCollaborators(iconPackId)

  const [isAdding, setIsAdding] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<DesignerDTO[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [selectedDesigner, setSelectedDesigner] = useState<DesignerDTO | null>(null)

  // Search for designers
  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query)

      if (!auth.user?.access_token || !query.trim()) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const results = await searchDesigners(auth.user.access_token, query.trim())

        // Filter out current user and existing collaborators
        const filtered = results.items.filter(
          (designer) =>
            designer.id !== currentUserId &&
            !collaborators.some((c) => c.id === designer.id)
        )

        setSearchResults(filtered)
      } catch (error) {
        console.error("Failed to search designers:", error)
        // Show clear error message about missing API
        if (
          error instanceof Error &&
          error.message.includes("Designer search API not yet implemented")
        ) {
          toast.error(
            t("iconPack.designerSearchNotImplemented") ||
              "Designer search API not yet implemented. Please contact backend team to add GET /designer/search endpoint."
          )
        }
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    },
    [auth.user?.access_token, currentUserId, collaborators, t]
  )

  const handleAddCollaborator = async () => {
    if (!auth.user?.access_token || !selectedDesigner?.id) return

    setIsAdding(true)
    try {
      await addIconPackCollaborators(auth.user.access_token, iconPackId, [selectedDesigner.id])

      toast.success(t("iconPack.collaboratorAdded"))
      setSelectedDesigner(null)
      setSearchQuery("")
      setSearchResults([])
      setComboboxOpen(false)
      await refreshCollaborators()
      onCollaboratorsChanged()
    } catch (error) {
      console.error("Failed to add collaborator:", error)
      toast.error(t("iconPack.failedToAddCollaborator"))
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveCollaborator = async (designerId: string) => {
    if (!auth.user?.access_token) return

    setRemovingId(designerId)
    try {
      await removeIconPackCollaborators(auth.user.access_token, iconPackId, [designerId])

      toast.success(t("iconPack.collaboratorRemoved"))
      await refreshCollaborators()
      onCollaboratorsChanged()
    } catch (error) {
      console.error("Failed to remove collaborator:", error)
      toast.error(t("iconPack.failedToRemoveCollaborator"))
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("iconPack.manageCollaborators")}</DialogTitle>
          <DialogDescription>
            {isOwner
              ? t("iconPack.collaboratorsDescOwner")
              : t("iconPack.collaboratorsDescCollaborator")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Current Collaborators */}
          <div>
            <h3 className="text-sm font-medium mb-2">
              {t("dialogs.manageCollaborators.currentCollaborators")}
            </h3>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
            ) : collaborators.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("iconPack.noCollaborators")}</p>
            ) : (
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-2">
                  {collaborators.map((collaborator) => (
                    <CollaboratorListItem
                      key={collaborator.id}
                      designer={collaborator}
                      canRemove={isOwner}
                      onRemove={handleRemoveCollaborator}
                      isRemoving={removingId === collaborator.id}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {isOwner && (
            <>
              <Separator />

              {/* Add New Collaborator */}
              <div>
                <h3 className="text-sm font-medium mb-2">
                  {t("dialogs.manageCollaborators.addNew")}
                </h3>
                <div className="flex gap-2">
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboboxOpen}
                        className="flex-1 justify-between"
                        disabled={isAdding}
                      >
                        {selectedDesigner
                          ? `${selectedDesigner.name || selectedDesigner.email}`
                          : t("dialogs.manageCollaborators.selectDesigner")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder={t("dialogs.manageCollaborators.searchPlaceholder")}
                          value={searchQuery}
                          onValueChange={handleSearch}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {isSearching
                              ? t("dialogs.manageCollaborators.searching")
                              : searchQuery.trim()
                                ? t("iconPack.designerNotFound")
                                : t("dialogs.manageCollaborators.typeToSearch")}
                          </CommandEmpty>
                          {searchResults.length > 0 && (
                            <CommandGroup>
                              {searchResults.map((designer) => (
                                <CommandItem
                                  key={designer.id}
                                  value={designer.id}
                                  onSelect={() => {
                                    setSelectedDesigner(designer)
                                    setComboboxOpen(false)
                                  }}
                                  className="group/designer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedDesigner?.id === designer.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {designer.name || designer.email}
                                    </span>
                                    {designer.name && designer.email && (
                                      <span className="text-xs text-muted-foreground group-data-[selected=true]/designer:text-accent-foreground">
                                        {designer.email}
                                      </span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button
                    onClick={handleAddCollaborator}
                    disabled={isAdding || !selectedDesigner}
                  >
                    {isAdding ? t("dialogs.manageCollaborators.adding") : t("common.add")}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t("dialogs.manageCollaborators.searchHint")}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

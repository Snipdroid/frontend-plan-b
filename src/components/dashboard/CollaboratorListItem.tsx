import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { DesignerDTO } from "@/types/user"

interface CollaboratorListItemProps {
  designer: DesignerDTO
  canRemove: boolean
  onRemove: (designerId: string) => void
  isRemoving: boolean
}

export function CollaboratorListItem({
  designer,
  canRemove,
  onRemove,
  isRemoving,
}: CollaboratorListItemProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <Avatar className="h-10 w-10">
        <AvatarFallback>
          {designer.name?.charAt(0).toUpperCase() || designer.email?.charAt(0).toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{designer.name || designer.email}</p>
        {designer.email && designer.name && (
          <p className="text-xs text-muted-foreground truncate">{designer.email}</p>
        )}
      </div>
      {canRemove && (
        <Button
          variant="destructive"
          size="icon"
          onClick={() => designer.id && onRemove(designer.id)}
          disabled={isRemoving || !designer.id}
          title={t("iconPack.removeCollaborator")}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

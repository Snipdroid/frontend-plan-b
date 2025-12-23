import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"

interface OwnershipBadgeProps {
  isOwner: boolean
}

export function OwnershipBadge({ isOwner }: OwnershipBadgeProps) {
  const { t } = useTranslation()

  return (
    <Badge variant={isOwner ? "default" : "secondary"} className="text-xs">
      {isOwner ? t("common.owner") : t("common.collaborator")}
    </Badge>
  )
}

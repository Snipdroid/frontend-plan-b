import { Plus } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "react-oidc-context"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AppIcon } from "@/components/ui/app-icon"
import { useLocalizedName, useAppTags, useMediaQuery } from "@/hooks"
import { LocalizedNamesList } from "@/components/search/LocalizedNamesList"
import { AddTagDialog } from "@/components/search/AddTagDialog"
import type { AppInfo } from "@/types"

interface DashboardAppDetailSheetProps {
  app: AppInfo | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DashboardAppDetailSheet({
  app,
  open,
  onOpenChange,
}: DashboardAppDetailSheetProps) {
  const { t } = useTranslation()
  const auth = useAuth()
  const displayName = useLocalizedName(app?.localizedNames ?? [])
  const isMobile = useMediaQuery("(max-width: 767px)")
  const [isAddTagDialogOpen, setIsAddTagDialogOpen] = useState(false)

  const {
    data: tags = [],
    isLoading: isLoadingTags,
    mutate: mutateTags,
  } = useAppTags(app?.id)

  if (!app) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "max-h-[80vh] overflow-y-auto"
            : "w-80 overflow-y-auto"
        }
      >
        <SheetHeader>
          <SheetTitle>{displayName}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-4">
          <AppIcon
            packageName={app.packageName}
            appName={displayName}
            className="h-16 w-16"
            rounded="xl"
          />

          <div className="space-y-3 text-sm">
            <div>
              <div className="text-muted-foreground mb-1">
                {t("appDetail.package")}
              </div>
              <div className="font-mono break-all">{app.packageName}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">
                {t("appDetail.activity")}
              </div>
              <div className="font-mono break-all">{app.mainActivity}</div>
            </div>
            {app.count !== undefined && (
              <div>
                <div className="text-muted-foreground mb-1">
                  {t("appDetail.count")}
                </div>
                <div className="tabular-nums">{app.count}</div>
              </div>
            )}
            {app.drawable && (
              <div>
                <div className="text-muted-foreground mb-1">
                  {t("iconPack.drawable")}
                </div>
                <div className="font-mono">{app.drawable}</div>
              </div>
            )}
            <div>
              <div className="text-muted-foreground mb-1">
                {t("appDetail.tags")}
              </div>
              {isLoadingTags ? (
                <div className="flex min-h-[22px] flex-wrap gap-1">
                  <Skeleton className="h-[22px] w-16 rounded-full" />
                  <Skeleton className="h-[22px] w-20 rounded-full" />
                  <Skeleton className="h-[22px] w-14 rounded-full" />
                </div>
              ) : (
                <div className="flex min-h-[22px] flex-wrap gap-1">
                  <TooltipProvider>
                    {tags.map((tag) => (
                      <Tooltip key={tag.id ?? tag.name}>
                        <TooltipTrigger asChild>
                          <Badge variant="secondary">{tag.name}</Badge>
                        </TooltipTrigger>
                        {tag.description && (
                          <TooltipContent>
                            <p>{tag.description}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    ))}
                    <Badge
                      variant="outline"
                      className="h-[22px] cursor-pointer hover:bg-accent"
                      onClick={() => {
                        if (!auth.isAuthenticated) {
                          auth.signinRedirect()
                          return
                        }
                        setIsAddTagDialogOpen(true)
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Badge>
                  </TooltipProvider>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">
              {t("appDetail.localizedNames")}
            </h4>
            <LocalizedNamesList localizedNames={app.localizedNames} />
          </div>
        </div>

        <AddTagDialog
          key={app.id}
          app={app}
          currentTags={tags}
          open={isAddTagDialogOpen}
          onOpenChange={setIsAddTagDialogOpen}
          onTagAdded={() => mutateTags()}
        />
      </SheetContent>
    </Sheet>
  )
}

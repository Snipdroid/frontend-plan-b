import { useState } from "react"
import { X, Plus, ChevronDown } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuth } from "react-oidc-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AppIcon } from "@/components/ui/app-icon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useLocalizedName, useAppTags } from "@/hooks"
import { LocalizedNamesList } from "./LocalizedNamesList"
import { AddTagDialog } from "./AddTagDialog"
import { MarkAsAdaptedDialog } from "./MarkAsAdaptedDialog"
import type { AppInfo } from "@/types"

interface AppDetailPanelProps {
  app: AppInfo | null
  onClose: () => void
}

export function AppDetailPanel({ app, onClose }: AppDetailPanelProps) {
  const { t } = useTranslation()
  const auth = useAuth()
  const displayName = useLocalizedName(app?.localizedNames ?? [])
  const [isAddTagDialogOpen, setIsAddTagDialogOpen] = useState(false)
  const [isMarkAsAdaptedDialogOpen, setIsMarkAsAdaptedDialogOpen] = useState(false)

  const { data: tags = [], isLoading: isLoadingTags, mutate: mutateTags } = useAppTags(app?.id)

  if (!app) {
    return null
  }

  return (
    <div className="sticky top-16 rounded-lg border bg-card p-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold truncate">{displayName}</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label={t("appDetail.close")}
          className="shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <AppIcon
          packageName={app.packageName}
          appName={displayName}
          className="h-16 w-16"
          rounded="xl"
        />

        {auth.isAuthenticated && (
          <div className="flex w-full">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-r-none"
              onClick={() => setIsMarkAsAdaptedDialogOpen(true)}
            >
              {t("appDetail.markAsAdapted")}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-l-none border-l-0 px-2"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setIsMarkAsAdaptedDialogOpen(true)}>
                  {t("appDetail.markAsAdapted")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div className="space-y-3 text-sm">
          <div>
            <div className="text-muted-foreground mb-1">{t("appDetail.package")}</div>
            <div className="font-mono break-all">{app.packageName}</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">{t("appDetail.activity")}</div>
            <div className="font-mono break-all">{app.mainActivity}</div>
          </div>
          {app.count !== undefined && (
            <div>
              <div className="text-muted-foreground mb-1">{t("appDetail.count")}</div>
              <div className="tabular-nums">{app.count}</div>
            </div>
          )}
          <div>
            <div className="text-muted-foreground mb-1">{t("appDetail.tags")}</div>
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
          <h4 className="text-sm font-medium mb-3">{t("appDetail.localizedNames")}</h4>
          <LocalizedNamesList localizedNames={app.localizedNames} />
        </div>
      </div>

      <AddTagDialog
        key={`add-tag-${app.id}`}
        app={app}
        currentTags={tags}
        open={isAddTagDialogOpen}
        onOpenChange={setIsAddTagDialogOpen}
        onTagAdded={() => mutateTags()}
      />

      <MarkAsAdaptedDialog
        key={`mark-adapted-${app.id}`}
        app={app}
        open={isMarkAsAdaptedDialogOpen}
        onOpenChange={setIsMarkAsAdaptedDialogOpen}
      />
    </div>
  )
}

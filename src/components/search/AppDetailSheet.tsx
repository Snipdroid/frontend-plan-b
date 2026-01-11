import { useState, useEffect } from "react"
import { Plus, ChevronDown } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuth } from "react-oidc-context"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
import { useLocalizedName } from "@/hooks"
import { API_BASE_URL } from "@/services/api"
import { getTagsForApp } from "@/services/app-info"
import { LocalizedNamesList } from "./LocalizedNamesList"
import { AddTagDialog } from "./AddTagDialog"
import { MarkAsAdaptedDialog } from "./MarkAsAdaptedDialog"
import type { AppInfo, Tag } from "@/types"

function getAppIconUrl(packageName: string): string {
  const base = API_BASE_URL || ""
  return `${base}/app-icon?packageName=${encodeURIComponent(packageName)}`
}

interface AppDetailSheetProps {
  app: AppInfo | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AppDetailSheet({ app, open, onOpenChange }: AppDetailSheetProps) {
  const { t } = useTranslation()
  const auth = useAuth()
  const displayName = useLocalizedName(app?.localizedNames ?? [])
  const [failedIconPackage, setFailedIconPackage] = useState<string | null>(null)
  const [tagData, setTagData] = useState<{ appId: string | null; tags: Tag[] }>({ appId: null, tags: [] })
  const [isAddTagDialogOpen, setIsAddTagDialogOpen] = useState(false)
  const [isMarkAsAdaptedDialogOpen, setIsMarkAsAdaptedDialogOpen] = useState(false)

  // Derive iconError - automatically resets when app changes
  const iconError = failedIconPackage === app?.packageName

  // Derive tags and loading state - automatically resets when app changes
  const tags = tagData.appId === app?.id ? tagData.tags : []
  const isLoadingTags = !!app?.id && tagData.appId !== app.id

  // Fetch tags when app changes
  useEffect(() => {
    if (!app?.id) return

    const appId = app.id
    const controller = new AbortController()
    getTagsForApp(appId, controller.signal)
      .then((fetchedTags) => setTagData({ appId, tags: fetchedTags }))
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Failed to fetch tags:", error)
          setTagData({ appId, tags: [] })
        }
      })

    return () => controller.abort()
  }, [app?.id])

  if (!app) {
    return null
  }

  const iconElement = iconError ? (
    <div className="h-16 w-16 shrink-0 rounded-xl bg-muted flex items-center justify-center text-muted-foreground text-lg">
      ?
    </div>
  ) : (
    <img
      src={getAppIconUrl(app.packageName)}
      alt={`${displayName} icon`}
      className="h-16 w-16 shrink-0 rounded-xl object-cover"
      onError={() => setFailedIconPackage(app.packageName)}
    />
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{displayName}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-4">
          {iconElement}

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
          app={app}
          currentTags={tags}
          open={isAddTagDialogOpen}
          onOpenChange={setIsAddTagDialogOpen}
          onTagAdded={(newTags) => setTagData({ appId: app.id, tags: newTags })}
        />

        <MarkAsAdaptedDialog
          app={app}
          open={isMarkAsAdaptedDialogOpen}
          onOpenChange={setIsMarkAsAdaptedDialogOpen}
        />
      </SheetContent>
    </Sheet>
  )
}

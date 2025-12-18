import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
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
  const displayName = useLocalizedName(app?.localizedNames ?? [])
  const [iconError, setIconError] = useState(false)
  const [tags, setTags] = useState<Tag[]>([])

  // Reset icon error when app changes
  useEffect(() => {
    setIconError(false)
  }, [app?.packageName])

  // Fetch tags when app changes
  useEffect(() => {
    if (!app?.id) {
      setTags([])
      return
    }

    const controller = new AbortController()
    getTagsForApp(app.id, controller.signal)
      .then(setTags)
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Failed to fetch tags:", error)
          setTags([])
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
      onError={() => setIconError(true)}
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
            {tags.length > 0 && (
              <div>
                <div className="text-muted-foreground mb-1">{t("appDetail.tags")}</div>
                <div className="flex flex-wrap gap-1">
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
                  </TooltipProvider>
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">{t("appDetail.localizedNames")}</h4>
            <LocalizedNamesList localizedNames={app.localizedNames} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocalizedName } from "@/hooks"
import { API_BASE_URL } from "@/services/api"
import { LocalizedNamesList } from "./LocalizedNamesList"
import type { AppInfo } from "@/types"

function getAppIconUrl(packageName: string): string {
  const base = API_BASE_URL || ""
  return `${base}/app-icon?packageName=${encodeURIComponent(packageName)}`
}

interface AppDetailPanelProps {
  app: AppInfo | null
  onClose: () => void
}

export function AppDetailPanel({ app, onClose }: AppDetailPanelProps) {
  const displayName = useLocalizedName(app?.localizedNames ?? [])
  const [iconError, setIconError] = useState(false)

  // Reset icon error when app changes
  useEffect(() => {
    setIconError(false)
  }, [app?.packageName])

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
    <div className="sticky top-16 rounded-lg border bg-card p-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold truncate">{displayName}</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close detail panel"
          className="shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {iconElement}

        <div className="space-y-3 text-sm">
          <div>
            <div className="text-muted-foreground mb-1">Package</div>
            <div className="font-mono break-all">{app.packageName}</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Activity</div>
            <div className="font-mono break-all">{app.mainActivity}</div>
          </div>
          {app.count !== undefined && (
            <div>
              <div className="text-muted-foreground mb-1">Count</div>
              <div className="tabular-nums">{app.count}</div>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Localized Names</h4>
          <LocalizedNamesList localizedNames={app.localizedNames} />
        </div>
      </div>
    </div>
  )
}

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useLocalizedName } from "@/hooks"
import { API_BASE_URL } from "@/services/api"
import type { AppInfo } from "@/types"

function getAppIconUrl(packageName: string): string {
  const base = API_BASE_URL || ""
  return `${base}/app-icon?packageName=${encodeURIComponent(packageName)}`
}

interface AppInfoCardProps {
  app: AppInfo
  isSelected: boolean
  onToggle: () => void
  onClick: () => void
}

export function AppInfoCard({
  app,
  isSelected,
  onToggle,
  onClick,
}: AppInfoCardProps) {
  const displayName = useLocalizedName(app.localizedNames)
  const [iconError, setIconError] = useState(false)

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggle()
  }

  const iconElement = iconError ? (
    <div className="h-10 w-10 shrink-0 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">
      ?
    </div>
  ) : (
    <img
      src={getAppIconUrl(app.packageName)}
      alt={`${displayName} icon`}
      className="h-10 w-10 shrink-0 rounded-lg object-cover"
      onError={() => setIconError(true)}
    />
  )

  return (
    <div
      className={`rounded-lg border bg-card p-4 cursor-pointer transition-colors hover:bg-accent/50 ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      aria-label={`App: ${displayName}`}
    >
      {/* Desktop layout */}
      <div className="hidden md:flex md:items-center md:gap-3">
        <div onClick={handleCheckboxClick}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggle}
            aria-label={`Select ${displayName}`}
          />
        </div>
        {iconElement}
        <div className="font-medium min-w-0 flex-shrink-0">{displayName}</div>
        <div className="flex flex-col ml-auto text-right min-w-0">
          <span className="font-mono text-sm text-muted-foreground truncate">
            {app.packageName}
          </span>
          <span className="font-mono text-sm text-muted-foreground truncate">
            {app.mainActivity}
          </span>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex flex-col gap-2 md:hidden">
        <div className="flex items-center gap-3">
          {iconElement}
          <div className="font-medium truncate">{displayName}</div>
        </div>
        <div className="font-mono text-sm text-muted-foreground truncate">
          {app.packageName}
        </div>
        <div className="font-mono text-sm text-muted-foreground truncate">
          {app.mainActivity}
        </div>
        <Button
          variant={isSelected ? "secondary" : "outline"}
          size="sm"
          onClick={handleButtonClick}
          className="w-full"
        >
          {isSelected ? "Selected" : "Select"}
        </Button>
      </div>
    </div>
  )
}

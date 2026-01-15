import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { AppIcon } from "@/components/ui/app-icon"
import { useLocalizedName } from "@/hooks"
import type { AppInfo } from "@/types"

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

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggle()
  }

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
        <AppIcon
          packageName={app.packageName}
          appName={displayName}
          className="h-10 w-10"
        />
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
          <AppIcon
            packageName={app.packageName}
            appName={displayName}
            className="h-10 w-10"
          />
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

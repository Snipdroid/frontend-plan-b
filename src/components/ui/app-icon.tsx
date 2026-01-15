import { cn } from "@/lib/utils"
import { useAppIconUrl } from "@/hooks/swr/useAppIcon"
import {
  generateColorFromString,
  getAppInitials,
  getInitialsFontSize,
} from "@/lib/app-icon-utils"

interface AppIconProps {
  packageName: string
  appName: string
  className?: string
  alt?: string
  rounded?: "sm" | "md" | "lg" | "xl" | "full"
}

/**
 * Generic app icon display component with SWR caching
 * Displays app icons with fallback to colored placeholder with initials
 */
export function AppIcon({
  packageName,
  appName,
  className = "h-10 w-10",
  alt,
  rounded = "lg",
}: AppIconProps) {
  const { objectUrl, error, isLoading } = useAppIconUrl(packageName)

  // Generate fallback data
  const initials = getAppInitials(appName)
  const bgColor = generateColorFromString(packageName)
  const fontSize = getInitialsFontSize(className)

  const roundedClass = `rounded-${rounded}`
  const altText = alt ?? `${appName} icon`

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          "shrink-0 bg-muted animate-pulse",
          roundedClass,
          className
        )}
        aria-label="Loading icon"
      />
    )
  }

  // Success state - show image
  if (objectUrl && !error) {
    return (
      <img
        src={objectUrl}
        alt={altText}
        className={cn("shrink-0 object-cover", roundedClass, className)}
      />
    )
  }

  // Error/fallback state - show placeholder
  return (
    <div
      className={cn(
        "shrink-0 flex items-center justify-center text-white font-semibold",
        bgColor,
        roundedClass,
        fontSize,
        className
      )}
      aria-label={altText}
      role="img"
    >
      {initials}
    </div>
  )
}

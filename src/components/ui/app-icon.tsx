import { useState } from "react"
import { cn } from "@/lib/utils"
import { API_BASE_URL } from "@/services/api"
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
 * Generic app icon display component
 * Displays app icons with fallback to colored placeholder with initials
 */
export function AppIcon({
  packageName,
  appName,
  className = "h-10 w-10",
  alt,
  rounded = "lg",
}: AppIconProps) {
  const [errorUrl, setErrorUrl] = useState<string | null>(null)

  // Generate fallback data
  const initials = getAppInitials(appName)
  const bgColor = generateColorFromString(packageName)
  const fontSize = getInitialsFontSize(className)

  const roundedClass = `rounded-${rounded}`
  const altText = alt ?? `${appName} icon`

  const iconUrl = `${API_BASE_URL}/app-icon?packageName=${encodeURIComponent(packageName)}`
  const hasImageError = errorUrl === iconUrl

  // Success state - show image
  if (!hasImageError) {
    return (
      <img
        src={iconUrl}
        alt={altText}
        className={cn("shrink-0 object-cover", roundedClass, className)}
        onError={() => setErrorUrl(iconUrl)}
        loading="lazy"
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

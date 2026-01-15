/**
 * Utility functions for app icon display and fallback generation
 */

/**
 * Generate a consistent color class from a string using hash
 * @param str - String to hash (typically package name)
 * @returns Tailwind background color class
 */
export function generateColorFromString(str: string): string {
  // Simple hash function
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash // Convert to 32bit integer
  }

  // Define color palette with good contrast against white text
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-teal-500",
    "bg-indigo-500",
    "bg-red-500",
    "bg-cyan-500",
    "bg-amber-500",
  ]

  return colors[Math.abs(hash) % colors.length]
}

/**
 * Extract initials from app name for placeholder display
 * @param appName - Application name
 * @returns Single uppercase letter or "?" for unknown apps
 */
export function getAppInitials(appName: string): string {
  if (!appName || appName === "Unknown") {
    return "?"
  }

  // Remove common prefixes
  const cleaned = appName.replace(/^(The|A|An)\s+/i, "").trim()

  // Split into words
  const words = cleaned.split(/\s+/).filter(Boolean)

  if (words.length === 0) {
    return appName.charAt(0).toUpperCase()
  }

  // Take first character of first word only
  return words[0].charAt(0).toUpperCase()
}

/**
 * Determine appropriate font size class based on icon size
 * @param className - Tailwind className containing size (e.g., "h-10 w-10")
 * @returns Tailwind font size class
 */
export function getInitialsFontSize(className: string): string {
  // Parse size from className (e.g., "h-10 w-10" -> 10)
  const match = className.match(/h-(\d+)/)
  const size = match ? parseInt(match[1]) : 10

  // Map size to font size classes
  if (size <= 8) return "text-xs"
  if (size <= 10) return "text-sm"
  if (size <= 16) return "text-base"
  return "text-lg"
}

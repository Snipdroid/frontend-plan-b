import { useMemo } from "react"
import type { LocalizedName } from "@/types"

export function useLocalizedName(localizedNames: LocalizedName[]): string {
  return useMemo(() => {
    if (!localizedNames || localizedNames.length === 0) {
      return "Unknown"
    }

    const browserLang = navigator.language

    // Try exact match first
    const exactMatch = localizedNames.find(
      (ln) => ln.languageCode.toLowerCase() === browserLang.toLowerCase()
    )
    if (exactMatch) return exactMatch.name

    // Try matching just the language part (e.g., "en" from "en-US")
    const langPart = browserLang.split("-")[0].toLowerCase()
    const partialMatch = localizedNames.find((ln) =>
      ln.languageCode.toLowerCase().startsWith(langPart)
    )
    if (partialMatch) return partialMatch.name

    // Fallback to first item
    return localizedNames[0].name
  }, [localizedNames])
}

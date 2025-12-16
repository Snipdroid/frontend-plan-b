import { transliterate } from "transliteration"
import type { AppInfo, LocalizedName } from "@/types"

/**
 * Enriched localized name with auto-generated drawable name
 */
export interface LocalizedNameForTemplate extends LocalizedName {
  autoDrawable: string
}

/**
 * Enriched app info for template rendering with auto-generated drawable names
 */
export interface AppInfoForTemplate extends Omit<AppInfo, "localizedNames"> {
  defaultName: string
  autoDrawable: string
  localizedNames: LocalizedNameForTemplate[]
}

/**
 * Converts a name to a valid Android drawable name.
 *
 * Drawable naming rules:
 * 1. Only lowercase letters
 * 2. Can contain letters, numbers, and underscores
 * 3. Must start with a letter
 */
export function toDrawableName(name: string): string {
  // Transliterate non-ASCII characters to ASCII
  let result = transliterate(name)

  // Convert to lowercase
  result = result.toLowerCase()

  // Replace spaces and other characters with underscores
  result = result.replace(/[^a-z0-9]/g, "_")

  // Collapse multiple consecutive underscores into one
  result = result.replace(/_+/g, "_")

  // Remove leading/trailing underscores
  result = result.replace(/^_+|_+$/g, "")

  // Ensure it starts with a letter (prepend 'a_' if it starts with a number)
  if (/^[0-9]/.test(result)) {
    result = "a_" + result
  }

  // Handle empty result
  if (!result) {
    result = "drawable"
  }

  return result
}

/**
 * Transforms an array of AppInfo into AppInfoForTemplate with auto-generated drawable names.
 * The defaultName is derived from the localized name with languageCode "--".
 */
export function enrichAppsForTemplate(apps: AppInfo[]): AppInfoForTemplate[] {
  return apps.map((app) => {
    // Find the default name (languageCode "--")
    const defaultLocalizedName = app.localizedNames.find(
      (ln) => ln.languageCode === "--"
    )
    const defaultName = defaultLocalizedName?.name ?? ""

    return {
      ...app,
      defaultName,
      autoDrawable: toDrawableName(defaultName),
      localizedNames: app.localizedNames.map((ln) => ({
        ...ln,
        autoDrawable: toDrawableName(ln.name),
      })),
    }
  })
}

/**
 * Gets the best drawable name for an app using fallback logic:
 * 1. Localized name with languageCode "--" (default)
 * 2. Localized name with languageCode "en"
 * 3. Localized name matching browser language
 * 4. First available localized name
 * 5. Fallback to package name converted to drawable
 */
export function getBestDrawableName(app: AppInfo): string {
  const browserLang = navigator.language.split("-")[0] // e.g., "en" from "en-US"

  const defaultName = app.localizedNames.find((ln) => ln.languageCode === "--")
  if (defaultName) return toDrawableName(defaultName.name)

  const englishName = app.localizedNames.find((ln) => ln.languageCode === "en")
  if (englishName) return toDrawableName(englishName.name)

  const browserLangName = app.localizedNames.find(
    (ln) => ln.languageCode === browserLang
  )
  if (browserLangName) return toDrawableName(browserLangName.name)

  if (app.localizedNames.length > 0) {
    return toDrawableName(app.localizedNames[0].name)
  }

  // Fallback to package name
  return toDrawableName(app.packageName)
}

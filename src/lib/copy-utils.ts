import { toast } from "sonner"
import { getBestDrawableName } from "./drawable"
import type { AppInfo, AppInfoDTO } from "@/types"

/**
 * Converts AppInfoDTO to AppInfo for use with copy functions.
 * Creates a localizedNames array with the defaultName.
 * Optionally accepts a custom drawable name (e.g., for adapted apps).
 */
export function convertAppInfoDTOToAppInfo(dto: AppInfoDTO, drawable?: string): AppInfo {
  return {
    id: dto.id ?? "",
    packageName: dto.packageName,
    mainActivity: dto.mainActivity,
    localizedNames: [
      {
        languageCode: "--", // Use default language code (highest priority)
        name: dto.defaultName,
      },
    ],
    count: dto.count,
    drawable,
  }
}

/**
 * Copies appfilter XML to clipboard with toast notification.
 * Format: <item component="ComponentInfo{packageName/mainActivity}" drawable="drawable_name"/>
 */
export async function copyAppfilter(
  apps: AppInfo[],
  successMessage: string,
  errorMessage: string
): Promise<void> {
  const { generateAppfilterSnippet } = await import("./xml-generator")

  const items = apps.map((app) => ({
    packageName: app.packageName,
    mainActivity: app.mainActivity,
    drawable: getBestDrawableName(app),
  }))

  const text = generateAppfilterSnippet(items)

  try {
    await navigator.clipboard.writeText(text)
    toast.success(successMessage)
  } catch {
    toast.error(errorMessage)
  }
}

/**
 * Copies drawable XML to clipboard with toast notification.
 * Format: <item drawable="drawable_name" />
 */
export async function copyDrawable(
  apps: AppInfo[],
  successMessage: string,
  errorMessage: string
): Promise<void> {
  const { generateDrawableSnippet } = await import("./xml-generator")

  const drawables = apps.map((app) => getBestDrawableName(app))
  const text = generateDrawableSnippet(drawables)

  try {
    await navigator.clipboard.writeText(text)
    toast.success(successMessage)
  } catch {
    toast.error(errorMessage)
  }
}

/**
 * Copies icon_pack XML to clipboard with toast notification.
 * Format: <item>drawable_name</item>
 */
export async function copyIconPack(
  apps: AppInfo[],
  successMessage: string,
  errorMessage: string
): Promise<void> {
  const { generateIconPackSnippet } = await import("./xml-generator")

  const drawables = apps.map((app) => getBestDrawableName(app))
  const text = generateIconPackSnippet(drawables)

  try {
    await navigator.clipboard.writeText(text)
    toast.success(successMessage)
  } catch {
    toast.error(errorMessage)
  }
}

import { toast } from "sonner"
import { getBestDrawableName } from "./drawable"
import type { AppInfo, AppInfoDTO } from "@/types"

/**
 * Converts AppInfoDTO to AppInfo for use with copy functions.
 * Creates a localizedNames array with the defaultName.
 */
export function convertAppInfoDTOToAppInfo(dto: AppInfoDTO): AppInfo {
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
  const text = apps
    .map((app) => {
      const drawable = getBestDrawableName(app)
      return `<item component="ComponentInfo{${app.packageName}/${app.mainActivity}}" drawable="${drawable}"/>`
    })
    .join("\n")

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
  const text = apps
    .map((app) => {
      const drawable = getBestDrawableName(app)
      return `<item drawable="${drawable}" />`
    })
    .join("\n")

  try {
    await navigator.clipboard.writeText(text)
    toast.success(successMessage)
  } catch {
    toast.error(errorMessage)
  }
}

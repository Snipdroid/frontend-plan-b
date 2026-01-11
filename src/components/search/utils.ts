import type { AppInfo } from "@/types"

export function getRowKey(app: AppInfo): string {
  return `${app.packageName}-${app.mainActivity}`
}

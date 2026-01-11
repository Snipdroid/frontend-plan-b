import type { AppInfo, SearchFilterType } from "@/types"

export function getRowKey(app: AppInfo): string {
  return `${app.packageName}-${app.mainActivity}`
}

export interface FilterOption {
  type: SearchFilterType
  labelKey: string
  descriptionKey: string
}

export const FILTER_OPTIONS: FilterOption[] = [
  {
    type: "byName",
    labelKey: "search.byName",
    descriptionKey: "search.byNameDesc",
  },
  {
    type: "byPackageName",
    labelKey: "search.byPackageName",
    descriptionKey: "search.byPackageNameDesc",
  },
  {
    type: "byMainActivity",
    labelKey: "search.byMainActivity",
    descriptionKey: "search.byMainActivityDesc",
  },
]

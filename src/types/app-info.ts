export interface LocalizedName {
  languageCode: string
  name: string
}

export interface AppInfo {
  packageName: string
  mainActivity: string
  localizedNames: LocalizedName[]
}

export interface PageMetadata {
  page: number
  per: number
  total: number
}

export interface PageAppInfo {
  items: AppInfo[]
  metadata: PageMetadata
}

export type SearchFilterType = "byName" | "byPackageName" | "byMainActivity"

export interface SearchTag {
  type: SearchFilterType
  value: string
  displayLabel: string
}

export interface AppSearchParams {
  byName?: string | null
  byPackageName?: string | null
  byMainActivity?: string | null
  page?: number
  per?: number
}

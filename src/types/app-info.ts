export interface LocalizedName {
  languageCode: string
  name: string
}

export interface AppInfo {
  packageName: string
  mainActivity: string
  localizedNames: LocalizedName[]
  count?: number
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
export type SortOption = "relevance" | "count"

export interface SearchTag {
  type: SearchFilterType
  value: string
  displayLabel: string
}

export interface AppSearchParams {
  query?: string | null
  byName?: string | null
  byPackageName?: string | null
  byMainActivity?: string | null
  sortBy?: SortOption
  page?: number
  per?: number
}

export interface AppInfoCreateSingleRequest {
  packageName: string
  mainActivity: string
  defaultName: string
  localizedName: string
  languageCode: string
}

export interface AppInfoDTO {
  id?: string
  packageName: string
  mainActivity: string
  defaultName: string
  count: number
  createdAt?: string
}

export interface AppIconGenerateUploadURLResponse {
  uploadURL: string
}

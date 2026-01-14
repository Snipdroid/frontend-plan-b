export interface LocalizedName {
  languageCode: string
  name: string
}

export interface AppInfo {
  id: string
  packageName: string
  mainActivity: string
  localizedNames: LocalizedName[]
  count?: number
  drawable?: string // Custom drawable name (e.g., for adapted apps)
}

export interface Tag {
  id: string | null
  name: string
  description: string | null
  createdAt: string | null
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

export interface AppInfoCandidateSearchRequest {
  packageNames: string[]
  mainActivities: string[]
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

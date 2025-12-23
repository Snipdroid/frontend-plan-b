import type { DesignerDTO } from "./user"

export interface IconPackDTO {
  id?: string
  name: string
  createdAt?: string
  updatedAt?: string
  versions?: IconPackVersionDTO[]
  designer?: DesignerDTO
  collaborators?: DesignerDTO[]
}

export interface IconPackVersionDTO {
  id?: string
  versionString: string
  createdAt?: string
  iconPack?: IconPackDTO
}

export interface AppInfoDTO {
  id?: string
  packageName: string
  mainActivity: string
  defaultName: string
  count: number
  createdAt?: string
}

export interface RequestRecordDTO {
  id?: string
  createdAt?: string
  deletedAt?: string | null
  iconPackVersion?: IconPackVersionDTO
  appInfo?: AppInfoDTO
  isSystemApp?: boolean | null
}

export interface PageMetadata {
  page: number
  per: number
  total: number
}

export interface PageIconPackVersionDTO {
  items: IconPackVersionDTO[]
  metadata: PageMetadata
}

export interface PageRequestRecordDTO {
  items: RequestRecordDTO[]
  metadata: PageMetadata
}

export interface PageAppInfoDTO {
  items: AppInfoDTO[]
  metadata: PageMetadata
}

export interface AppInfoWithRequestCount {
  appInfo: AppInfoDTO
  count: number
  iconPackApp?: IconPackAppDTO
}

export interface PageAppInfoWithRequestCount {
  items: AppInfoWithRequestCount[]
  metadata: PageMetadata
}

export interface IconPackVersionTokenRequest {
  expireAt: string // ISO 8601 date-time format
}

export interface IconPackVersionTokenResponse {
  token: string
}

export interface IconPackMarkAppAsAdaptedRequest {
  appInfoIDs: string[]
  adapted: boolean
}

export interface IconPackAppDTO {
  id?: string
  createdAt?: string
  appInfo?: AppInfoDTO
  iconPack?: IconPackDTO
  drawable: string
}

export interface IconPackVersionRequestRecordResponse {
  requestRecord: RequestRecordDTO
  iconPackApp?: IconPackAppDTO
}

export interface PageIconPackVersionRequestRecordResponse {
  items: IconPackVersionRequestRecordResponse[]
  metadata: PageMetadata
}

export interface DesignerStatisticsResponse {
  requestCount: number
  distinctRequestCount: number
}

export type SuggestionSource = "none" | "iconPack" | "designer"

export interface DrawableNameSuggestion {
  drawable: string
  from: SuggestionSource
}

export interface IconPackAddCollaboratorsRequest {
  designerIds: string[]
}

export interface IconPackRemoveCollaboratorsRequest {
  designerIds: string[]
}

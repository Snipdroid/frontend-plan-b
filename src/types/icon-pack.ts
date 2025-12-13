export interface IconPackDTO {
  id?: string
  name: string
  createdAt?: string
  updatedAt?: string
  versions?: IconPackVersionDTO[]
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

export interface AppInfoWithRequestCount {
  appInfo: AppInfoDTO
  count: number
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

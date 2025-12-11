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

export interface IconPackVersionTokenRequest {
  expireAt: string // ISO 8601 date-time format
}

export interface IconPackVersionTokenResponse {
  token: string
}

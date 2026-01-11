// Key builders for consistent cache key generation
export const swrKeys = {
  // App Info (public)
  appSearch: (params: URLSearchParams) => `/app-info/search?${params.toString()}`,
  appTags: (appId: string) => `/app-info/${appId}/tags`,
  allTags: () => "/tags",

  // Icon Pack (authenticated)
  iconPacks: (token: string) => ["/icon-pack", token] as const,
  iconPack: (id: string, token: string) => [`/icon-pack/${id}`, token] as const,
  iconPackVersions: (packId: string, token: string, page?: number, per?: number) => {
    const params = new URLSearchParams()
    if (page !== undefined) params.set("page", String(page))
    if (per !== undefined) params.set("per", String(per))
    const query = params.toString()
    return [`/icon-pack/${packId}/versions${query ? `?${query}` : ""}`, token] as const
  },
  iconPackRequests: (
    packId: string,
    token: string,
    page?: number,
    per?: number,
    includingAdapted?: boolean
  ) => {
    const params = new URLSearchParams()
    if (page !== undefined) params.set("page", String(page))
    if (per !== undefined) params.set("per", String(per))
    if (includingAdapted !== undefined) params.set("includingAdapted", String(includingAdapted))
    const query = params.toString()
    return [`/icon-pack/${packId}/requests${query ? `?${query}` : ""}`, token] as const
  },
  iconPackAdaptedApps: (
    packId: string,
    token: string,
    page?: number,
    per?: number,
    query?: string
  ) => {
    const params = new URLSearchParams()
    if (page !== undefined) params.set("page", String(page))
    if (per !== undefined) params.set("per", String(per))
    if (query) params.set("query", query)
    const queryStr = params.toString()
    return [`/icon-pack/${packId}/adapted-apps${queryStr ? `?${queryStr}` : ""}`, token] as const
  },
  iconPackCollaborators: (packId: string, token: string) =>
    [`/icon-pack/${packId}/collaborators`, token] as const,

  // Version requests (authenticated)
  versionRequests: (
    packId: string,
    versionId: string,
    token: string,
    page?: number,
    per?: number,
    includingAdapted?: boolean
  ) => {
    const params = new URLSearchParams()
    if (page !== undefined) params.set("page", String(page))
    if (per !== undefined) params.set("per", String(per))
    if (includingAdapted !== undefined) params.set("includingAdapted", String(includingAdapted))
    const query = params.toString()
    return [`/icon-pack/${packId}/version/${versionId}/requests${query ? `?${query}` : ""}`, token] as const
  },

  // Designer (authenticated)
  designerMe: (token: string) => ["/designer/me", token] as const,
  designerStatistics: (token: string) => ["/designer/statistics", token] as const,
  designerSearch: (query: string, token: string) =>
    [`/designer/search?query=${encodeURIComponent(query)}`, token] as const,

  // Drawable suggestions (public)
  drawableSuggestions: (packageName: string, iconPackId?: string, designerId?: string) => {
    const params = new URLSearchParams({ packageName })
    if (iconPackId) params.set("iconPackID", iconPackId)
    if (designerId) params.set("designerID", designerId)
    return `/icon-pack-app/drawable-name-suggestions?${params.toString()}`
  },
} as const

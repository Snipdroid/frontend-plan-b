import { API_BASE_URL } from "./api"
import type {
  IconPackDTO,
  IconPackVersionDTO,
  IconPackVersionTokenRequest,
  IconPackVersionTokenResponse,
  PageIconPackVersionDTO,
  PageIconPackVersionRequestRecordResponse,
  PageAppInfoWithRequestCount,
  PageAppInfoDTO,
  IconPackAppDTO,
  DrawableNameSuggestion,
  IconPackAddCollaboratorsRequest,
  IconPackRemoveCollaboratorsRequest,
} from "@/types/icon-pack"
import type { DesignerDTO } from "@/types/user"

export async function getIconPacks(accessToken: string): Promise<IconPackDTO[]> {
  const response = await fetch(`${API_BASE_URL}/icon-pack`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function createIconPack(
  accessToken: string,
  name: string
): Promise<IconPackDTO> {
  const response = await fetch(`${API_BASE_URL}/icon-pack/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name }),
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function deleteIconPack(
  accessToken: string,
  iconPackId: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/icon-pack/${iconPackId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }
}

export async function getIconPack(
  accessToken: string,
  iconPackId: string
): Promise<IconPackDTO> {
  const response = await fetch(`${API_BASE_URL}/icon-pack/${iconPackId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function getIconPackVersions(
  accessToken: string,
  iconPackId: string,
  page?: number,
  per?: number
): Promise<PageIconPackVersionDTO> {
  const params = new URLSearchParams()
  if (page !== undefined) params.set("page", String(page))
  if (per !== undefined) params.set("per", String(per))

  const queryString = params.toString()
  const url = `${API_BASE_URL}/icon-pack/${iconPackId}/versions${queryString ? `?${queryString}` : ""}`

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function createIconPackVersion(
  accessToken: string,
  iconPackId: string,
  versionString: string
): Promise<IconPackVersionDTO> {
  const response = await fetch(
    `${API_BASE_URL}/icon-pack/${iconPackId}/version/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ versionString }),
    }
  )

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function createVersionAccessToken(
  accessToken: string,
  iconPackId: string,
  versionId: string,
  expireAt: string
): Promise<IconPackVersionTokenResponse> {
  const response = await fetch(
    `${API_BASE_URL}/icon-pack/${iconPackId}/version/${versionId}/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ expireAt } as IconPackVersionTokenRequest),
    }
  )

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function deleteIconPackVersion(
  accessToken: string,
  iconPackId: string,
  versionId: string
): Promise<IconPackVersionDTO> {
  const response = await fetch(
    `${API_BASE_URL}/icon-pack/${iconPackId}/version/${versionId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function getVersionRequests(
  accessToken: string,
  iconPackId: string,
  versionId: string,
  page?: number,
  per?: number,
  includingAdapted?: boolean
): Promise<PageIconPackVersionRequestRecordResponse> {
  const params = new URLSearchParams()
  if (page !== undefined) params.set("page", String(page))
  if (per !== undefined) params.set("per", String(per))
  if (includingAdapted !== undefined) params.set("includingAdapted", String(includingAdapted))

  const queryString = params.toString()
  const url = `${API_BASE_URL}/icon-pack/${iconPackId}/version/${versionId}/requests${queryString ? `?${queryString}` : ""}`

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function getIconPackRequests(
  accessToken: string,
  iconPackId: string,
  page?: number,
  per?: number,
  includingAdapted?: boolean
): Promise<PageAppInfoWithRequestCount> {
  const params = new URLSearchParams()
  if (page !== undefined) params.set("page", String(page))
  if (per !== undefined) params.set("per", String(per))
  if (includingAdapted !== undefined) params.set("includingAdapted", String(includingAdapted))

  const queryString = params.toString()
  const url = `${API_BASE_URL}/icon-pack/${iconPackId}/requests${queryString ? `?${queryString}` : ""}`

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function markAppsAsAdapted(
  accessToken: string,
  iconPackId: string,
  appInfoIDs: string[],
  adapted: boolean,
  drawables?: Record<string, string>
): Promise<IconPackAppDTO[]> {
  const body: {
    appInfoIDs: string[]
    adapted: boolean
    drawables?: Record<string, string>
  } = { appInfoIDs, adapted }

  if (drawables !== undefined) {
    body.drawables = drawables
  }

  const response = await fetch(`${API_BASE_URL}/icon-pack/${iconPackId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function getIconPackAdaptedApps(
  accessToken: string,
  iconPackId: string,
  page?: number,
  per?: number
): Promise<PageAppInfoDTO> {
  const params = new URLSearchParams()
  if (page !== undefined) params.set("page", String(page))
  if (per !== undefined) params.set("per", String(per))

  const queryString = params.toString()
  const url = `${API_BASE_URL}/icon-pack/${iconPackId}/adapted-apps${queryString ? `?${queryString}` : ""}`

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function getDrawableNameSuggestions(
  packageName: string,
  iconPackId?: string,
  designerId?: string
): Promise<DrawableNameSuggestion[]> {
  const params = new URLSearchParams({ packageName })
  if (iconPackId) params.set("iconPackID", iconPackId)
  if (designerId) params.set("designerID", designerId)

  const response = await fetch(
    `${API_BASE_URL}/icon-pack-app/drawable-name-suggestions?${params.toString()}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  )

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// Get collaborators for an icon pack
export async function getIconPackCollaborators(
  accessToken: string,
  iconPackId: string
): Promise<DesignerDTO[]> {
  const response = await fetch(
    `${API_BASE_URL}/icon-pack/${iconPackId}/collaborators`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// Add collaborators to an icon pack (owner only)
export async function addIconPackCollaborators(
  accessToken: string,
  iconPackId: string,
  designerIds: string[]
): Promise<DesignerDTO[]> {
  const response = await fetch(
    `${API_BASE_URL}/icon-pack/${iconPackId}/collaborators`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ designerIds } as IconPackAddCollaboratorsRequest),
    }
  )

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// Remove collaborators from an icon pack (owner only)
export async function removeIconPackCollaborators(
  accessToken: string,
  iconPackId: string,
  designerIds: string[]
): Promise<DesignerDTO[]> {
  const response = await fetch(
    `${API_BASE_URL}/icon-pack/${iconPackId}/collaborators`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ designerIds } as IconPackRemoveCollaboratorsRequest),
    }
  )

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

import { API_BASE_URL } from "./api"
import type {
  IconPackDTO,
  IconPackVersionDTO,
  IconPackVersionTokenRequest,
  IconPackVersionTokenResponse,
  PageIconPackVersionDTO,
  PageRequestRecordDTO,
} from "@/types/icon-pack"

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
  per?: number
): Promise<PageRequestRecordDTO> {
  const params = new URLSearchParams()
  if (page !== undefined) params.set("page", String(page))
  if (per !== undefined) params.set("per", String(per))

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

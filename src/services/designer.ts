import { API_BASE_URL } from "./api"
import type { DesignerDTO } from "@/types/user"
import type { PageAppInfoWithRequestCount } from "@/types/icon-pack"

export async function getDesignerMe(accessToken: string): Promise<DesignerDTO> {
  const response = await fetch(`${API_BASE_URL}/designer/me`, {
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

export async function syncDesignerProfile(accessToken: string): Promise<DesignerDTO> {
  const response = await fetch(`${API_BASE_URL}/designer/me/sync`, {
    method: "POST",
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

export async function getDesignerRequests(
  accessToken: string,
  page?: number,
  per?: number
): Promise<PageAppInfoWithRequestCount> {
  const params = new URLSearchParams()
  if (page !== undefined) params.set("page", String(page))
  if (per !== undefined) params.set("per", String(per))

  const queryString = params.toString()
  const url = `${API_BASE_URL}/designer/requests${queryString ? `?${queryString}` : ""}`

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

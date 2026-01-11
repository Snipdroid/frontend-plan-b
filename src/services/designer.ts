import { API_BASE_URL } from "./api"
import type { DesignerDTO } from "@/types/user"
import type { PageDesignerDTO } from "@/types/designer"

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

// Search for designers by email
// Note: The API only supports searching by email, not name
export async function searchDesigners(
  accessToken: string,
  query: string
): Promise<PageDesignerDTO> {
  const params = new URLSearchParams()
  if (query.trim()) {
    params.set("query", query.trim())
  }

  const queryString = params.toString()
  const url = `${API_BASE_URL}/designer/search${queryString ? `?${queryString}` : ""}`

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

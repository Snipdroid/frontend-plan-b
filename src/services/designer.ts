import { API_BASE_URL } from "./api"
import type { DesignerDTO } from "@/types/user"

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

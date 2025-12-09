import { API_BASE_URL } from "./api"
import type { IconPackDTO } from "@/types/icon-pack"

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

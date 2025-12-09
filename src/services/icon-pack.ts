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

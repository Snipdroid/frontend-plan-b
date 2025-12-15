import { API_BASE_URL } from "./api"
import type { AppInfo } from "@/types"

interface RenderResponse {
  text: string
}

interface RenderErrorResponse {
  error: boolean
  reason: string
}

export async function renderLeafTemplate(
  template: string,
  apps: AppInfo[]
): Promise<RenderResponse> {
  const response = await fetch(`${API_BASE_URL}/render-leaf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      template,
      context: { apps },
    }),
  })

  const data = await response.json()

  if (!response.ok || data.error) {
    const errorData = data as RenderErrorResponse
    throw new Error(errorData.reason || `API Error: ${response.status}`)
  }

  return data as RenderResponse
}

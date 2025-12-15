import { fetchJson } from "./api"
import type { AppInfo } from "@/types"

interface RenderResponse {
  text: string
}

export async function renderLeafTemplate(
  template: string,
  apps: AppInfo[]
): Promise<RenderResponse> {
  return fetchJson<RenderResponse>("/render-leaf", {
    method: "POST",
    body: JSON.stringify({
      template,
      context: { apps },
    }),
  })
}

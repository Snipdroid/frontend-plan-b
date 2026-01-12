import type {
  AppSearchParams,
  PageAppInfo,
  AppInfoCreateSingleRequest,
  AppInfoDTO,
  AppIconGenerateUploadURLResponse,
  Tag,
} from "@/types/app-info"
import { API_BASE_URL, fetchJson } from "./api"

export async function searchAppInfo(
  params: AppSearchParams,
  signal?: AbortSignal
): Promise<PageAppInfo> {
  const searchParams = new URLSearchParams()

  if (params.query) searchParams.set("query", params.query)
  if (params.byName) searchParams.set("byName", params.byName)
  if (params.byPackageName) searchParams.set("byPackageName", params.byPackageName)
  if (params.byMainActivity) searchParams.set("byMainActivity", params.byMainActivity)
  if (params.sortBy) searchParams.set("sortBy", params.sortBy)
  if (params.page !== undefined) searchParams.set("page", String(params.page))
  if (params.per !== undefined) searchParams.set("per", String(params.per))

  const queryString = searchParams.toString()
  const endpoint = `/app-info/search${queryString ? `?${queryString}` : ""}`

  return fetchJson<PageAppInfo>(endpoint, { signal })
}

export async function createAppInfo(
  entries: AppInfoCreateSingleRequest[],
  accessToken?: string
): Promise<AppInfoDTO[]> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
  }

  const response = await fetch(`${API_BASE_URL}/app-info/create`, {
    method: "POST",
    headers,
    body: JSON.stringify(entries),
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function getIconUploadUrl(
  packageName: string
): Promise<AppIconGenerateUploadURLResponse> {
  const params = new URLSearchParams({ packageName })
  return fetchJson<AppIconGenerateUploadURLResponse>(
    `/app-icon/generate-upload-url?${params.toString()}`
  )
}

export async function uploadIconToS3(
  uploadUrl: string,
  iconBlob: Blob
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: iconBlob,
    headers: {
      "Content-Type": iconBlob.type || "image/png",
    },
  })

  if (!response.ok) {
    throw new Error(`S3 Upload Error: ${response.status} ${response.statusText}`)
  }
}

export async function getAllTags(signal?: AbortSignal): Promise<Tag[]> {
  return fetchJson<Tag[]>("/tags", { signal })
}

export async function addTagToApp(
  appInfoId: string,
  tagId: string,
  accessToken: string
): Promise<AppInfoDTO> {
  const response = await fetch(`${API_BASE_URL}/app-info/${appInfoId}/tag`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      tagID: tagId,
      remove: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to add tag: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function removeTagFromApp(
  appInfoId: string,
  tagId: string,
  accessToken: string
): Promise<AppInfoDTO> {
  const response = await fetch(`${API_BASE_URL}/app-info/${appInfoId}/tag`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      tagID: tagId,
      remove: true,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to remove tag: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

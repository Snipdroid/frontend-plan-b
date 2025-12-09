import type { AppSearchParams, PageAppInfo } from "@/types"
import { fetchJson } from "./api"

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

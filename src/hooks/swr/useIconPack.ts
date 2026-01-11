import useSWR from "swr"
import { useAuth } from "react-oidc-context"
import { authFetcher } from "@/lib/swr-config"
import { swrKeys } from "@/lib/swr-keys"
import type {
  IconPackDTO,
  PageIconPackVersionDTO,
  PageAppInfoWithRequestCount,
  PageIconPackAppDTO,
  PageIconPackVersionRequestRecordResponse,
} from "@/types/icon-pack"

// Fetch all icon packs for current user
export function useIconPacks() {
  const auth = useAuth()
  const token = auth.user?.access_token

  return useSWR<IconPackDTO[]>(token ? swrKeys.iconPacks(token) : null, authFetcher)
}

// Fetch single icon pack
export function useIconPack(packId: string | undefined) {
  const auth = useAuth()
  const token = auth.user?.access_token

  return useSWR<IconPackDTO>(
    packId && token ? swrKeys.iconPack(packId, token) : null,
    authFetcher
  )
}

// Fetch icon pack versions with pagination
export function useIconPackVersions(packId: string | undefined, page = 1, per = 10) {
  const auth = useAuth()
  const token = auth.user?.access_token

  return useSWR<PageIconPackVersionDTO>(
    packId && token ? swrKeys.iconPackVersions(packId, token, page, per) : null,
    authFetcher
  )
}

// Fetch icon pack requests with pagination and filter
export function useIconPackRequests(
  packId: string | undefined,
  page = 1,
  per = 10,
  includingAdapted = false
) {
  const auth = useAuth()
  const token = auth.user?.access_token

  return useSWR<PageAppInfoWithRequestCount>(
    packId && token ? swrKeys.iconPackRequests(packId, token, page, per, includingAdapted) : null,
    authFetcher,
    {
      keepPreviousData: true,
    }
  )
}

// Fetch adapted apps with search
export function useIconPackAdaptedApps(
  packId: string | undefined,
  page = 1,
  per = 10,
  query?: string
) {
  const auth = useAuth()
  const token = auth.user?.access_token

  return useSWR<PageIconPackAppDTO>(
    packId && token ? swrKeys.iconPackAdaptedApps(packId, token, page, per, query) : null,
    authFetcher,
    {
      // Keep previous data while loading new query results
      keepPreviousData: true,
    }
  )
}

// Fetch version requests with pagination and filter
export function useVersionRequests(
  packId: string | undefined,
  versionId: string | undefined,
  page = 1,
  per = 10,
  includingAdapted = false
) {
  const auth = useAuth()
  const token = auth.user?.access_token

  return useSWR<PageIconPackVersionRequestRecordResponse>(
    packId && versionId && token
      ? swrKeys.versionRequests(packId, versionId, token, page, per, includingAdapted)
      : null,
    authFetcher,
    {
      keepPreviousData: true,
    }
  )
}

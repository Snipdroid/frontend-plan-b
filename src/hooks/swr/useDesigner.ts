import useSWR from "swr"
import { useAuth } from "react-oidc-context"
import { authFetcher } from "@/lib/swr-config"
import { swrKeys } from "@/lib/swr-keys"
import type { DesignerDTO } from "@/types/user"
import type { DesignerStatisticsResponse } from "@/types/icon-pack"

// Fetch current designer profile
export function useDesignerMe() {
  const auth = useAuth()
  const token = auth.user?.access_token
  const isAuthenticated = auth.isAuthenticated

  return useSWR<DesignerDTO>(
    token && isAuthenticated ? swrKeys.designerMe(token) : null,
    authFetcher
  )
}

// Fetch designer statistics
export function useDesignerStatistics() {
  const auth = useAuth()
  const token = auth.user?.access_token
  const isAuthenticated = auth.isAuthenticated

  return useSWR<DesignerStatisticsResponse>(
    token && isAuthenticated ? swrKeys.designerStatistics(token) : null,
    authFetcher
  )
}

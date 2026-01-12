import useSWR from "swr"
import { useAuth } from "react-oidc-context"
import { authFetcher } from "@/lib/swr-config"
import { swrKeys } from "@/lib/swr-keys"
import type { DesignerDTO } from "@/types/user"

export function useIconPackCollaborators(packId: string | undefined) {
  const auth = useAuth()
  const token = auth.user?.access_token

  return useSWR<DesignerDTO[]>(
    packId && token ? swrKeys.iconPackCollaborators(packId, token) : null,
    authFetcher
  )
}

import useSWR from "swr"
import { publicFetcher } from "@/lib/swr-config"
import { swrKeys } from "@/lib/swr-keys"
import type { Tag } from "@/types"

export function useAppTags(appId: string | undefined) {
  return useSWR<Tag[]>(
    appId ? swrKeys.appTags(appId) : null,
    publicFetcher
  )
}

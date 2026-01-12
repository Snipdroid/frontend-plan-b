import useSWR from "swr"
import { publicFetcher } from "@/lib/swr-config"
import { swrKeys } from "@/lib/swr-keys"
import type { DrawableNameSuggestion } from "@/types/icon-pack"

export function useDrawableNameSuggestions(
  packageName: string | undefined,
  iconPackId?: string,
  designerId?: string
) {
  return useSWR<DrawableNameSuggestion[]>(
    packageName ? swrKeys.drawableSuggestions(packageName, iconPackId, designerId) : null,
    publicFetcher,
    {
      // Suggestions are relatively static, don't need frequent revalidation
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )
}

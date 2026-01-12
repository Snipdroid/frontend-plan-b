import useSWR from "swr"
import { publicFetcher } from "@/lib/swr-config"
import { swrKeys } from "@/lib/swr-keys"
import type { Tag } from "@/types"

export function useAllTags() {
  return useSWR<Tag[]>(swrKeys.allTags(), publicFetcher)
}

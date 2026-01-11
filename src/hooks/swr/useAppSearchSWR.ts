import useSWRInfinite from "swr/infinite"
import { publicFetcher } from "@/lib/swr-config"
import type { PageAppInfo, SearchTag, SortOption } from "@/types"

interface UseAppSearchSWROptions {
  tags: SearchTag[]
  query?: string
  sortBy?: SortOption
  perPage?: number
}

export function useAppSearchSWR({
  tags,
  query,
  sortBy = "relevance",
  perPage = 25,
}: UseAppSearchSWROptions) {
  const getKey = (pageIndex: number, previousPageData: PageAppInfo | null) => {
    // Reached the end
    if (previousPageData && previousPageData.items.length === 0) return null
    if (previousPageData && previousPageData.items.length < perPage) return null

    const params = new URLSearchParams()
    params.set("page", String(pageIndex + 1)) // API uses 1-based pagination
    params.set("per", String(perPage))

    if (query?.trim()) params.set("query", query.trim())
    if (sortBy) params.set("sortBy", sortBy)

    tags.forEach((tag) => {
      params.set(tag.type, tag.value)
    })

    return `/app-info/search?${params.toString()}`
  }

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<PageAppInfo>(getKey, publicFetcher, {
      revalidateFirstPage: false,
      revalidateOnFocus: false, // Prevent unwanted refetches during search
      parallel: false, // Sequential fetching for pagination
    })

  // Flatten all pages into single array
  const allItems = data ? data.flatMap((page) => page.items) : []

  // Calculate if there are more pages
  const lastPage = data?.[data.length - 1]
  const hasMore = lastPage ? lastPage.items.length === perPage : false

  // Total from metadata
  const total = lastPage?.metadata?.total ?? 0

  const loadMore = () => {
    if (!isValidating && hasMore) {
      setSize(size + 1)
    }
  }

  const reset = () => {
    setSize(1)
    mutate()
  }

  return {
    items: allItems,
    total,
    hasMore,
    isLoading,
    isValidating,
    error,
    loadMore,
    reset,
    mutate,
  }
}

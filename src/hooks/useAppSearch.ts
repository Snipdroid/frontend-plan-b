import { useState, useCallback } from "react"
import type { SearchTag, PageAppInfo, AppSearchParams, SortOption, AppInfo } from "@/types"
import { searchAppInfo } from "@/services"

const DEFAULT_PER_PAGE = 20

export function useAppSearch(defaultPerPage = DEFAULT_PER_PAGE) {
  const [results, setResults] = useState<PageAppInfo | null>(null)
  const [accumulatedItems, setAccumulatedItems] = useState<AppInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const hasMore = results?.metadata
    ? accumulatedItems.length < results.metadata.total
    : false

  const search = useCallback(
    async (
      tags: SearchTag[],
      page = 1,
      perPage = defaultPerPage,
      query?: string,
      sortBy?: SortOption
    ) => {
      setIsLoading(true)
      setError(null)

      const params: AppSearchParams = {
        page,
        per: perPage,
      }

      if (query?.trim()) {
        params.query = query.trim()
      }

      if (sortBy) {
        params.sortBy = sortBy
      }

      tags.forEach((tag) => {
        params[tag.type] = tag.value
      })

      try {
        const data = await searchAppInfo(params)
        setResults(data)
        setAccumulatedItems(page === 1 ? data.items : [...accumulatedItems, ...data.items])
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Search failed"))
        setResults(null)
        setAccumulatedItems([])
      } finally {
        setIsLoading(false)
      }
    },
    [accumulatedItems, defaultPerPage]
  )

  const loadMore = useCallback(
    (tags: SearchTag[], query?: string, sortBy?: SortOption) => {
      const nextPage = results?.metadata ? results.metadata.page + 1 : 1
      search(tags, nextPage, defaultPerPage, query, sortBy)
    },
    [defaultPerPage, results?.metadata, search]
  )

  const clearResults = useCallback(() => {
    setResults(null)
    setAccumulatedItems([])
    setError(null)
  }, [])

  return { results, accumulatedItems, isLoading, error, search, loadMore, clearResults, hasMore }
}

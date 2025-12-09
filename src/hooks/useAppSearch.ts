import { useState, useCallback, useRef } from "react"
import type { SearchTag, PageAppInfo, AppSearchParams, SortOption, AppInfo } from "@/types"
import { searchAppInfo } from "@/services"

const DEFAULT_PER_PAGE = 25

export function useAppSearch(defaultPerPage = DEFAULT_PER_PAGE) {
  const [results, setResults] = useState<PageAppInfo | null>(null)
  const [accumulatedItems, setAccumulatedItems] = useState<AppInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

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
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller for this request
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      setIsLoading(true)
      setError(null)

      // Clear accumulated items immediately when starting a new search (page 1)
      if (page === 1) {
        setAccumulatedItems([])
      }

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
        const data = await searchAppInfo(params, abortController.signal)

        // Check if this request was aborted
        if (abortController.signal.aborted) {
          return
        }

        setResults(data)
        if (page === 1) {
          setAccumulatedItems(data.items)
        } else {
          setAccumulatedItems(prev => [...prev, ...data.items])
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === "AbortError") {
          return
        }
        setError(err instanceof Error ? err : new Error("Search failed"))
        setResults(null)
        setAccumulatedItems([])
      } finally {
        // Only set loading to false if this request wasn't aborted
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    },
    [defaultPerPage]
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

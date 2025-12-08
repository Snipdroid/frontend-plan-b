import { useState, useCallback } from "react"
import type { SearchTag, PageAppInfo, AppSearchParams, SortOption } from "@/types"
import { searchAppInfo } from "@/services"

const DEFAULT_PER_PAGE = 20

export function useAppSearch(defaultPerPage = DEFAULT_PER_PAGE) {
  const [results, setResults] = useState<PageAppInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

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
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Search failed"))
        setResults(null)
      } finally {
        setIsLoading(false)
      }
    },
    [defaultPerPage]
  )

  const clearResults = useCallback(() => {
    setResults(null)
    setError(null)
  }, [])

  return { results, isLoading, error, search, clearResults }
}

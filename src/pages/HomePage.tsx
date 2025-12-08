import { useEffect, useState } from "react"
import { useSearchTags, useAppSearch } from "@/hooks"
import {
  SearchTagInput,
  AppInfoTable,
  AppInfoTablePagination,
} from "@/components/search"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SortOption } from "@/types"

export function HomePage() {
  const { tags, inputValue, setInputValue, addTag, removeTag, hasTagType } =
    useSearchTags()
  const { results, isLoading, error, search } = useAppSearch()
  const [sortBy, setSortBy] = useState<SortOption>("relevance")

  // Fetch initial unfiltered list on mount
  useEffect(() => {
    search([], 1, undefined, undefined, sortBy)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSortChange = (value: string) => {
    const sortOption = value as SortOption
    setSortBy(sortOption)
    const query = inputValue.trim() || undefined
    search(tags, 1, undefined, query, sortOption)
  }

  const handleSearch = () => {
    const query = inputValue.trim() || undefined
    search(tags, 1, undefined, query, sortBy)
  }

  const handlePageChange = (page: number) => {
    const query = inputValue.trim() || undefined
    search(tags, page, undefined, query, sortBy)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AppTracker</h1>
        <p className="text-muted-foreground">
          Search for Android app metadata by name, package name, or main activity.
        </p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-2">
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="count">Count</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1">
          <SearchTagInput
            tags={tags}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onAddTag={addTag}
            onRemoveTag={removeTag}
            onSearch={handleSearch}
            isLoading={isLoading}
            hasTagType={hasTagType}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md">
          {error.message}
        </div>
      )}

      <AppInfoTable data={results?.items ?? []} isLoading={isLoading} />

      {results?.metadata && (
        <AppInfoTablePagination
          metadata={results.metadata}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}

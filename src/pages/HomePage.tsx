import { useEffect, useState } from "react"
import { useSearchTags, useAppSearch } from "@/hooks"
import { SearchTagInput, AppInfoTable } from "@/components/search"
import { Button } from "@/components/ui/button"
import type { SortOption } from "@/types"

export function HomePage() {
  const { tags, inputValue, setInputValue, addTag, removeTag, hasTagType } =
    useSearchTags()
  const { accumulatedItems, isLoading, error, search, loadMore, hasMore } =
    useAppSearch()
  const [sortBy, setSortBy] = useState<SortOption>("relevance")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Fetch initial unfiltered list on mount
  useEffect(() => {
    search([], 1, undefined, undefined, sortBy)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort)
    const query = inputValue.trim() || undefined
    search(tags, 1, undefined, query, newSort)
  }

  const handleSearch = () => {
    const query = inputValue.trim() || undefined
    search(tags, 1, undefined, query, sortBy)
  }

  const handleLoadMore = () => {
    const query = inputValue.trim() || undefined
    loadMore(tags, query, sortBy)
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-6">
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

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md">
          {error.message}
        </div>
      )}

      <AppInfoTable
        data={accumulatedItems}
        isLoading={isLoading}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {hasMore && (
        <div className="flex justify-center py-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  )
}

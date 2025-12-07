import { useEffect } from "react"
import { useSearchTags, useAppSearch } from "@/hooks"
import {
  SearchTagInput,
  AppInfoTable,
  AppInfoTablePagination,
} from "@/components/search"

export function HomePage() {
  const { tags, inputValue, setInputValue, addTag, removeTag, hasTagType } =
    useSearchTags()
  const { results, isLoading, error, search } = useAppSearch()

  // Fetch initial unfiltered list on mount
  useEffect(() => {
    search([], 1)
  }, [search])

  const handleSearch = () => {
    search(tags, 1)
  }

  const handlePageChange = (page: number) => {
    search(tags, page)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AppTracker</h1>
        <p className="text-muted-foreground">
          Search for Android app metadata by name, package name, or main activity.
        </p>
      </div>

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

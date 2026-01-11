import { useState, useMemo, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useSearchTags, useAppSearchSWR, useMediaQuery } from "@/hooks"
import {
  SearchTagInput,
  ActionBar,
  AppInfoCardList,
  AppDetailPanel,
  AppDetailSheet,
  getRowKey,
} from "@/components/search"
import { Button } from "@/components/ui/button"
import type { AppInfo, SortOption } from "@/types"

export function HomePage() {
  const { t } = useTranslation()
  const { tags, inputValue, setInputValue, addTag, removeTag, hasTagType } =
    useSearchTags()
  const [sortBy, setSortBy] = useState<SortOption>("relevance")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)

  // Debounced query for SWR
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [searchTags, setSearchTags] = useState(tags)
  const isInitialMount = useRef(true)

  const isMobile = useMediaQuery("(max-width: 767px)")

  // SWR hook for search
  const { items, isLoading, isValidating, error, hasMore, loadMore, reset } =
    useAppSearchSWR({
      tags: searchTags,
      query: debouncedQuery || undefined,
      sortBy,
      perPage: 25,
    })

  const selectedApps = useMemo(
    () => items.filter((app) => selectedIds.has(getRowKey(app))),
    [items, selectedIds]
  )

  // Reset search on initial mount to load initial data
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
    }
  }, [])

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort)
    reset()
  }

  const handleSearch = () => {
    const query = inputValue.trim()
    setDebouncedQuery(query)
    setSearchTags([...tags])
    reset()
  }

  const handleLoadMore = () => {
    loadMore()
  }

  const handleCardClick = (app: AppInfo) => {
    setSelectedApp(app)
    if (isMobile) {
      setDetailSheetOpen(true)
    }
  }

  const handleCloseDetail = () => {
    setSelectedApp(null)
    setDetailSheetOpen(false)
  }

  const handleCopySelected = async () => {
    if (selectedApps.length === 0) return

    const text = selectedApps
      .map((app) => {
        const name =
          app.localizedNames.length > 0
            ? app.localizedNames[0].name
            : "Unknown"
        return `${name}\n${app.packageName}\n${app.mainActivity}`
      })
      .join("\n\n")

    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      {/* Search Area */}
      <div className="mb-4">
        <SearchTagInput
          tags={tags}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onAddTag={addTag}
          onRemoveTag={removeTag}
          onSearch={handleSearch}
          isLoading={isLoading || isValidating}
          hasTagType={hasTagType}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md">
          {error.message}
        </div>
      )}

      {/* Action Bar - Sticky */}
      <ActionBar
        selectedApps={selectedApps}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onCopySelected={handleCopySelected}
      />

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Card List */}
        <div className="flex-1 min-w-0">
          <AppInfoCardList
            data={items}
            isLoading={isLoading && items.length === 0}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onCardClick={handleCardClick}
          />

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center py-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoading || isValidating}
              >
                {isValidating ? t("common.loading") : t("search.loadMore")}
              </Button>
            </div>
          )}
        </div>

        {/* Desktop Detail Panel */}
        {selectedApp && (
          <div className="hidden md:block w-80 shrink-0">
            <AppDetailPanel app={selectedApp} onClose={handleCloseDetail} />
          </div>
        )}
      </div>

      {/* Mobile Detail Sheet */}
      <AppDetailSheet
        app={selectedApp}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
      />
    </div>
  )
}

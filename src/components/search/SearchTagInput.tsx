import { useState, useRef, useCallback } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchTag } from "./SearchTag"
import { SearchFilterDropdown, FILTER_OPTIONS } from "./SearchFilterDropdown"
import { cn } from "@/lib/utils"
import type { SearchTag as SearchTagType, SearchFilterType } from "@/types"

interface SearchTagInputProps {
  tags: SearchTagType[]
  inputValue: string
  onInputChange: (value: string) => void
  onAddTag: (type: SearchFilterType) => void
  onRemoveTag: (type: SearchFilterType) => void
  onSearch: () => void
  isLoading?: boolean
  hasTagType: (type: SearchFilterType) => boolean
}

export function SearchTagInput({
  tags,
  inputValue,
  onInputChange,
  onAddTag,
  onRemoveTag,
  onSearch,
  isLoading,
  hasTagType,
}: SearchTagInputProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [focusedTagIndex, setFocusedTagIndex] = useState<number | null>(null)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const tagRefs = useRef<(HTMLDivElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const disabledTypes = (
    ["byName", "byPackageName", "byMainActivity"] as SearchFilterType[]
  ).filter(hasTagType)

  const availableOptions = FILTER_OPTIONS.filter(
    (opt) => !disabledTypes.includes(opt.type)
  )

  const focusInput = useCallback(() => {
    setFocusedTagIndex(null)
    inputRef.current?.focus()
  }, [])

  const focusTag = useCallback((index: number) => {
    if (index >= 0 && index < tags.length) {
      setFocusedTagIndex(index)
      tagRefs.current[index]?.focus()
    }
  }, [tags.length])

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const cursorAtStart = inputRef.current?.selectionStart === 0

    if (e.key === "Enter") {
      e.preventDefault()
      setDropdownOpen(false)
      if (highlightedIndex >= 0 && availableOptions[highlightedIndex]) {
        onAddTag(availableOptions[highlightedIndex].type)
        setHighlightedIndex(-1)
      } else {
        onSearch()
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (dropdownOpen && availableOptions.length > 0) {
        setHighlightedIndex((prev) => {
          const nextIndex = prev < availableOptions.length - 1 ? prev + 1 : 0
          return nextIndex
        })
      } else if (inputValue.trim()) {
        setDropdownOpen(true)
        setHighlightedIndex(0)
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (dropdownOpen && availableOptions.length > 0) {
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : availableOptions.length - 1
        )
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      e.preventDefault()
      focusTag(tags.length - 1)
    } else if (e.key === "ArrowLeft" && cursorAtStart && tags.length > 0) {
      e.preventDefault()
      focusTag(tags.length - 1)
    } else if (e.key === "Escape") {
      setDropdownOpen(false)
    }
  }

  const handleTagKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault()
      if (index > 0) {
        focusTag(index - 1)
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      if (index < tags.length - 1) {
        focusTag(index + 1)
      } else {
        focusInput()
      }
    } else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault()
      onRemoveTag(tags[index].type)
      if (index > 0) {
        setTimeout(() => focusTag(index - 1), 0)
      } else {
        setTimeout(() => focusInput(), 0)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onInputChange(value)
    if (value.trim().length > 0) {
      setDropdownOpen(true)
      setHighlightedIndex(-1)
    } else {
      setDropdownOpen(false)
    }
  }

  const handleSelectFilter = (type: SearchFilterType) => {
    onAddTag(type)
    setDropdownOpen(false)
    setHighlightedIndex(-1)
    focusInput()
  }

  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || e.target === e.currentTarget) {
      focusInput()
    }
  }

  return (
    <div className="flex gap-2">
      <SearchFilterDropdown
        open={dropdownOpen}
        onOpenChange={(open) => {
          setDropdownOpen(open)
          if (!open) setHighlightedIndex(0)
        }}
        disabledTypes={disabledTypes}
        onSelect={handleSelectFilter}
        highlightedIndex={highlightedIndex}
      >
        <div
          ref={containerRef}
          onClick={handleContainerClick}
          className={cn(
            "flex flex-1 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-2",
            "ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            "min-h-10 cursor-text"
          )}
        >
          {tags.map((tag, index) => (
            <SearchTag
              key={tag.type}
              ref={(el) => {
                tagRefs.current[index] = el
              }}
              tag={tag}
              onRemove={onRemoveTag}
              onKeyDown={(e) => handleTagKeyDown(e, index)}
              isFocused={focusedTagIndex === index}
            />
          ))}
          <input
            ref={inputRef}
            type="text"
            placeholder={tags.length === 0 ? "Type to search..." : ""}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onFocus={() => setFocusedTagIndex(null)}
            className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </SearchFilterDropdown>
      <Button
        onClick={onSearch}
        disabled={isLoading}
      >
        <Search className="h-4 w-4 mr-2" />
        Search
      </Button>
    </div>
  )
}

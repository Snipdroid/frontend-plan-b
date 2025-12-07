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
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const tagRefs = useRef<(HTMLDivElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const disabledTypes = (
    ["byName", "byPackageName", "byMainActivity"] as SearchFilterType[]
  ).filter(hasTagType)

  const availableOptions = FILTER_OPTIONS.filter(
    (opt) => !disabledTypes.includes(opt.type)
  )

  const getFirstAvailableFilterType = useCallback((): SearchFilterType | null => {
    for (const option of FILTER_OPTIONS) {
      if (!hasTagType(option.type)) {
        return option.type
      }
    }
    return null
  }, [hasTagType])

  const handleSearchWithPendingInput = useCallback(() => {
    if (inputValue.trim()) {
      const availableType = getFirstAvailableFilterType()
      if (availableType) {
        onAddTag(availableType)
      }
    }
    setTimeout(() => {
      onSearch()
    }, 0)
  }, [inputValue, getFirstAvailableFilterType, onAddTag, onSearch])

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
      if (dropdownOpen && availableOptions.length > 0) {
        // Select the highlighted option
        const selectedOption = availableOptions[highlightedIndex]
        if (selectedOption) {
          onAddTag(selectedOption.type)
          setDropdownOpen(false)
          setHighlightedIndex(0)
        }
      } else if (inputValue.trim()) {
        setDropdownOpen(true)
        setHighlightedIndex(0)
      } else {
        handleSearchWithPendingInput()
      }
    } else if (e.key === "ArrowDown") {
      if (dropdownOpen && availableOptions.length > 0) {
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev < availableOptions.length - 1 ? prev + 1 : 0
        )
      } else if (inputValue.trim()) {
        e.preventDefault()
        setDropdownOpen(true)
        setHighlightedIndex(0)
      }
    } else if (e.key === "ArrowUp") {
      if (dropdownOpen && availableOptions.length > 0) {
        e.preventDefault()
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
      setHighlightedIndex(0)
    } else {
      setDropdownOpen(false)
    }
  }

  const handleSelectFilter = (type: SearchFilterType) => {
    onAddTag(type)
    setDropdownOpen(false)
    setHighlightedIndex(0)
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
        onClick={handleSearchWithPendingInput}
        disabled={isLoading || (tags.length === 0 && !inputValue.trim())}
      >
        <Search className="h-4 w-4 mr-2" />
        Search
      </Button>
    </div>
  )
}

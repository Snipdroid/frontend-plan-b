import { useState, useCallback } from "react"
import type { SearchTag, SearchFilterType } from "@/types"

const FILTER_LABELS: Record<SearchFilterType, string> = {
  byName: "name",
  byPackageName: "packageName",
  byMainActivity: "mainActivity",
}

export function useSearchTags() {
  const [tags, setTags] = useState<SearchTag[]>([])
  const [inputValue, setInputValue] = useState("")

  const hasTagType = useCallback(
    (type: SearchFilterType) => tags.some((tag) => tag.type === type),
    [tags]
  )

  const addTag = useCallback(
    (type: SearchFilterType) => {
      if (!inputValue.trim()) return
      if (hasTagType(type)) return

      const newTag: SearchTag = {
        type,
        value: inputValue.trim(),
        displayLabel: FILTER_LABELS[type],
      }

      setTags((prev) => [...prev, newTag])
      setInputValue("")
    },
    [inputValue, hasTagType]
  )

  const removeTag = useCallback((type: SearchFilterType) => {
    setTags((prev) => prev.filter((tag) => tag.type !== type))
  }, [])

  const clearTags = useCallback(() => {
    setTags([])
    setInputValue("")
  }, [])

  return {
    tags,
    inputValue,
    setInputValue,
    addTag,
    removeTag,
    clearTags,
    hasTagType,
  }
}

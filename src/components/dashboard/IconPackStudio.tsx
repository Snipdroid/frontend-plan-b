import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  ChevronDown,
  ChevronRight,
  File as FileIcon,
  FileText,
  Folder,
  FolderOpen,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  isImageFileName,
  isTextFile,
  isTextFileName,
  joinPath,
  getFileHandleAtRelativePath,
} from "@/lib/fs-access"
import {
  STRUCTURE_DRAWABLE_DIRECTORY,
  createMappingDraft,
  formatCategoryString,
  parseCategoryString,
  scanStructure,
} from "@/lib/studio-structure"
import { cn } from "@/lib/utils"
import type {
  AppDetailDraft,
  DirectoryPickerWindow,
  DrawableEntry,
  PreviewState,
  StudioDirectoryNode,
  StudioNode,
  StudioViewMode,
  StructureScanState,
} from "@/types/studio"

const isDirectoryHandle = (handle: FileSystemHandle): handle is FileSystemDirectoryHandle =>
  handle.kind === "directory"

const isFileHandle = (handle: FileSystemHandle): handle is FileSystemFileHandle =>
  handle.kind === "file"

function CategoryAddChip({ onAdd }: { onAdd: (category: string) => void }) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isInputVisible, setIsInputVisible] = useState(false)
  const [value, setValue] = useState("")

  useEffect(() => {
    if (isInputVisible) {
      inputRef.current?.focus()
    }
  }, [isInputVisible])

  const reset = () => {
    setValue("")
    setIsInputVisible(false)
  }

  const handleAdd = () => {
    const trimmed = value.trim()
    if (trimmed) {
      onAdd(trimmed)
    }
    reset()
  }

  if (!isInputVisible) {
    return (
      <Badge asChild variant="outline" className="h-[22px] cursor-pointer border-dashed hover:bg-accent">
        <button
          type="button"
          onClick={() => setIsInputVisible(true)}
          aria-label={t("common.add")}
        >
          <Plus className="h-3 w-3" />
        </button>
      </Badge>
    )
  }

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={reset}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          handleAdd()
        }
        if (e.key === "Escape") {
          e.preventDefault()
          reset()
        }
      }}
      placeholder={t("iconPack.studioCategoryInputPlaceholder")}
      className="h-[22px] w-28 border-dashed px-2 text-xs"
    />
  )
}

export function IconPackStudio() {
  const { t } = useTranslation()
  const [viewMode, setViewMode] = useState<StudioViewMode>("apps")
  const [rootPath, setRootPath] = useState<string | null>(null)
  const [nodes, setNodes] = useState<Record<string, StudioNode>>({})
  const [childrenByPath, setChildrenByPath] = useState<Record<string, string[]>>({})
  const [expandedPaths, setExpandedPaths] = useState<string[]>([])
  const [loadingDirectories, setLoadingDirectories] = useState<Record<string, boolean>>({})
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null)
  const [previewState, setPreviewState] = useState<PreviewState>({ kind: "empty" })
  const [studioError, setStudioError] = useState<string | null>(null)
  const [appsSearchQuery, setAppsSearchQuery] = useState("")
  const [selectedAppDrawableName, setSelectedAppDrawableName] = useState<string | null>(null)
  const [selectedAppDrafts, setSelectedAppDrafts] = useState<Record<string, AppDetailDraft>>({})
  const [editingFields, setEditingFields] = useState<Set<string>>(new Set())
  const [selectedAppIconPreviewUrl, setSelectedAppIconPreviewUrl] = useState<string | null>(null)
  const [isSelectedAppIconLoading, setIsSelectedAppIconLoading] = useState(false)
  const [structureScan, setStructureScan] = useState<StructureScanState>({
    status: "idle",
    requiredChecks: [],
    optionalChecks: [],
    drawablePngCount: 0,
    drawableEntries: [],
    appMappingsByDrawable: {},
    categoriesByDrawable: {},
  })

  const imageUrlRef = useRef<string | null>(null)
  const selectedAppIconUrlRef = useRef<string | null>(null)
  const loadingDirectorySetRef = useRef<Set<string>>(new Set())
  const structureScanSessionRef = useRef(0)
  const expandedPathSet = useMemo(() => new Set(expandedPaths), [expandedPaths])
  const isFileSystemAccessSupported =
    typeof window !== "undefined" && "showDirectoryPicker" in (window as DirectoryPickerWindow)

  useEffect(() => {
    return () => {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current)
      }
      if (selectedAppIconUrlRef.current) {
        URL.revokeObjectURL(selectedAppIconUrlRef.current)
      }
    }
  }, [])

  const setPreview = useCallback((next: PreviewState) => {
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current)
      imageUrlRef.current = null
    }
    if (next.kind === "image") {
      imageUrlRef.current = next.url
    }
    setPreviewState(next)
  }, [])

  const loadDirectory = useCallback(async (directoryPath: string, directoryHandle: FileSystemDirectoryHandle) => {
    if (loadingDirectorySetRef.current.has(directoryPath)) return

    loadingDirectorySetRef.current.add(directoryPath)
    setLoadingDirectories((previous) => ({ ...previous, [directoryPath]: true }))

    try {
      const entries: Array<[string, FileSystemHandle]> = []
      for await (const [entryName, entryHandle] of directoryHandle.entries()) {
        entries.push([entryName, entryHandle])
      }

      entries.sort(([leftName, leftHandle], [rightName, rightHandle]) => {
        if (leftHandle.kind !== rightHandle.kind) {
          return leftHandle.kind === "directory" ? -1 : 1
        }
        return leftName.localeCompare(rightName, undefined, { numeric: true, sensitivity: "base" })
      })

      const nextNodes: Record<string, StudioNode> = {}
      const childPaths: string[] = []

      for (const [entryName, entryHandle] of entries) {
        const childPath = joinPath(directoryPath, entryName)
        childPaths.push(childPath)

        if (isDirectoryHandle(entryHandle)) {
          nextNodes[childPath] = {
            path: childPath,
            name: entryName,
            kind: "directory",
            handle: entryHandle,
            loaded: false,
          }
          continue
        }

        if (isFileHandle(entryHandle)) {
          nextNodes[childPath] = {
            path: childPath,
            name: entryName,
            kind: "file",
            handle: entryHandle,
          }
        }
      }

      setNodes((previous) => {
        const currentDirectoryNode = previous[directoryPath]
        // If the directory node doesn't exist in state yet (e.g., during initial load),
        // create it from the handle we have
        const directoryNodeToUpdate = currentDirectoryNode ?? {
          path: directoryPath,
          name: directoryHandle.name,
          kind: "directory" as const,
          handle: directoryHandle,
          loaded: false,
        }
        if (directoryNodeToUpdate.kind !== "directory") return previous
        return {
          ...previous,
          ...nextNodes,
          [directoryPath]: {
            ...directoryNodeToUpdate,
            loaded: true,
          },
        }
      })

      setChildrenByPath((previous) => ({
        ...previous,
        [directoryPath]: childPaths,
      }))
    } catch (error) {
      console.error(t("iconPack.studioErrorLoadDirectory"), error)
      setStudioError(t("iconPack.studioErrorLoadDirectory"))
    } finally {
      loadingDirectorySetRef.current.delete(directoryPath)
      setLoadingDirectories((previous) => {
        const next = { ...previous }
        delete next[directoryPath]
        return next
      })
    }
  }, [t])

  const runStructureScan = useCallback(async (selectedRootDirectoryHandle: FileSystemDirectoryHandle) => {
    const currentSessionId = structureScanSessionRef.current + 1
    structureScanSessionRef.current = currentSessionId

    setStructureScan({
      status: "scanning",
      requiredChecks: [],
      optionalChecks: [],
      drawablePngCount: 0,
      drawableEntries: [],
      appMappingsByDrawable: {},
      categoriesByDrawable: {},
    })

    try {
      const result = await scanStructure(selectedRootDirectoryHandle)

      if (structureScanSessionRef.current !== currentSessionId) {
        return
      }

      setSelectedAppDrawableName((previous) => {
        if (result.drawableEntries.length === 0) return null
        if (previous && result.drawableEntries.some((entry) => entry.drawableName === previous)) {
          return previous
        }
        return result.drawableEntries[0]?.drawableName ?? null
      })

      setStructureScan({
        status: "done",
        ...result,
      })
    } catch (error) {
      console.error(t("iconPack.studioStructureScanFailed"), error)
      setStructureScan({
        status: "error",
        requiredChecks: [],
        optionalChecks: [],
        drawablePngCount: 0,
        drawableEntries: [],
        appMappingsByDrawable: {},
        categoriesByDrawable: {},
        errorMessage: t("iconPack.studioStructureScanFailed"),
      })
    }
  }, [t])

  const handleOpenFolder = useCallback(async () => {
    if (!isFileSystemAccessSupported) {
      setStudioError(t("iconPack.studioBrowserNotSupported"))
      return
    }

    const showDirectoryPicker = (window as DirectoryPickerWindow).showDirectoryPicker
    if (!showDirectoryPicker) {
      setStudioError(t("iconPack.studioBrowserNotSupported"))
      return
    }

    try {
      const directoryHandle = await showDirectoryPicker({
        id: "apptracker-studio",
        mode: "read",
      })

      const rootDirectoryNode: StudioDirectoryNode = {
        path: "",
        name: directoryHandle.name,
        kind: "directory",
        handle: directoryHandle,
        loaded: false,
      }

      setNodes({ "": rootDirectoryNode })
      setChildrenByPath({})
      setExpandedPaths([])
      setRootPath("")
      setViewMode("apps")
      setSelectedFilePath(null)
      setAppsSearchQuery("")
      setSelectedAppDrawableName(null)
      setSelectedAppDrafts({})
      setEditingFields(new Set())
      if (selectedAppIconUrlRef.current) {
        URL.revokeObjectURL(selectedAppIconUrlRef.current)
        selectedAppIconUrlRef.current = null
      }
      setSelectedAppIconPreviewUrl(null)
      setIsSelectedAppIconLoading(false)
      setStudioError(null)
      setPreview({ kind: "empty" })

      await loadDirectory("", directoryHandle)
      void runStructureScan(directoryHandle)
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }
      console.error(t("iconPack.studioErrorOpenFolder"), error)
      setStudioError(t("iconPack.studioErrorOpenFolder"))
    }
  }, [isFileSystemAccessSupported, loadDirectory, runStructureScan, setPreview, t])

  const handleToggleDirectory = useCallback(
    async (directoryPath: string, directoryHandle: FileSystemDirectoryHandle, isLoaded: boolean) => {
      let shouldExpand = false

      setExpandedPaths((previous) => {
        if (previous.includes(directoryPath)) {
          return previous.filter((path) => path !== directoryPath)
        }
        shouldExpand = true
        return [...previous, directoryPath]
      })

      if (shouldExpand && !isLoaded) {
        await loadDirectory(directoryPath, directoryHandle)
      }
    },
    [loadDirectory]
  )

  const handleOpenFile = useCallback(async (filePath: string, fileHandle: FileSystemFileHandle) => {
    setSelectedFilePath(filePath)
    setStudioError(null)
    setPreview({ kind: "loading" })

    try {
      const file = await fileHandle.getFile()
      if (file.type.startsWith("image/") || isImageFileName(file.name)) {
        setPreview({
          kind: "image",
          url: URL.createObjectURL(file),
          mimeType: file.type || "image/*",
        })
        return
      }

      if (isTextFile(file)) {
        const textContent = await file.text()
        setPreview({ kind: "text", content: textContent })
        return
      }

      setPreview({
        kind: "unsupported",
        mimeType: file.type || "application/octet-stream",
      })
    } catch (error) {
      console.error(t("iconPack.studioErrorLoadFile"), error)
      setPreview({ kind: "error", message: t("iconPack.studioErrorLoadFile") })
    }
  }, [setPreview, t])

  const renderTreeNode = useCallback((nodePath: string, depth: number): ReactNode => {
    const node = nodes[nodePath]
    if (!node) return null

    const isDirectory = node.kind === "directory"
    const isExpanded = isDirectory ? expandedPathSet.has(nodePath) : false
    const isSelected = !isDirectory && selectedFilePath === nodePath

    return (
      <div key={nodePath}>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
            isSelected && "bg-accent text-accent-foreground"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (isDirectory) {
              void handleToggleDirectory(nodePath, node.handle, node.loaded)
              return
            }
            void handleOpenFile(nodePath, node.handle)
          }}
        >
          {isDirectory ? (
            isExpanded ? (
              <ChevronDown className="size-4 shrink-0" />
            ) : (
              <ChevronRight className="size-4 shrink-0" />
            )
          ) : (
            <span className="size-4 shrink-0" />
          )}

          {isDirectory ? (
            isExpanded ? (
              <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <Folder className="size-4 shrink-0 text-muted-foreground" />
            )
          ) : isImageFileName(node.name) ? (
            <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
          ) : isTextFileName(node.name) ? (
            <FileText className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <FileIcon className="size-4 shrink-0 text-muted-foreground" />
          )}

          <span className="truncate">{node.name}</span>
        </button>

        {isDirectory && isExpanded && (
          <>
            {loadingDirectories[nodePath] && (
              <div
                className="flex items-center gap-2 py-1.5 text-xs text-muted-foreground"
                style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
              >
                <Loader2 className="size-3 animate-spin" />
                <span>{t("iconPack.studioLoadingFolder")}</span>
              </div>
            )}

            {!loadingDirectories[nodePath] &&
              node.loaded &&
              (childrenByPath[nodePath]?.length ?? 0) === 0 && (
              <p
                className="py-1.5 text-xs text-muted-foreground"
                style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
              >
                {t("iconPack.studioEmptyFolder")}
              </p>
            )}

            {!loadingDirectories[nodePath] &&
              (childrenByPath[nodePath] ?? []).map((childPath) => renderTreeNode(childPath, depth + 1))}
          </>
        )}
      </div>
    )
  }, [childrenByPath, expandedPathSet, handleOpenFile, handleToggleDirectory, loadingDirectories, nodes, selectedFilePath, t])

  const handleStructureRescan = useCallback(() => {
    const selectedRootDirectory = nodes[""]
    if (!selectedRootDirectory || selectedRootDirectory.kind !== "directory") return
    void runStructureScan(selectedRootDirectory.handle)
  }, [nodes, runStructureScan])

  const appsSearchQueryNormalized = appsSearchQuery.trim().toLowerCase()
  const filteredDrawableEntries = appsSearchQueryNormalized
    ? structureScan.drawableEntries.filter((entry) => {
      return (
        entry.drawableName.toLowerCase().includes(appsSearchQueryNormalized) ||
        entry.fileName.toLowerCase().includes(appsSearchQueryNormalized)
      )
    })
    : structureScan.drawableEntries
  const selectedDrawableEntry = filteredDrawableEntries.length === 0
    ? null
    : selectedAppDrawableName
      ? filteredDrawableEntries.find((entry) => entry.drawableName === selectedAppDrawableName) || filteredDrawableEntries[0]
      : filteredDrawableEntries[0]

  const createDefaultAppDraft = useCallback((entry: DrawableEntry): AppDetailDraft => {
    const mappings = structureScan.appMappingsByDrawable[entry.drawableName] || []
    const categories = structureScan.categoriesByDrawable[entry.drawableName] || []
    const mappingDrafts = mappings.length > 0
      ? mappings.map((mapping, index) =>
        createMappingDraft(
          mapping.packageName || "",
          mapping.activityName || "",
          `${entry.drawableName}-${index}`
        )
      )
      : [createMappingDraft("", "", `${entry.drawableName}-0`)]

    return {
      drawableName: entry.drawableName,
      fileName: entry.fileName,
      mappings: mappingDrafts,
      categories: categories.join(", "),
      isDirty: false,
    }
  }, [structureScan.appMappingsByDrawable, structureScan.categoriesByDrawable])

  useEffect(() => {
    if (!selectedDrawableEntry) return

    setSelectedAppDrafts((previous) => {
      if (previous[selectedDrawableEntry.drawableName]) return previous
      return {
        ...previous,
        [selectedDrawableEntry.drawableName]: createDefaultAppDraft(selectedDrawableEntry),
      }
    })
  }, [createDefaultAppDraft, selectedDrawableEntry])

  useEffect(() => {
    setSelectedAppDrafts((previous) => {
      let changed = false
      const next = { ...previous }

      for (const entry of structureScan.drawableEntries) {
        const existing = next[entry.drawableName]
        if (!existing || existing.isDirty) continue

        const refreshed = createDefaultAppDraft(entry)
        const existingSignature = JSON.stringify({
          mappings: existing.mappings,
          categories: existing.categories,
        })
        const refreshedSignature = JSON.stringify({
          mappings: refreshed.mappings,
          categories: refreshed.categories,
        })

        if (existingSignature !== refreshedSignature) {
          next[entry.drawableName] = refreshed
          changed = true
        }
      }

      return changed ? next : previous
    })
  }, [createDefaultAppDraft, structureScan.drawableEntries])

  useEffect(() => {
    let cancelled = false

    const loadSelectedAppIconPreview = async () => {
      const rootDirectory = nodes[""]
      if (!selectedDrawableEntry || !rootDirectory || rootDirectory.kind !== "directory") {
        if (selectedAppIconUrlRef.current) {
          URL.revokeObjectURL(selectedAppIconUrlRef.current)
          selectedAppIconUrlRef.current = null
        }
        setSelectedAppIconPreviewUrl(null)
        setIsSelectedAppIconLoading(false)
        return
      }

      setIsSelectedAppIconLoading(true)
      try {
        const relativePath = `${STRUCTURE_DRAWABLE_DIRECTORY}/${selectedDrawableEntry.fileName}`
        const fileHandle = await getFileHandleAtRelativePath(rootDirectory.handle, relativePath)
        if (!fileHandle) {
          if (!cancelled) {
            if (selectedAppIconUrlRef.current) {
              URL.revokeObjectURL(selectedAppIconUrlRef.current)
              selectedAppIconUrlRef.current = null
            }
            setSelectedAppIconPreviewUrl(null)
          }
          return
        }

        const file = await fileHandle.getFile()
        const nextUrl = URL.createObjectURL(file)

        if (cancelled) {
          URL.revokeObjectURL(nextUrl)
          return
        }

        if (selectedAppIconUrlRef.current) {
          URL.revokeObjectURL(selectedAppIconUrlRef.current)
        }
        selectedAppIconUrlRef.current = nextUrl
        setSelectedAppIconPreviewUrl(nextUrl)
      } catch (error) {
        console.error(t("iconPack.studioErrorLoadFile"), error)
        if (!cancelled) {
          if (selectedAppIconUrlRef.current) {
            URL.revokeObjectURL(selectedAppIconUrlRef.current)
            selectedAppIconUrlRef.current = null
          }
          setSelectedAppIconPreviewUrl(null)
        }
      } finally {
        if (!cancelled) {
          setIsSelectedAppIconLoading(false)
        }
      }
    }

    void loadSelectedAppIconPreview()

    return () => {
      cancelled = true
    }
  }, [nodes, selectedDrawableEntry, t])

  useEffect(() => {
    setEditingFields(new Set())
  }, [selectedDrawableEntry?.drawableName])

  if (rootPath === null) {
    return (
      <div className="mx-[-1rem] my-[-1rem] flex h-[calc(100dvh-4rem)] overflow-hidden flex-col items-center justify-center gap-4 px-4 text-center md:mx-[-1.5rem] md:my-[-1.5rem]">
        <Button onClick={handleOpenFolder} disabled={!isFileSystemAccessSupported}>
          {t("iconPack.studioOpenFolder")}
        </Button>

        <p className="max-w-md text-sm text-muted-foreground">
          {isFileSystemAccessSupported
            ? t("iconPack.studioOpenFolderDesc")
            : t("iconPack.studioBrowserNotSupported")}
        </p>

        {studioError && <p className="text-sm text-destructive">{studioError}</p>}
      </div>
    )
  }

  const rootNode = nodes[rootPath]
  const rootChildren = childrenByPath[rootPath] ?? []
  const isRootLoading = !!loadingDirectories[rootPath]
  const selectedNode = selectedFilePath ? nodes[selectedFilePath] : undefined
  const selectedAppDraft = selectedDrawableEntry
    ? selectedAppDrafts[selectedDrawableEntry.drawableName] ?? createDefaultAppDraft(selectedDrawableEntry)
    : null
  const selectedAppDraftCategories = selectedAppDraft
    ? parseCategoryString(selectedAppDraft.categories)
    : []
  const isFieldEditing = (field: string) => editingFields.has(field)
  const handleFieldEditToggle = (field: string) => {
    setEditingFields((previous) => {
      const next = new Set(previous)
      if (next.has(field)) {
        next.delete(field)
      } else {
        next.add(field)
      }
      return next
    })
  }
  const handleSelectedAppDraftChange = (patch: Partial<AppDetailDraft>) => {
    if (!selectedDrawableEntry) return

    setSelectedAppDrafts((previous) => {
      const base = previous[selectedDrawableEntry.drawableName] ?? createDefaultAppDraft(selectedDrawableEntry)
      return {
        ...previous,
        [selectedDrawableEntry.drawableName]: {
          ...base,
          ...patch,
          isDirty: true,
        },
      }
    })
  }
  const handleSelectedAppDraftMappingRemove = (mappingId: string) => {
    if (!selectedAppDraft) return
    handleSelectedAppDraftChange({
      mappings: selectedAppDraft.mappings.filter((mapping) => mapping.id !== mappingId),
    })
  }

  const handleSelectedAppDraftCategoryRemove = (categoryToRemove: string) => {
    if (!selectedAppDraft) return

    const nextCategories = parseCategoryString(selectedAppDraft.categories).filter(
      (category) => category !== categoryToRemove
    )
    handleSelectedAppDraftChange({
      categories: formatCategoryString(nextCategories),
    })
  }

  const requiredMatchedCount = structureScan.requiredChecks.filter((item) => item.exists).length
  const isStructureReady =
    structureScan.status === "done" &&
    structureScan.requiredChecks.length > 0 &&
    requiredMatchedCount === structureScan.requiredChecks.length
  const showStructureStatusHeader = structureScan.status !== "done" || !isStructureReady

  return (
    <div className="mx-[-1rem] my-[-1rem] flex h-[calc(100dvh-4rem)] overflow-hidden flex-col md:mx-[-1.5rem] md:my-[-1.5rem]">
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-3 md:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Tabs
            value={viewMode}
            onValueChange={(value) => setViewMode(value as StudioViewMode)}
            className="gap-0"
          >
            <TabsList className="h-8">
              <TabsTrigger value="apps" className="px-3 text-xs">
                {t("iconPack.studioEditorModeApps")}
              </TabsTrigger>
              <TabsTrigger value="drawable" className="px-3 text-xs">
                {t("iconPack.studioEditorModeDrawable")}
              </TabsTrigger>
              <TabsTrigger value="appfilter" className="px-3 text-xs">
                {t("iconPack.studioEditorModeAppfilter")}
              </TabsTrigger>
              <TabsTrigger value="browse" className="px-3 text-xs">
                {t("iconPack.studioTabBrowse")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="hidden truncate text-sm text-muted-foreground md:block">{rootNode?.name ?? "-"}</p>
        </div>
        <Button size="sm" variant="outline" onClick={handleOpenFolder}>
          {t("iconPack.studioChangeFolder")}
        </Button>
      </div>

      {studioError && (
        <div className="border-b px-3 py-2 text-sm text-destructive md:px-4">{studioError}</div>
      )}

      {viewMode === "browse" ? (
        <div className="grid min-h-0 flex-1 overflow-hidden grid-rows-[40%_60%] md:grid-cols-[320px_1fr] md:grid-rows-1">
          <aside className="flex min-h-0 overflow-hidden flex-col border-b md:border-r md:border-b-0">
            <div className="flex h-10 shrink-0 items-center border-b px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t("iconPack.studioFiles")}
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-2">
              {isRootLoading && (
                <div className="flex items-center gap-2 py-1.5 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  <span>{t("iconPack.studioLoadingFolder")}</span>
                </div>
              )}

              {!isRootLoading && rootNode?.kind === "directory" && rootNode.loaded && rootChildren.length === 0 && (
                <p className="py-1.5 text-xs text-muted-foreground">{t("iconPack.studioEmptyFolder")}</p>
              )}

              {!isRootLoading && rootChildren.map((childPath) => renderTreeNode(childPath, 0))}
            </div>
          </aside>

          <section className="flex min-h-0 overflow-hidden flex-col">
            <div className="flex h-10 shrink-0 items-center border-b px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <span className="truncate">
                {selectedNode?.name ?? t("iconPack.studioNoFileSelected")}
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              {previewState.kind === "loading" && (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t("iconPack.studioLoadingFile")}
                </div>
              )}

              {previewState.kind === "empty" && (
                <div className="flex h-full items-center justify-center px-6 text-sm text-muted-foreground">
                  {t("iconPack.studioNoFileSelected")}
                </div>
              )}

              {previewState.kind === "text" && (
                <ScrollArea className="h-full">
                  <pre className="px-4 py-3 font-mono text-xs leading-5 whitespace-pre-wrap break-words">
                    {previewState.content}
                  </pre>
                </ScrollArea>
              )}

              {previewState.kind === "image" && (
                <ScrollArea className="h-full">
                  <div className="flex min-h-full items-center justify-center p-4">
                    <img
                      src={previewState.url}
                      alt={selectedNode?.name ?? "preview"}
                      className="max-h-full w-auto max-w-full object-contain"
                    />
                  </div>
                </ScrollArea>
              )}

              {previewState.kind === "unsupported" && (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                  {t("iconPack.studioUnsupportedFile")} ({previewState.mimeType})
                </div>
              )}

              {previewState.kind === "error" && (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-destructive">
                  {previewState.message}
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <section className="flex min-h-0 flex-1 overflow-hidden flex-col">
          {showStructureStatusHeader && (
            <div className="flex h-10 shrink-0 items-center justify-between border-b px-3">
              <p className="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t("iconPack.studioStructureStatus")}
              </p>
              <div className="flex items-center gap-2">
                {structureScan.status === "done" && (
                  <p className="hidden text-xs text-muted-foreground lg:block">
                    {t("iconPack.studioStructureRequired")} ({requiredMatchedCount}/{structureScan.requiredChecks.length})
                  </p>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleStructureRescan}
                  disabled={structureScan.status === "scanning"}
                >
                  <RefreshCw
                    className={cn(
                      "mr-1 size-3.5",
                      structureScan.status === "scanning" && "animate-spin"
                    )}
                  />
                  {t("iconPack.studioStructureRescan")}
                </Button>
              </div>
            </div>
          )}

          {structureScan.status === "scanning" && (
            <div className="flex min-h-0 flex-1 items-center justify-center p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span>{t("iconPack.studioStructureScanning")}</span>
              </div>
            </div>
          )}

          {structureScan.status === "error" && (
            <div className="flex min-h-0 flex-1 items-center justify-center p-4">
              <p className="text-sm text-destructive">
                {structureScan.errorMessage || t("iconPack.studioStructureScanFailed")}
              </p>
            </div>
          )}

          {structureScan.status === "done" && (
            <>
              {!isStructureReady && (
                <div className="flex shrink-0 flex-col gap-1 border-b px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-amber-600">{t("iconPack.studioStructureNeedsFix")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("iconPack.studioStructureDrawableCount", { count: structureScan.drawablePngCount })}
                    </p>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{t("iconPack.studioStructureRootHint")}</p>
                </div>
              )}

              {viewMode === "apps" ? (
                <div className="grid min-h-0 flex-1 overflow-hidden grid-rows-[45%_55%] md:grid-cols-[280px_1fr] md:grid-rows-1">
                  <aside className="flex min-h-0 flex-col border-b md:border-r md:border-b-0">
                    <div className="flex h-10 shrink-0 items-center border-b px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {t("iconPack.studioAppsListTitle", { count: structureScan.drawablePngCount })}
                    </div>
                    <div className="shrink-0 border-b p-2">
                      <Input
                        value={appsSearchQuery}
                        onChange={(event) => setAppsSearchQuery(event.target.value)}
                        placeholder={t("iconPack.studioAppsSearchPlaceholder")}
                        className="h-8"
                      />
                    </div>
                    <div className="min-h-0 flex-1 overflow-auto p-2">
                      {structureScan.drawableEntries.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t("iconPack.studioNoDrawableIcons")}</p>
                      ) : filteredDrawableEntries.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t("iconPack.studioAppsNoSearchResults")}</p>
                      ) : (
                        filteredDrawableEntries.map((entry) => (
                          <button
                            key={entry.fileName}
                            type="button"
                            className={cn(
                              "mb-1 flex w-full flex-col rounded-md px-2 py-1.5 text-left hover:bg-accent hover:text-accent-foreground",
                              selectedDrawableEntry?.drawableName === entry.drawableName &&
                                "bg-accent text-accent-foreground"
                            )}
                            onClick={() => setSelectedAppDrawableName(entry.drawableName)}
                          >
                            <span className="truncate text-sm font-medium">{entry.drawableName}</span>
                            <span className="truncate text-xs text-muted-foreground">{entry.fileName}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </aside>

                  <section className="flex min-h-0 flex-col">
                    <div className="flex h-10 shrink-0 items-center border-b px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {selectedDrawableEntry
                        ? selectedDrawableEntry.drawableName
                        : t("iconPack.studioAppsDetailTitle")}
                    </div>
                    <div className="min-h-0 flex-1 overflow-auto p-4">
                      {selectedDrawableEntry && selectedAppDraft ? (
                        <div className="space-y-5">
                          <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
                            <div className="space-y-2">
                              <div className="bg-muted flex aspect-square w-full max-w-[180px] items-center justify-center overflow-hidden rounded-md border">
                                {isSelectedAppIconLoading ? (
                                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                                ) : selectedAppIconPreviewUrl ? (
                                  <img
                                    src={selectedAppIconPreviewUrl}
                                    alt={selectedDrawableEntry.drawableName}
                                    className="h-full w-full object-contain p-2"
                                  />
                                ) : (
                                  <p className="px-3 text-center text-xs text-muted-foreground">
                                    {t("iconPack.studioPreviewUnavailable")}
                                  </p>
                                )}
                              </div>
                              <p className="truncate font-mono text-xs text-muted-foreground">
                                {selectedDrawableEntry.fileName}
                              </p>
                            </div>

                            <div className="grid gap-3">
                              <div className="grid gap-1.5">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="studio-drawable-name">{t("iconPack.studioFieldDrawableName")}</Label>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 gap-1 px-1.5 text-xs text-muted-foreground"
                                    onClick={() => handleFieldEditToggle("drawableName")}
                                  >
                                    {isFieldEditing("drawableName") ? t("common.save") : <Pencil className="size-3" />}
                                  </Button>
                                </div>
                                <Input
                                  id="studio-drawable-name"
                                  value={selectedAppDraft.drawableName}
                                  readOnly={!isFieldEditing("drawableName")}
                                  onChange={(event) => handleSelectedAppDraftChange({ drawableName: event.target.value })}
                                />
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <Label>{t("iconPack.studioFieldMappings")}</Label>
                                </div>

                                <div className="space-y-2">
                                  {selectedAppDraft.mappings.length > 0 ? (
                                    selectedAppDraft.mappings.map((mapping) => (
                                      <div key={mapping.id} className="rounded-md border p-3">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="min-w-0 flex-1 space-y-1">
                                            <p className="font-mono text-xs break-all">
                                              {mapping.packageName || "-"}
                                            </p>
                                            <p className="font-mono text-xs break-all text-muted-foreground">
                                              {mapping.activityName || "-"}
                                            </p>
                                          </div>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="shrink-0 text-xs text-muted-foreground hover:text-destructive"
                                            onClick={() => handleSelectedAppDraftMappingRemove(mapping.id)}
                                          >
                                            {t("common.remove")}
                                          </Button>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="rounded-md border border-dashed p-4">
                                      <p className="text-center text-sm text-muted-foreground">{t("iconPack.studioNoMappingsConfigured")}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>{t("iconPack.studioFieldCategories")}</Label>
                                <div className="flex min-h-[22px] flex-wrap items-center gap-1">
                                  {selectedAppDraftCategories.map((category) => (
                                    <Badge key={category} variant="secondary" className="gap-1 pr-1 text-xs">
                                      {category}
                                      <button
                                        type="button"
                                        onClick={() => handleSelectedAppDraftCategoryRemove(category)}
                                        className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                                        aria-label={`${t("common.delete")} ${category}`}
                                      >
                                        <X className="size-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                  <CategoryAddChip onAdd={(category) => handleSelectedAppDraftChange({ categories: formatCategoryString([...selectedAppDraftCategories, category]) })} />
                                </div>
                              </div>

                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center text-center">
                          <p className="text-sm text-muted-foreground">{t("iconPack.studioAppsSelectHint")}</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 items-center justify-center p-4 text-sm text-muted-foreground">
                  {t("iconPack.studioEditorModePlaceholder", {
                    mode: t(
                      viewMode === "drawable"
                        ? "iconPack.studioEditorModeDrawable"
                        : "iconPack.studioEditorModeAppfilter"
                    ),
                  })}
                </div>
              )}
            </>
          )}
        </section>
      )}
      </div>
    )
  }

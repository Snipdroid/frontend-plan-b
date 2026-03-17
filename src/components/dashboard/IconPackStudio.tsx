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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

type WellKnownDirectory =
  | "desktop"
  | "documents"
  | "downloads"
  | "music"
  | "pictures"
  | "videos"

interface DirectoryPickerOptions {
  id?: string
  mode?: "read" | "readwrite"
  startIn?: FileSystemHandle | WellKnownDirectory
}

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: (options?: DirectoryPickerOptions) => Promise<FileSystemDirectoryHandle>
}

interface StudioNodeBase {
  path: string
  name: string
}

interface StudioDirectoryNode extends StudioNodeBase {
  kind: "directory"
  handle: FileSystemDirectoryHandle
  loaded: boolean
}

interface StudioFileNode extends StudioNodeBase {
  kind: "file"
  handle: FileSystemFileHandle
}

type StudioNode = StudioDirectoryNode | StudioFileNode

type PreviewState =
  | { kind: "empty" }
  | { kind: "loading" }
  | { kind: "text"; content: string }
  | { kind: "image"; url: string; mimeType: string }
  | { kind: "unsupported"; mimeType: string }
  | { kind: "error"; message: string }

const TEXT_FILE_EXTENSIONS = new Set([
  "txt",
  "md",
  "json",
  "xml",
  "js",
  "jsx",
  "ts",
  "tsx",
  "css",
  "scss",
  "sass",
  "less",
  "html",
  "htm",
  "yaml",
  "yml",
  "toml",
  "ini",
  "conf",
  "properties",
  "java",
  "kt",
  "kts",
  "c",
  "cpp",
  "h",
  "hpp",
  "go",
  "rs",
  "py",
  "rb",
  "sh",
  "bat",
  "ps1",
  "svg",
])

const IMAGE_FILE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "ico", "svg", "avif"])

const TEXT_MIME_HINTS = ["json", "xml", "javascript", "typescript", "yaml", "toml", "x-sh", "shellscript"]

const getFileExtension = (fileName: string) => {
  const lastDotIndex = fileName.lastIndexOf(".")
  if (lastDotIndex < 0) return ""
  return fileName.slice(lastDotIndex + 1).toLowerCase()
}

const joinPath = (parentPath: string, childName: string) => {
  if (!parentPath) return childName
  return `${parentPath}/${childName}`
}

const isTextFileName = (fileName: string) => TEXT_FILE_EXTENSIONS.has(getFileExtension(fileName))

const isImageFileName = (fileName: string) => IMAGE_FILE_EXTENSIONS.has(getFileExtension(fileName))

const isTextFile = (file: File) => {
  const mimeType = file.type.toLowerCase()
  if (mimeType.startsWith("text/")) return true
  if (TEXT_MIME_HINTS.some((hint) => mimeType.includes(hint))) return true
  return isTextFileName(file.name)
}

export function IconPackStudio() {
  const { t } = useTranslation()
  const [rootPath, setRootPath] = useState<string | null>(null)
  const [nodes, setNodes] = useState<Record<string, StudioNode>>({})
  const [childrenByPath, setChildrenByPath] = useState<Record<string, string[]>>({})
  const [expandedPaths, setExpandedPaths] = useState<string[]>([])
  const [loadingDirectories, setLoadingDirectories] = useState<Record<string, boolean>>({})
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null)
  const [previewState, setPreviewState] = useState<PreviewState>({ kind: "empty" })
  const [studioError, setStudioError] = useState<string | null>(null)

  const imageUrlRef = useRef<string | null>(null)
  const loadingDirectorySetRef = useRef<Set<string>>(new Set())
  const expandedPathSet = useMemo(() => new Set(expandedPaths), [expandedPaths])
  const isFileSystemAccessSupported =
    typeof window !== "undefined" && "showDirectoryPicker" in (window as DirectoryPickerWindow)

  useEffect(() => {
    return () => {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current)
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

        if (entryHandle.kind === "directory") {
          nextNodes[childPath] = {
            path: childPath,
            name: entryName,
            kind: "directory",
            handle: entryHandle,
            loaded: false,
          }
          continue
        }

        nextNodes[childPath] = {
          path: childPath,
          name: entryName,
          kind: "file",
          handle: entryHandle,
        }
      }

      setNodes((previous) => {
        const currentDirectoryNode = previous[directoryPath]
        if (!currentDirectoryNode || currentDirectoryNode.kind !== "directory") return previous
        return {
          ...previous,
          ...nextNodes,
          [directoryPath]: {
            ...currentDirectoryNode,
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
      setSelectedFilePath(null)
      setStudioError(null)
      setPreview({ kind: "empty" })

      await loadDirectory("", directoryHandle)
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }
      console.error(t("iconPack.studioErrorOpenFolder"), error)
      setStudioError(t("iconPack.studioErrorOpenFolder"))
    }
  }, [isFileSystemAccessSupported, loadDirectory, setPreview, t])

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

  return (
    <div className="mx-[-1rem] my-[-1rem] flex h-[calc(100dvh-4rem)] overflow-hidden flex-col md:mx-[-1.5rem] md:my-[-1.5rem]">
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-3 md:px-4">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{rootNode?.name ?? "-"}</p>
        </div>
        <Button size="sm" variant="outline" onClick={handleOpenFolder}>
          {t("iconPack.studioChangeFolder")}
        </Button>
      </div>

      {studioError && (
        <div className="border-b px-3 py-2 text-sm text-destructive md:px-4">{studioError}</div>
      )}

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
    </div>
  )
}

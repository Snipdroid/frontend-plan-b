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

const IMAGE_FILE_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "bmp", "ico", "svg", "avif",
])

const TEXT_MIME_HINTS = [
  "json", "xml", "javascript", "typescript", "yaml", "toml", "x-sh", "shellscript",
]

export const getFileExtension = (fileName: string) => {
  const lastDotIndex = fileName.lastIndexOf(".")
  if (lastDotIndex < 0) return ""
  return fileName.slice(lastDotIndex + 1).toLowerCase()
}

export const joinPath = (parentPath: string, childName: string) => {
  if (!parentPath) return childName
  return `${parentPath}/${childName}`
}

export const splitRelativePath = (relativePath: string) =>
  relativePath.split("/").filter(Boolean)

export const isTextFileName = (fileName: string) =>
  TEXT_FILE_EXTENSIONS.has(getFileExtension(fileName))

export const isImageFileName = (fileName: string) =>
  IMAGE_FILE_EXTENSIONS.has(getFileExtension(fileName))

export const isTextFile = (file: File) => {
  const mimeType = file.type.toLowerCase()
  if (mimeType.startsWith("text/")) return true
  if (TEXT_MIME_HINTS.some((hint) => mimeType.includes(hint))) return true
  return isTextFileName(file.name)
}

export const getDirectoryHandleByRelativePath = async (
  rootDirectoryHandle: FileSystemDirectoryHandle,
  relativePath: string
) => {
  const segments = splitRelativePath(relativePath)
  let currentHandle = rootDirectoryHandle

  for (const segment of segments) {
    try {
      currentHandle = await currentHandle.getDirectoryHandle(segment)
    } catch {
      return null
    }
  }

  return currentHandle
}

export const getFileHandleAtRelativePath = async (
  rootDirectoryHandle: FileSystemDirectoryHandle,
  relativePath: string
) => {
  const segments = splitRelativePath(relativePath)
  const fileName = segments.pop()
  if (!fileName) return null

  const parentDirectoryPath = segments.join("/")
  const parentDirectoryHandle = parentDirectoryPath
    ? await getDirectoryHandleByRelativePath(rootDirectoryHandle, parentDirectoryPath)
    : rootDirectoryHandle

  if (!parentDirectoryHandle) return null

  try {
    return await parentDirectoryHandle.getFileHandle(fileName)
  } catch {
    return null
  }
}

export const getFileTextAtRelativePath = async (
  rootDirectoryHandle: FileSystemDirectoryHandle,
  relativePath: string
) => {
  const fileHandle = await getFileHandleAtRelativePath(rootDirectoryHandle, relativePath)
  if (!fileHandle) return null

  try {
    const file = await fileHandle.getFile()
    return await file.text()
  } catch {
    return null
  }
}

export const hasDirectoryAtRelativePath = async (
  rootDirectoryHandle: FileSystemDirectoryHandle,
  relativePath: string
) => {
  const directoryHandle = await getDirectoryHandleByRelativePath(rootDirectoryHandle, relativePath)
  return !!directoryHandle
}

export const hasFileAtRelativePath = async (
  rootDirectoryHandle: FileSystemDirectoryHandle,
  relativePath: string
) => {
  return !!(await getFileHandleAtRelativePath(rootDirectoryHandle, relativePath))
}

export const listPngDrawableEntries = async (
  rootDirectoryHandle: FileSystemDirectoryHandle,
  relativePath: string
) => {
  const directoryHandle = await getDirectoryHandleByRelativePath(rootDirectoryHandle, relativePath)
  if (!directoryHandle) return []

  const fileNames: string[] = []
  for await (const [entryName, entryHandle] of directoryHandle.entries()) {
    if (entryHandle.kind !== "file") continue
    if (entryName.toLowerCase().endsWith(".png")) {
      fileNames.push(entryName)
    }
  }

  fileNames.sort((left, right) =>
    left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" })
  )

  return fileNames.map((fileName) => ({
    fileName,
    drawableName: fileName.replace(/\.png$/i, "").toLowerCase(),
  }))
}

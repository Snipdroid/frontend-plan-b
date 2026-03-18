type WellKnownDirectory =
  | "desktop"
  | "documents"
  | "downloads"
  | "music"
  | "pictures"
  | "videos"

export interface DirectoryPickerOptions {
  id?: string
  mode?: "read" | "readwrite"
  startIn?: FileSystemHandle | WellKnownDirectory
}

export type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: (options?: DirectoryPickerOptions) => Promise<FileSystemDirectoryHandle>
}

interface StudioNodeBase {
  path: string
  name: string
}

export interface StudioDirectoryNode extends StudioNodeBase {
  kind: "directory"
  handle: FileSystemDirectoryHandle
  loaded: boolean
}

export interface StudioFileNode extends StudioNodeBase {
  kind: "file"
  handle: FileSystemFileHandle
}

export type StudioNode = StudioDirectoryNode | StudioFileNode

export type PreviewState =
  | { kind: "empty" }
  | { kind: "loading" }
  | { kind: "text"; content: string }
  | { kind: "image"; url: string; mimeType: string }
  | { kind: "unsupported"; mimeType: string }
  | { kind: "error"; message: string }

export type StudioViewMode = "apps" | "drawable" | "appfilter" | "browse"

export interface StructureCheckItem {
  relativePath: string
  kind: "file" | "directory"
  required: boolean
  exists: boolean
}

export interface DrawableEntry {
  fileName: string
  drawableName: string
}

export interface AppMapping {
  packageName: string
  activityName: string
  componentRaw: string
}

export interface AppMappingDraft {
  id: string
  packageName: string
  activityName: string
}

export interface AppDetailDraft {
  drawableName: string
  fileName: string
  mappings: AppMappingDraft[]
  categories: string
  notes: string
  isDirty: boolean
}

export interface StructureScanState {
  status: "idle" | "scanning" | "done" | "error"
  requiredChecks: StructureCheckItem[]
  optionalChecks: StructureCheckItem[]
  drawablePngCount: number
  drawableEntries: DrawableEntry[]
  appMappingsByDrawable: Record<string, AppMapping[]>
  categoriesByDrawable: Record<string, string[]>
  errorMessage?: string
}

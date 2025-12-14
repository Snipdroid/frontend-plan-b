export interface ParsedAppEntry {
  packageName: string
  mainActivity: string
  drawableName: string
  iconBlob?: Blob
  iconUrl?: string
  sourceFile: string // Which ZIP file this entry came from
}

export interface UploadedFile {
  id: string
  file: File
  name: string
  size: number
}

import JSZip from "jszip"
import type { ParsedAppEntry } from "@/types/upload"

interface AppFilterEntry {
  packageName: string
  mainActivity: string
  drawableName: string
}

/**
 * Parse appfilter.xml content to extract component info and drawable names
 * Format: <item component="ComponentInfo{packageName/mainActivity}" drawable="drawableName"/>
 */
export function parseAppFilterXml(xmlContent: string): AppFilterEntry[] {
  const entries: AppFilterEntry[] = []
  const regex =
    /component\s*=\s*"ComponentInfo\{([^/]+)\/([^}]+)\}"\s+drawable\s*=\s*"([^"]+)"/g

  let match
  while ((match = regex.exec(xmlContent)) !== null) {
    entries.push({
      packageName: match[1],
      mainActivity: match[2],
      drawableName: match[3],
    })
  }

  return entries
}

/**
 * Parse a ZIP file and extract app entries with their icons
 */
export async function parseZipFile(file: File): Promise<ParsedAppEntry[]> {
  const zip = await JSZip.loadAsync(file)
  const entries: ParsedAppEntry[] = []
  const pngFiles = new Map<string, Blob>()

  // First, collect all PNG files
  for (const [path, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue

    const lowerPath = path.toLowerCase()
    if (lowerPath.endsWith(".png")) {
      const blob = await zipEntry.async("blob")
      // Extract filename without extension and path
      const fileName = path.split("/").pop()?.replace(/\.png$/i, "") ?? ""
      pngFiles.set(fileName.toLowerCase(), blob)
    }
  }

  // Then, parse all appfilter*.xml files
  for (const [path, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue

    const fileName = path.split("/").pop()?.toLowerCase() ?? ""
    if (fileName.startsWith("appfilter") && fileName.endsWith(".xml")) {
      const xmlContent = await zipEntry.async("string")
      const appFilterEntries = parseAppFilterXml(xmlContent)

      for (const entry of appFilterEntries) {
        const iconBlob = pngFiles.get(entry.drawableName.toLowerCase())
        const iconUrl = iconBlob ? URL.createObjectURL(iconBlob) : undefined

        entries.push({
          packageName: entry.packageName,
          mainActivity: entry.mainActivity,
          drawableName: entry.drawableName,
          iconBlob,
          iconUrl,
          sourceFile: file.name,
        })
      }
    }
  }

  return entries
}

/**
 * Parse multiple ZIP files and merge the results
 */
export async function parseMultipleZipFiles(
  files: File[]
): Promise<ParsedAppEntry[]> {
  const allEntries: ParsedAppEntry[] = []

  for (const file of files) {
    const entries = await parseZipFile(file)
    allEntries.push(...entries)
  }

  return allEntries
}

/**
 * Clean up object URLs to prevent memory leaks
 */
export function revokeEntryUrls(entries: ParsedAppEntry[]): void {
  for (const entry of entries) {
    if (entry.iconUrl) {
      URL.revokeObjectURL(entry.iconUrl)
    }
  }
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

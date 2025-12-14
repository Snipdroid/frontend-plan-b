import { useState, useCallback, useEffect, useRef } from "react"
import { useAuth } from "react-oidc-context"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { FileDropZone } from "@/components/upload/FileDropZone"
import { FileList } from "@/components/upload/FileList"
import { AppPreviewList } from "@/components/upload/AppPreviewList"
import {
  parseMultipleZipFiles,
  revokeEntryUrls,
} from "@/lib/appfilter-parser"
import { getIconPacks, getIconPackVersions } from "@/services/icon-pack"
import type { ParsedAppEntry, UploadedFile } from "@/types/upload"
import type { IconPackDTO, IconPackVersionDTO } from "@/types/icon-pack"

export function UploadPage() {
  const auth = useAuth()
  const isAuthenticated = auth.isAuthenticated

  const [files, setFiles] = useState<UploadedFile[]>([])
  const [entries, setEntries] = useState<ParsedAppEntry[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const entriesRef = useRef<ParsedAppEntry[]>([])

  // Icon pack selection (for authenticated users)
  const [iconPacks, setIconPacks] = useState<IconPackDTO[]>([])
  const [selectedPackId, setSelectedPackId] = useState<string>("")
  const [versions, setVersions] = useState<IconPackVersionDTO[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<string>("")
  const [isLoadingPacks, setIsLoadingPacks] = useState(false)
  const [isLoadingVersions, setIsLoadingVersions] = useState(false)

  // Keep entriesRef in sync
  useEffect(() => {
    entriesRef.current = entries
  }, [entries])

  // Fetch icon packs when authenticated
  useEffect(() => {
    if (isAuthenticated && auth.user?.access_token) {
      setIsLoadingPacks(true)
      getIconPacks(auth.user.access_token)
        .then(setIconPacks)
        .catch(console.error)
        .finally(() => setIsLoadingPacks(false))
    }
  }, [isAuthenticated, auth.user?.access_token])

  // Fetch versions when icon pack is selected
  useEffect(() => {
    if (selectedPackId && auth.user?.access_token) {
      setIsLoadingVersions(true)
      setSelectedVersionId("")
      getIconPackVersions(auth.user.access_token, selectedPackId)
        .then((response) => setVersions(response.items))
        .catch(console.error)
        .finally(() => setIsLoadingVersions(false))
    } else {
      setVersions([])
      setSelectedVersionId("")
    }
  }, [selectedPackId, auth.user?.access_token])

  // Parse files automatically when files change
  useEffect(() => {
    if (files.length === 0) {
      revokeEntryUrls(entriesRef.current)
      setEntries([])
      setParseError(null)
      return
    }

    const parseFiles = async () => {
      setIsParsing(true)
      setParseError(null)
      revokeEntryUrls(entriesRef.current)

      try {
        const rawFiles = files.map((f) => f.file)
        const parsedEntries = await parseMultipleZipFiles(rawFiles)
        setEntries(parsedEntries)
      } catch (err) {
        setParseError(err instanceof Error ? err.message : "Failed to parse files")
        setEntries([])
      } finally {
        setIsParsing(false)
      }
    }

    parseFiles()
  }, [files])

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
    }))
    setFiles((prev) => [...prev, ...uploadedFiles])
  }, [])

  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const handleClearAll = useCallback(() => {
    setFiles([])
  }, [])

  const handleSubmit = useCallback(() => {
    // TODO: Implement network upload
    console.log("Submit:", {
      entries,
      selectedPackId,
      selectedVersionId,
    })
  }, [entries, selectedPackId, selectedVersionId])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      revokeEntryUrls(entriesRef.current)
    }
  }, [])

  const canSubmit = entries.length > 0

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Upload App Information
          </h1>
          <p className="text-muted-foreground mt-2">
            Upload ZIP files containing appfilter.xml and icon PNGs to add app
            information to the database.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Files</CardTitle>
            <CardDescription>
              Upload ZIP files containing appfilter.xml files and PNG icons.
              Multiple files can be uploaded at once.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileDropZone
              onFilesAdded={handleFilesAdded}
              disabled={isParsing}
            />
            <FileList
              files={files}
              onRemove={handleRemoveFile}
              onClearAll={handleClearAll}
            />
            {isParsing && (
              <p className="text-sm text-muted-foreground">Parsing files...</p>
            )}
            {parseError && (
              <p className="text-sm text-destructive">{parseError}</p>
            )}
          </CardContent>
        </Card>

        {entries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                Review the parsed app entries before submitting.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AppPreviewList entries={entries} />
            </CardContent>
          </Card>
        )}

        {isAuthenticated && (
          <Card>
            <CardHeader>
              <CardTitle>Icon Pack Selection (Optional)</CardTitle>
              <CardDescription>
                Optionally associate these app entries with one of your icon
                packs. If not selected, the entries will be added to the
                database without an icon pack association.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="icon-pack">Icon Pack</Label>
                  <Select
                    value={selectedPackId}
                    onValueChange={setSelectedPackId}
                    disabled={isLoadingPacks}
                  >
                    <SelectTrigger id="icon-pack">
                      <SelectValue
                        placeholder={
                          isLoadingPacks ? "Loading..." : "Select icon pack"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {iconPacks.map((pack) => (
                        <SelectItem key={pack.id} value={pack.id ?? ""}>
                          {pack.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Select
                    value={selectedVersionId}
                    onValueChange={setSelectedVersionId}
                    disabled={!selectedPackId || isLoadingVersions}
                  >
                    <SelectTrigger id="version">
                      <SelectValue
                        placeholder={
                          isLoadingVersions
                            ? "Loading..."
                            : selectedPackId
                              ? "Select version"
                              : "Select icon pack first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {versions.map((version) => (
                        <SelectItem key={version.id} value={version.id ?? ""}>
                          {version.versionString}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  )
}

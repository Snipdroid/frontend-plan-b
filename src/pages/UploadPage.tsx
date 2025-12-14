import { useState, useCallback, useEffect, useRef } from "react"
import { useAuth } from "react-oidc-context"
import { useIsMobile } from "@/hooks/use-mobile"
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
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { FileDropZone } from "@/components/upload/FileDropZone"
import { FileList } from "@/components/upload/FileList"
import { AppPreviewList } from "@/components/upload/AppPreviewList"
import { UploadSidebar } from "@/components/upload/UploadSidebar"
import { SelectedFilesCard } from "@/components/upload/SelectedFilesCard"
import {
  parseMultipleZipFiles,
  revokeEntryUrls,
} from "@/lib/appfilter-parser"
import {
  getIconPacks,
  getIconPackVersions,
  createVersionAccessToken,
} from "@/services/icon-pack"
import {
  createAppInfo,
  getIconUploadUrl,
  uploadIconToS3,
} from "@/services/app-info"
import type { ParsedAppEntry, UploadedFile } from "@/types/upload"
import type { IconPackDTO, IconPackVersionDTO } from "@/types/icon-pack"
import type { AppInfoCreateSingleRequest } from "@/types/app-info"

export function UploadPage() {
  const auth = useAuth()
  const isAuthenticated = auth.isAuthenticated
  const isMobile = useIsMobile()

  const [files, setFiles] = useState<UploadedFile[]>([])
  const [entries, setEntries] = useState<ParsedAppEntry[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const entriesRef = useRef<ParsedAppEntry[]>([])

  // Upload state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
  const [uploadStatus, setUploadStatus] = useState<string>("")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

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

  const handlePackClear = useCallback(() => {
    setSelectedPackId("")
  }, [])

  const handleVersionClear = useCallback(() => {
    setSelectedVersionId("")
  }, [])

  const handleSubmit = useCallback(async () => {
    if (entries.length === 0) return

    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)
    setUploadProgress({ current: 0, total: entries.length })

    try {
      // Step 1: Generate temporary token if icon pack is selected
      let accessToken: string | undefined
      if (selectedPackId && selectedVersionId && auth.user?.access_token) {
        setUploadStatus("Generating access token...")
        const tokenValiditySeconds = entries.length * 20
        const expireAt = new Date(Date.now() + tokenValiditySeconds * 1000).toISOString()
        const tokenResponse = await createVersionAccessToken(
          auth.user.access_token,
          selectedPackId,
          selectedVersionId,
          expireAt
        )
        accessToken = tokenResponse.token
      }

      // Step 2: Create app info entries
      setUploadStatus("Creating app entries...")
      const appInfoRequests: AppInfoCreateSingleRequest[] = entries.map((entry) => ({
        packageName: entry.packageName,
        mainActivity: entry.mainActivity,
        defaultName: entry.drawableName,
        localizedName: entry.drawableName,
        languageCode: "--",
      }))

      await createAppInfo(appInfoRequests, accessToken)

      // Step 3: Upload icons
      const entriesWithIcons = entries.filter((entry) => entry.iconBlob)
      for (let i = 0; i < entriesWithIcons.length; i++) {
        const entry = entriesWithIcons[i]
        setUploadProgress({ current: i + 1, total: entriesWithIcons.length })
        setUploadStatus(`Uploading icon ${i + 1} of ${entriesWithIcons.length}...`)

        try {
          const { uploadURL } = await getIconUploadUrl(entry.packageName)
          await uploadIconToS3(uploadURL, entry.iconBlob!)
        } catch (err) {
          console.error(`Failed to upload icon for ${entry.packageName}:`, err)
          // Continue with other icons even if one fails
        }
      }

      setSubmitSuccess(true)
      setUploadStatus("Upload complete!")
      // Clear files after successful upload
      setFiles([])
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Upload failed")
      setUploadStatus("")
    } finally {
      setIsSubmitting(false)
    }
  }, [entries, selectedPackId, selectedVersionId, auth.user?.access_token])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      revokeEntryUrls(entriesRef.current)
    }
  }, [])

  const canSubmit = entries.length > 0 && !isSubmitting

  const progressPercent = uploadProgress.total > 0
    ? (uploadProgress.current / uploadProgress.total) * 100
    : 0

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
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

        {isMobile ? (
          // Mobile Layout
          <>
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
                {isParsing && (
                  <p className="text-sm text-muted-foreground">Parsing files...</p>
                )}
                {parseError && (
                  <p className="text-sm text-destructive">{parseError}</p>
                )}
              </CardContent>
            </Card>

            <SelectedFilesCard
              files={files}
              onRemoveFile={handleRemoveFile}
              onClearAll={handleClearAll}
            />

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
                      <div className="flex items-center justify-between">
                        <Label htmlFor="icon-pack">Icon Pack</Label>
                        {selectedPackId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handlePackClear}
                            className="h-auto py-0 px-2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
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
                      <div className="flex items-center justify-between">
                        <Label htmlFor="version">Version</Label>
                        {selectedVersionId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleVersionClear}
                            className="h-auto py-0 px-2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
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

            {entries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    Review the parsed app entries before submitting.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <AppPreviewList entries={entries} />
                </CardContent>
              </Card>
            )}

            {isSubmitting && (
              <Card>
                <CardHeader>
                  <CardTitle>Uploading...</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={progressPercent} />
                  <p className="text-sm text-muted-foreground">{uploadStatus}</p>
                </CardContent>
              </Card>
            )}

            {submitSuccess && !isSubmitting && (
              <Card className="border-green-500">
                <CardContent className="pt-6">
                  <p className="text-sm text-green-600">
                    Successfully uploaded {entries.length} app entries!
                  </p>
                </CardContent>
              </Card>
            )}

            {submitError && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <p className="text-sm text-destructive">{submitError}</p>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {isSubmitting ? "Uploading..." : "Submit"}
              </Button>
            </div>
          </>
        ) : (
          // Desktop Layout
          <div className="flex gap-6 lg:gap-8">
            {/* Main content area */}
            <div className="flex-1 min-w-0 space-y-6">
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
                  <CardContent className="overflow-x-auto">
                    <AppPreviewList entries={entries} />
                  </CardContent>
                </Card>
              )}

              {isSubmitting && (
                <Card>
                  <CardHeader>
                    <CardTitle>Uploading...</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={progressPercent} />
                    <p className="text-sm text-muted-foreground">{uploadStatus}</p>
                  </CardContent>
                </Card>
              )}

              {submitSuccess && !isSubmitting && (
                <Card className="border-green-500">
                  <CardContent className="pt-6">
                    <p className="text-sm text-green-600">
                      Successfully uploaded {entries.length} app entries!
                    </p>
                  </CardContent>
                </Card>
              )}

              {submitError && (
                <Card className="border-destructive">
                  <CardContent className="pt-6">
                    <p className="text-sm text-destructive">{submitError}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right sidebar */}
            <div className="w-80 shrink-0">
              <div className="sticky top-24">
                <UploadSidebar
                  fileList={{
                    files,
                    onRemoveFile: handleRemoveFile,
                    onClearAllFiles: handleClearAll,
                  }}
                  iconPackSelection={
                    isAuthenticated
                      ? {
                          iconPacks,
                          selectedPackId,
                          onPackChange: setSelectedPackId,
                          onPackClear: handlePackClear,
                          isLoadingPacks,
                          versions,
                          selectedVersionId,
                          onVersionChange: setSelectedVersionId,
                          onVersionClear: handleVersionClear,
                          isLoadingVersions,
                        }
                      : undefined
                  }
                  canSubmit={canSubmit}
                  isSubmitting={isSubmitting}
                  onSubmit={handleSubmit}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

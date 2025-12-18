import { useState, useCallback, useEffect, useRef } from "react"
import { useAuth } from "react-oidc-context"
import { useTranslation } from "react-i18next"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { FileDropZone } from "@/components/upload/FileDropZone"
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

const BATCH_SIZE = 25

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export function UploadPage() {
  const auth = useAuth()
  const { t } = useTranslation()
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
  const [uploadedCount, setUploadedCount] = useState(0)

  // Upload icons checkbox
  const [uploadIcons, setUploadIcons] = useState(true)

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

    try {
      // Step 1: Generate temporary token if icon pack is selected
      let accessToken: string | undefined
      if (selectedPackId && selectedVersionId && auth.user?.access_token) {
        setUploadStatus("Generating access token...")
        const tokenValiditySeconds = Math.max(entries.length * 20, 300)
        const expireAt = new Date(Date.now() + tokenValiditySeconds * 1000).toISOString()
        const tokenResponse = await createVersionAccessToken(
          auth.user.access_token,
          selectedPackId,
          selectedVersionId,
          expireAt
        )
        accessToken = tokenResponse.token
      }

      // Step 2: Create app info entries in batches
      const appInfoRequests: AppInfoCreateSingleRequest[] = entries.map((entry) => ({
        packageName: entry.packageName,
        mainActivity: entry.mainActivity,
        defaultName: entry.drawableName,
        localizedName: entry.drawableName,
        languageCode: "--",
      }))

      const batches = chunkArray(appInfoRequests, BATCH_SIZE)
      const entriesWithIcons = entries.filter((entry) => entry.iconBlob)
      const totalSteps = batches.length + (uploadIcons ? entriesWithIcons.length : 0)

      setUploadProgress({ current: 0, total: totalSteps })

      for (let i = 0; i < batches.length; i++) {
        setUploadStatus(`Creating app entries (batch ${i + 1}/${batches.length})...`)
        await createAppInfo(batches[i], accessToken)
        setUploadProgress({ current: i + 1, total: totalSteps })
      }

      // Step 3: Upload icons (only if checkbox is checked)
      if (uploadIcons) {
        for (let i = 0; i < entriesWithIcons.length; i++) {
          const entry = entriesWithIcons[i]
          setUploadProgress({ current: batches.length + i + 1, total: totalSteps })
          setUploadStatus(`Uploading icon ${i + 1} of ${entriesWithIcons.length}...`)

          try {
            const { uploadURL } = await getIconUploadUrl(entry.packageName)
            await uploadIconToS3(uploadURL, entry.iconBlob!)
          } catch (err) {
            console.error(`Failed to upload icon for ${entry.packageName}:`, err)
            // Continue with other icons even if one fails
          }
        }
      }

      setUploadedCount(entries.length)
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
  }, [entries, selectedPackId, selectedVersionId, auth.user?.access_token, uploadIcons])

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
            {t("upload.title")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t("upload.subtitle")}
          </p>
        </div>

        {isMobile ? (
          // Mobile Layout
          <>
            <Card>
              <CardHeader>
                <CardTitle>{t("upload.selectFiles")}</CardTitle>
                <CardDescription>
                  {t("upload.selectFilesDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileDropZone
                  onFilesAdded={handleFilesAdded}
                  disabled={isParsing}
                />
                {isParsing && (
                  <p className="text-sm text-muted-foreground">{t("upload.parsing")}</p>
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

            {files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("upload.uploadIcons")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 cursor-pointer has-[[aria-checked=true]]:border-primary has-[[aria-checked=true]]:bg-accent">
                    <Checkbox
                      id="upload-icons-mobile"
                      checked={uploadIcons}
                      onCheckedChange={(checked) => setUploadIcons(checked as boolean)}
                    />
                    <div className="grid gap-1.5 font-normal">
                      <p className="text-sm leading-none font-medium">
                        {t("upload.uploadIcons")}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {t("upload.uploadIconsDesc")}
                      </p>
                    </div>
                  </Label>
                </CardContent>
              </Card>
            )}

            {isAuthenticated && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("upload.iconPackSelection")}</CardTitle>
                  <CardDescription>
                    {t("upload.iconPackSelectionDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="icon-pack">{t("upload.iconPack")}</Label>
                        {selectedPackId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handlePackClear}
                            className="h-auto py-0 px-2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            {t("common.clear")}
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
                              isLoadingPacks ? t("common.loading") : t("upload.selectIconPack")
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
                        <Label htmlFor="version">{t("upload.version")}</Label>
                        {selectedVersionId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleVersionClear}
                            className="h-auto py-0 px-2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            {t("common.clear")}
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
                                ? t("common.loading")
                                : selectedPackId
                                  ? t("upload.selectVersion")
                                  : t("upload.selectIconPackFirst")
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
                  <CardTitle>{t("upload.preview")}</CardTitle>
                  <CardDescription>
                    {t("upload.previewDesc")}
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
                  <CardTitle>{t("upload.uploading")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={progressPercent} />
                  <p className="text-sm text-muted-foreground">{uploadStatus}</p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full"
              >
                {isSubmitting ? t("upload.uploading") : t("common.submit")}
              </Button>

              {/* Success/Error Messages */}
              {submitSuccess && !isSubmitting && (
                <p className="text-sm text-green-600 text-center">
                  {t("upload.successMessage", { count: uploadedCount })}
                </p>
              )}
              {submitError && (
                <p className="text-sm text-destructive text-center">{submitError}</p>
              )}
            </div>
          </>
        ) : (
          // Desktop Layout
          <div className="flex gap-6 lg:gap-8">
            {/* Main content area */}
            <div className="flex-1 min-w-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("upload.selectFiles")}</CardTitle>
                  <CardDescription>
                    {t("upload.selectFilesDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FileDropZone
                    onFilesAdded={handleFilesAdded}
                    disabled={isParsing}
                  />
                  {isParsing && (
                    <p className="text-sm text-muted-foreground">{t("upload.parsing")}</p>
                  )}
                  {parseError && (
                    <p className="text-sm text-destructive">{parseError}</p>
                  )}
                </CardContent>
              </Card>

              {entries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("upload.preview")}</CardTitle>
                    <CardDescription>
                      {t("upload.previewDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <AppPreviewList entries={entries} />
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
                  uploadProgress={uploadProgress}
                  uploadStatus={uploadStatus}
                  submitSuccess={submitSuccess}
                  submitError={submitError}
                  uploadedCount={uploadedCount}
                  uploadIcons={uploadIcons}
                  onUploadIconsChange={setUploadIcons}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

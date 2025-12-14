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
import { FileList } from "@/components/upload/FileList"
import type { UploadedFile } from "@/types/upload"
import type { IconPackDTO, IconPackVersionDTO } from "@/types/icon-pack"

interface FileListSection {
  files: UploadedFile[]
  onRemoveFile: (id: string) => void
  onClearAllFiles: () => void
}

interface IconPackSelection {
  iconPacks: IconPackDTO[]
  selectedPackId: string
  onPackChange: (value: string) => void
  onPackClear: () => void
  isLoadingPacks: boolean

  versions: IconPackVersionDTO[]
  selectedVersionId: string
  onVersionChange: (value: string) => void
  onVersionClear: () => void
  isLoadingVersions: boolean
}

interface UploadSidebarProps {
  fileList: FileListSection
  iconPackSelection?: IconPackSelection
  canSubmit: boolean
  isSubmitting: boolean
  onSubmit: () => void
  uploadProgress: { current: number; total: number }
  uploadStatus: string
  submitSuccess: boolean
  submitError: string | null
  uploadedCount: number
}

export function UploadSidebar({
  fileList,
  iconPackSelection,
  canSubmit,
  isSubmitting,
  onSubmit,
  uploadProgress,
  uploadStatus,
  submitSuccess,
  submitError,
  uploadedCount,
}: UploadSidebarProps) {
  const progressPercent =
    uploadProgress.total > 0
      ? (uploadProgress.current / uploadProgress.total) * 100
      : 0
  return (
    <Card className="max-h-[calc(100vh-8rem)] overflow-y-auto">
      <CardHeader>
        <CardTitle>Upload Details</CardTitle>
        <CardDescription>
          {iconPackSelection
            ? "Selected files and icon pack association"
            : "Selected files for upload"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Files Section */}
        <FileList
          files={fileList.files}
          onRemove={fileList.onRemoveFile}
          onClearAll={fileList.onClearAllFiles}
        />

        {/* Icon Pack Section - only when authenticated */}
        {iconPackSelection && (
          <>
            <Separator />
            <div className="space-y-4">

              {/* Icon Pack Select */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sidebar-icon-pack">Icon Pack (optional)</Label>
                  {iconPackSelection.selectedPackId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={iconPackSelection.onPackClear}
                      className="h-auto py-0 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <Select
                  value={iconPackSelection.selectedPackId}
                  onValueChange={iconPackSelection.onPackChange}
                  disabled={iconPackSelection.isLoadingPacks}
                >
                  <SelectTrigger id="sidebar-icon-pack" className="w-full">
                    <SelectValue
                      placeholder={
                        iconPackSelection.isLoadingPacks
                          ? "Loading..."
                          : "Select icon pack"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {iconPackSelection.iconPacks.map((pack) => (
                      <SelectItem key={pack.id} value={pack.id ?? ""}>
                        {pack.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Version Select */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sidebar-version">Version</Label>
                  {iconPackSelection.selectedVersionId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={iconPackSelection.onVersionClear}
                      className="h-auto py-0 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <Select
                  value={iconPackSelection.selectedVersionId}
                  onValueChange={iconPackSelection.onVersionChange}
                  disabled={
                    !iconPackSelection.selectedPackId ||
                    iconPackSelection.isLoadingVersions
                  }
                >
                  <SelectTrigger id="sidebar-version" className="w-full">
                    <SelectValue
                      placeholder={
                        iconPackSelection.isLoadingVersions
                          ? "Loading..."
                          : iconPackSelection.selectedPackId
                            ? "Select version"
                            : "Select icon pack first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {iconPackSelection.versions.map((version) => (
                      <SelectItem key={version.id} value={version.id ?? ""}>
                        {version.versionString}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        {/* Upload Progress */}
        {isSubmitting && (
          <>
            <Separator />
            <div className="space-y-2">
              <Progress value={progressPercent} />
              <p className="text-xs text-muted-foreground">{uploadStatus}</p>
            </div>
          </>
        )}

        {/* Submit Button */}
        <Separator />
        <div className="space-y-2">
          <Button
            size="lg"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="w-full"
          >
            {isSubmitting ? "Uploading..." : "Submit"}
          </Button>

          {/* Success/Error Messages */}
          {submitSuccess && !isSubmitting && (
            <p className="text-sm text-green-600 text-center">
              Successfully uploaded {uploadedCount} app entries!
            </p>
          )}
          {submitError && (
            <p className="text-sm text-destructive text-center">{submitError}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FileList } from "@/components/upload/FileList"
import type { UploadedFile } from "@/types/upload"

interface SelectedFilesCardProps {
  files: UploadedFile[]
  onRemoveFile: (id: string) => void
  onClearAll: () => void
}

export function SelectedFilesCard({
  files,
  onRemoveFile,
  onClearAll,
}: SelectedFilesCardProps) {
  if (files.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selected Files</CardTitle>
        <CardDescription>
          {files.length} file{files.length !== 1 ? "s" : ""} ready for upload
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FileList files={files} onRemove={onRemoveFile} onClearAll={onClearAll} />
      </CardContent>
    </Card>
  )
}

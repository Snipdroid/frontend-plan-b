import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FileList } from "@/components/upload/FileList"
import { useTranslation } from "react-i18next"
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
  const { t } = useTranslation()

  if (files.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("upload.selectedFiles")}</CardTitle>
        <CardDescription>
          {t("upload.filesReadyForUpload", { count: files.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FileList files={files} onRemove={onRemoveFile} onClearAll={onClearAll} />
      </CardContent>
    </Card>
  )
}

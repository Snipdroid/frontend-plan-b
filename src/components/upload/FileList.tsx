import { Button } from "@/components/ui/button"
import { formatFileSize } from "@/lib/appfilter-parser"
import { useTranslation } from "react-i18next"
import type { UploadedFile } from "@/types/upload"
import { FileArchive, X } from "lucide-react"

interface FileListProps {
  files: UploadedFile[]
  onRemove: (id: string) => void
  onClearAll: () => void
}

export function FileList({ files, onRemove, onClearAll }: FileListProps) {
  const { t } = useTranslation()

  if (files.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {t("upload.filesSelected", { count: files.length })}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-muted-foreground hover:text-foreground"
        >
          {t("upload.clearAll")}
        </Button>
      </div>
      <div className="space-y-1">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileArchive className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm">{file.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                ({formatFileSize(file.size)})
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => onRemove(file.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

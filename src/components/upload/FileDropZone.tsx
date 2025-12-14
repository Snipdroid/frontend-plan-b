import { useCallback, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Upload } from "lucide-react"

interface FileDropZoneProps {
  onFilesAdded: (files: File[]) => void
  accept?: string
  disabled?: boolean
  className?: string
}

export function FileDropZone({
  onFilesAdded,
  accept = ".zip",
  disabled = false,
  className,
}: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) {
        setIsDragOver(true)
      }
    },
    [disabled]
  )

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      if (disabled) return

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.name.toLowerCase().endsWith(".zip")
      )

      if (files.length > 0) {
        onFilesAdded(files)
      }
    },
    [disabled, onFilesAdded]
  )

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }, [disabled])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      if (files.length > 0) {
        onFilesAdded(files)
      }
      // Reset input so the same file can be selected again
      e.target.value = ""
    },
    [onFilesAdded]
  )

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 transition-colors",
        isDragOver
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer",
        className
      )}
    >
      <Upload className="h-10 w-10 text-muted-foreground" />
      <div className="text-center">
        <p className="text-sm font-medium">
          Drag and drop ZIP files here
        </p>
        <p className="text-sm text-muted-foreground">
          or click to select files
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  )
}

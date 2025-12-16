import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CustomTemplateDialog } from "./CustomTemplateDialog"
import { getBestDrawableName } from "@/lib/drawable"
import type { AppInfo } from "@/types"

interface ExportButtonGroupProps {
  apps: AppInfo[]
  disabled?: boolean
  onCopy: () => void
}

export function ExportButtonGroup({
  apps,
  disabled,
  onCopy,
}: ExportButtonGroupProps) {
  const [customDialogOpen, setCustomDialogOpen] = useState(false)

  const handleCopyAppfilter = async () => {
    const text = apps
      .map((app) => {
        const drawable = getBestDrawableName(app)
        return `<item component="ComponentInfo{${app.packageName}/${app.mainActivity}}" drawable="${drawable}"/>`
      })
      .join("\n")

    try {
      await navigator.clipboard.writeText(text)
      toast.success("Appfilter copied to clipboard")
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  }

  const handleCopyDrawable = async () => {
    const text = apps
      .map((app) => {
        const drawable = getBestDrawableName(app)
        return `<item drawable="${drawable}" />`
      })
      .join("\n")

    try {
      await navigator.clipboard.writeText(text)
      toast.success("Drawable copied to clipboard")
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  }

  const handleCopy = async () => {
    onCopy()
    toast.success("Copied to clipboard")
  }

  return (
    <>
      <div className="inline-flex">
        <Button
          variant="outline"
          size="sm"
          className="rounded-r-none border-r-0"
          disabled={disabled}
          onClick={handleCopyAppfilter}
        >
          Appfilter
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-none border-r-0"
          disabled={disabled}
          onClick={handleCopyDrawable}
        >
          Drawable
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="rounded-l-none"
              disabled={disabled}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={handleCopy}>
              Plain Text
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                setCustomDialogOpen(true)
              }}
            >
              Custom
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CustomTemplateDialog
        open={customDialogOpen}
        onOpenChange={setCustomDialogOpen}
        apps={apps}
      />
    </>
  )
}

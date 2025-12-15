import { useState } from "react"
import { ChevronDown, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CustomTemplateDialog } from "./CustomTemplateDialog"
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

  return (
    <>
      <div className="inline-flex">
        <Button
          variant="outline"
          size="sm"
          className="rounded-r-none border-r-0"
          disabled={disabled}
        >
          Appfilter
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-none border-r-0"
          disabled={disabled}
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
            <DropdownMenuItem onSelect={onCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
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

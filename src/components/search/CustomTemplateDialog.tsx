import { useState, useCallback, useEffect, useRef } from "react"
import { Copy, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { renderLeafTemplate } from "@/services/render"
import type { AppInfo } from "@/types"

const DEFAULT_TEMPLATE = `#for(app in apps):
ComponentInfo(#(app.packageName)/#(app.mainActivity))
#endfor`

interface CustomTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  apps: AppInfo[]
}

export function CustomTemplateDialog({
  open,
  onOpenChange,
  apps,
}: CustomTemplateDialogProps) {
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE)
  const [preview, setPreview] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<NodeJS.Timeout>(undefined)

  // Debounced auto-render
  useEffect(() => {
    if (!open || !template.trim() || apps.length === 0) {
      return
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    setIsLoading(true)

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await renderLeafTemplate(template, apps)
        setPreview(response.text)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to render template")
      } finally {
        setIsLoading(false)
      }
    }, 500)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [template, apps, open])

  const handleCopy = useCallback(async () => {
    if (!preview) return
    try {
      await navigator.clipboard.writeText(preview)
    } catch {
      // Clipboard API failed, ignore
    }
  }, [preview])

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setPreview("")
        setError(null)
      }
      onOpenChange(newOpen)
    },
    [onOpenChange]
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Custom Template</DialogTitle>
          <DialogDescription>
            Write a Leaf template to render your selected apps. Use{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              #for(app in apps):
            </code>{" "}
            to iterate.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[300px]">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Template</label>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="flex-1 min-h-[200px] p-3 font-mono text-sm border rounded-md resize-none bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter your Leaf template..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Preview</label>
            <div className="flex-1 min-h-[200px] p-3 font-mono text-sm border rounded-md bg-muted/50 overflow-auto whitespace-pre-wrap">
              {error ? (
                <span className="text-destructive">{error}</span>
              ) : isLoading ? (
                <span className="text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Rendering...
                </span>
              ) : preview ? (
                preview
              ) : (
                <span className="text-muted-foreground">
                  Start typing to see preview
                </span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="text-sm text-muted-foreground mr-auto">
            {apps.length} app{apps.length !== 1 ? "s" : ""} selected
          </div>
          <Button onClick={handleCopy} disabled={!preview || isLoading}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

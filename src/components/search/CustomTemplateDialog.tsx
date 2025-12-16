import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { Copy, Loader2 } from "lucide-react"
import Editor, { type OnMount } from "@monaco-editor/react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useTheme } from "@/components/theme-provider"
import { renderLeafTemplate } from "@/services/render"
import { registerLeafLanguage, leafLanguageId } from "@/lib/leaf-language"
import type { AppInfo } from "@/types"

const DEFAULT_TEMPLATE = `#for(app in apps):
  #for(name in app.localizedNames):
    #if(name.languageCode == "--"):
      <item component="ComponentInfo{#(app.packageName)/#(app.mainActivity)}" drawable="#(name.autoDrawable)"/>
    #endif
  #endfor
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
  const [trimWhitespace, setTrimWhitespace] = useState(true)
  const [removeEmptyLines, setRemoveEmptyLines] = useState(true)
  const debounceRef = useRef<NodeJS.Timeout>(undefined)
  const { theme } = useTheme()

  // Process preview with options
  const processedPreview = useMemo(() => {
    if (!preview) return ""
    let result = preview
    if (trimWhitespace) {
      result = result
        .split("\n")
        .map((line) => line.trim())
        .join("\n")
    }
    if (removeEmptyLines) {
      result = result
        .split("\n")
        .filter((line) => line.trim() !== "")
        .join("\n")
    }
    return result
  }, [preview, trimWhitespace, removeEmptyLines])

  // Resolve "system" theme to actual theme
  const resolvedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme
  const monacoTheme = resolvedTheme === "dark" ? "vs-dark" : "light"

  const handleEditorMount: OnMount = useCallback((_editor, monaco) => {
    registerLeafLanguage(monaco)
  }, [])

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
    if (!processedPreview) return
    try {
      await navigator.clipboard.writeText(processedPreview)
    } catch {
      // Clipboard API failed, ignore
    }
  }, [processedPreview])

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
      <DialogContent className="sm:max-w-3xl md:max-w-5xl lg:max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Custom Template</DialogTitle>
          <DialogDescription>
            Write a{" "}
            <a
              href="https://docs.vapor.codes/leaf/overview/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Leaf template
            </a>{" "}
            to render your selected apps. Use{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              #for(app in apps):
            </code>{" "}
            to iterate.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          <div className="flex flex-col gap-2 h-1/2">
            <label className="text-sm font-medium">Template</label>
            <div className="flex-1 border rounded-md overflow-hidden">
              <Editor
                height="100%"
                language={leafLanguageId}
                value={template}
                onChange={(value) => setTemplate(value ?? "")}
                onMount={handleEditorMount}
                theme={monacoTheme}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: "off",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  automaticLayout: true,
                  tabSize: 2,
                  padding: { top: 12, bottom: 12 },
                }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 h-1/2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Preview</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={trimWhitespace}
                    onCheckedChange={(checked) =>
                      setTrimWhitespace(checked === true)
                    }
                  />
                  Trim whitespace
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={removeEmptyLines}
                    onCheckedChange={(checked) =>
                      setRemoveEmptyLines(checked === true)
                    }
                  />
                  Remove empty lines
                </label>
              </div>
            </div>
            <div className="flex-1 p-3 font-mono text-sm border rounded-md bg-muted/50 overflow-auto whitespace-pre-wrap">
              {error ? (
                <span className="text-destructive">{error}</span>
              ) : isLoading ? (
                <span className="text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Rendering...
                </span>
              ) : processedPreview ? (
                processedPreview
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
          <Button onClick={handleCopy} disabled={!processedPreview || isLoading}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

import { useState } from "react"
import { useAuth } from "react-oidc-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createIconPackVersion } from "@/services/icon-pack"
import type { IconPackVersionDTO } from "@/types/icon-pack"

interface CreateVersionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  iconPackId: string
  onCreated: (version: IconPackVersionDTO) => void
}

export function CreateVersionDialog({
  open,
  onOpenChange,
  iconPackId,
  onCreated,
}: CreateVersionDialogProps) {
  const auth = useAuth()
  const [versionString, setVersionString] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!versionString.trim() || !auth.user?.access_token) return

    setIsCreating(true)
    setError(null)

    try {
      const version = await createIconPackVersion(
        auth.user.access_token,
        iconPackId,
        versionString.trim()
      )
      onCreated(version)
      onOpenChange(false)
      setVersionString("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create version")
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setVersionString("")
      setError(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Version</DialogTitle>
            <DialogDescription>
              Enter a version string for this icon pack (e.g., 1.0.0).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Version string"
              value={versionString}
              onChange={(e) => setVersionString(e.target.value)}
              disabled={isCreating}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!versionString.trim() || isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

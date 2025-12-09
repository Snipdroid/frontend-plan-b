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
import { createIconPack } from "@/services/icon-pack"
import type { IconPackDTO } from "@/types/icon-pack"

interface CreateIconPackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (iconPack: IconPackDTO) => void
}

export function CreateIconPackDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateIconPackDialogProps) {
  const auth = useAuth()
  const [name, setName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !auth.user?.access_token) return

    setIsCreating(true)
    setError(null)

    try {
      const iconPack = await createIconPack(auth.user.access_token, name.trim())
      onCreated(iconPack)
      onOpenChange(false)
      setName("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create icon pack")
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName("")
      setError(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Icon Pack</DialogTitle>
            <DialogDescription>
              Enter a name for your new icon pack.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Icon pack name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            <Button type="submit" disabled={!name.trim() || isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

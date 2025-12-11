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
import { createVersionAccessToken } from "@/services/icon-pack"

interface CreateAccessTokenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  iconPackId: string
  versionId: string
  versionString: string
}

export function CreateAccessTokenDialog({
  open,
  onOpenChange,
  iconPackId,
  versionId,
  versionString,
}: CreateAccessTokenDialogProps) {
  const auth = useAuth()
  const [days, setDays] = useState(90)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!auth.user?.access_token || days <= 0) return

    setIsCreating(true)
    setError(null)

    try {
      const expireAt = new Date()
      expireAt.setDate(expireAt.getDate() + days)

      const response = await createVersionAccessToken(
        auth.user.access_token,
        iconPackId,
        versionId,
        expireAt.toISOString()
      )
      setToken(response.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create token")
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopy = async () => {
    if (!token) return

    try {
      await navigator.clipboard.writeText(token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Failed to copy to clipboard")
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setDays(90)
      setError(null)
      setToken(null)
      setCopied(false)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {!token ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create Access Token</DialogTitle>
              <DialogDescription>
                Generate an access token for version {versionString}.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium">
                Token expires in (days)
              </label>
              <Input
                type="number"
                min={1}
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 0)}
                disabled={isCreating}
                className="mt-1.5"
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
              <Button type="submit" disabled={days <= 0 || isCreating}>
                {isCreating ? "Creating..." : "Create Token"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Access Token Created</DialogTitle>
              <DialogDescription>
                This token will only be shown once. Copy it now.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex gap-2">
                <Input
                  value={token}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopy}
                >
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Store this token securely. You can create a new token at any time.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

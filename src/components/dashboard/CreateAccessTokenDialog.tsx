import { useState } from "react"
import { useAuth } from "react-oidc-context"
import { useTranslation } from "react-i18next"
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
  const { t } = useTranslation()
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
              <DialogTitle>{t("dialogs.createToken.title")}</DialogTitle>
              <DialogDescription>
                {t("dialogs.createToken.description", { version: versionString })}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium">
                {t("dialogs.createToken.expiresIn")}
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
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={days <= 0 || isCreating}>
                {isCreating ? t("dialogs.createToken.generating") : t("dialogs.createToken.generate")}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("dialogs.createToken.tokenGenerated")}</DialogTitle>
              <DialogDescription>
                {t("dialogs.createToken.copyWarning")}
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
                  {copied ? t("dialogs.createToken.copied") : t("common.copy")}
                </Button>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {t("dialogs.createToken.storeSecurely")}
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>{t("common.close")}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

import { useState } from "react"
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

interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText: string
  onConfirm: () => Promise<void>
  isDeleting: boolean
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  onConfirm,
  isDeleting,
}: ConfirmDeleteDialogProps) {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState("")

  const isConfirmEnabled = inputValue === confirmText

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConfirmEnabled) return
    await onConfirm()
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setInputValue("")
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">
              {t("dialogs.confirmDelete.typeToConfirm", { text: confirmText })}
            </label>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isDeleting}
              className="mt-1.5"
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isDeleting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!isConfirmEnabled || isDeleting}
            >
              {isDeleting ? t("dialogs.confirmDelete.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

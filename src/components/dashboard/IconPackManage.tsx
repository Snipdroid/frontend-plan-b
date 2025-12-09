import { useState } from "react"
import { useParams, useNavigate } from "react-router"
import { useAuth } from "react-oidc-context"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { deleteIconPack } from "@/services/icon-pack"

export function IconPackManage() {
  const { packId } = useParams()
  const navigate = useNavigate()
  const auth = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!packId || !auth.user?.access_token) return
    if (!confirm("Delete this icon pack?")) return

    setIsDeleting(true)
    try {
      await deleteIconPack(auth.user.access_token, packId)
      navigate("/dashboard")
    } catch (error) {
      console.error("Failed to delete:", error)
      alert("Failed to delete icon pack")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Icon Pack Management</h2>
        <p className="text-muted-foreground">Manage icon pack: {packId}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Icon Pack Details</CardTitle>
          <CardDescription>
            View and manage this icon pack's settings and requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Icon pack management features will be available when the API is ready.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Icon Pack"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

import { useState, useEffect } from "react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { deleteIconPack, getIconPack, getIconPackVersions } from "@/services/icon-pack"
import { CreateVersionDialog } from "./CreateVersionDialog"
import { CreateAccessTokenDialog } from "./CreateAccessTokenDialog"
import type { IconPackDTO, IconPackVersionDTO } from "@/types/icon-pack"

export function IconPackManage() {
  const { packId } = useParams()
  const navigate = useNavigate()
  const auth = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [iconPack, setIconPack] = useState<IconPackDTO | null>(null)
  const [versions, setVersions] = useState<IconPackVersionDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [createVersionOpen, setCreateVersionOpen] = useState(false)
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<IconPackVersionDTO | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!packId || !auth.user?.access_token) return

      setIsLoading(true)
      setError(null)

      try {
        const [iconPackData, versionsData] = await Promise.all([
          getIconPack(auth.user.access_token, packId),
          getIconPackVersions(auth.user.access_token, packId),
        ])
        setIconPack(iconPackData)
        setVersions(versionsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load icon pack")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [packId, auth.user?.access_token])

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

  const handleVersionCreated = (version: IconPackVersionDTO) => {
    setVersions((prev) => [...prev, version])
  }

  const handleCreateToken = (version: IconPackVersionDTO) => {
    setSelectedVersion(version)
    setTokenDialogOpen(true)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Error</h2>
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {iconPack?.name || "Icon Pack Management"}
        </h2>
        <p className="text-muted-foreground">Manage icon pack: {packId}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Versions</CardTitle>
            <CardDescription>
              Manage versions and access tokens for this icon pack.
            </CardDescription>
          </div>
          <Button onClick={() => setCreateVersionOpen(true)}>
            New Version
          </Button>
        </CardHeader>
        <CardContent>
          {versions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell className="font-medium">
                      {version.versionString}
                    </TableCell>
                    <TableCell>{formatDate(version.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateToken(version)}
                      >
                        Create Access Token
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">
              No versions yet. Create one to get started.
            </p>
          )}
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

      {packId && (
        <CreateVersionDialog
          open={createVersionOpen}
          onOpenChange={setCreateVersionOpen}
          iconPackId={packId}
          onCreated={handleVersionCreated}
        />
      )}

      {packId && selectedVersion?.id && (
        <CreateAccessTokenDialog
          open={tokenDialogOpen}
          onOpenChange={setTokenDialogOpen}
          iconPackId={packId}
          versionId={selectedVersion.id}
          versionString={selectedVersion.versionString}
        />
      )}
    </div>
  )
}

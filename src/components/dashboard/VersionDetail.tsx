import { useParams } from "react-router"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function VersionDetail() {
  const { packId, versionId } = useParams()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Version Details</h2>
        <p className="text-muted-foreground">
          Manage version: {versionId}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Version Information</CardTitle>
          <CardDescription>
            Details and statistics for this version.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Version details will be available soon.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Icon Pack ID: {packId}
          </p>
          <p className="text-sm text-muted-foreground">
            Version ID: {versionId}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

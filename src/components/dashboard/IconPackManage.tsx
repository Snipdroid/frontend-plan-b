import { useParams } from "react-router"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function IconPackManage() {
  const { packId } = useParams()

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
    </div>
  )
}

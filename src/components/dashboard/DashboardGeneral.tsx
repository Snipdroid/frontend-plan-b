import { useState, useEffect } from "react"
import { useAuth } from "react-oidc-context"
import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getIconPacks } from "@/services/icon-pack"
import { getDesignerStatistics } from "@/services/designer"

export function DashboardGeneral() {
  const auth = useAuth()
  const { t } = useTranslation()
  const [iconPackCount, setIconPackCount] = useState<number | null>(null)
  const [totalRequests, setTotalRequests] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      if (!auth.user?.access_token) return

      try {
        const [packs, statistics] = await Promise.all([
          getIconPacks(auth.user.access_token),
          getDesignerStatistics(auth.user.access_token),
        ])
        setIconPackCount(packs.length)
        setTotalRequests(statistics.distinctRequestCount)
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [auth.user?.access_token])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("dashboard.overview")}</h2>
        <p className="text-muted-foreground">
          {t("dashboard.overviewDesc")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.totalIconPacks")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{iconPackCount ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground">{t("dashboard.activeIconPacks")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.totalRequests")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{totalRequests ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground">{t("dashboard.uniqueAppsRequested")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.appsSupported")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">{t("dashboard.totalAppsCovered")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.lastUpdated")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">{t("dashboard.daysAgo")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.recentActivity")}</CardTitle>
          <CardDescription>
            {t("dashboard.recentActivityDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {t("dashboard.activityNotReady")}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

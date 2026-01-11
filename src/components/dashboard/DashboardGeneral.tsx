import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useIconPacks, useDesignerStatistics, useDesignerMe } from "@/hooks"

export function DashboardGeneral() {
  const { t } = useTranslation()

  const { data: packs, isLoading: packsLoading } = useIconPacks()
  const { data: statistics, isLoading: statsLoading } = useDesignerStatistics()
  const { data: designer, isLoading: designerLoading } = useDesignerMe()

  const isLoading = packsLoading || statsLoading || designerLoading

  // Derived state - computed from SWR data
  const iconPackCount = packs?.length ?? 0
  const ownedPackCount = packs?.filter((p) => p.designer?.id === designer?.id).length ?? 0
  const collaboratedPackCount = packs?.filter((p) => p.designer?.id !== designer?.id).length ?? 0
  const totalRequests = statistics?.distinctRequestCount ?? 0

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
              <>
                <div className="text-2xl font-bold">{iconPackCount}</div>
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.ownedAndCollaborated", {
                    owned: ownedPackCount,
                    collaborated: collaboratedPackCount,
                  })}
                </p>
              </>
            )}
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
              <div className="text-2xl font-bold">{totalRequests}</div>
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

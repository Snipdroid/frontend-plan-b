import { useState } from "react"
import { useParams } from "react-router"
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { markAppsAsAdapted } from "@/services/icon-pack"
import { API_BASE_URL } from "@/services/api"
import { AppRequestsTable, type AppRequestsTableColumn } from "./AppRequestsTable"
import { AppActionDropdown } from "./AppActionDropdown"
import { DrawableNameDialog } from "./DrawableNameDialog"
import { useVersionRequests, useDesignerMe } from "@/hooks"
import type { IconPackVersionRequestRecordResponse, AppInfoDTO } from "@/types/icon-pack"

const PER_PAGE = 10

export function VersionDetail() {
  const { packId, versionId } = useParams()
  const auth = useAuth()
  const { t } = useTranslation()

  // Pagination and filter state
  const [currentPage, setCurrentPage] = useState(1)
  const [includingAdapted, setIncludingAdapted] = useState(false)

  // SWR hooks
  const {
    data: requestsData,
    isLoading,
    isValidating,
    error: requestsError,
    mutate: mutateRequests,
  } = useVersionRequests(packId, versionId, currentPage, PER_PAGE, includingAdapted)
  const { data: designer } = useDesignerMe()

  // Derived data
  const requests = requestsData?.items ?? []
  const total = requestsData?.metadata.total ?? 0
  const designerId = designer?.id

  // UI state
  const [isMarking, setIsMarking] = useState(false)
  const [drawableDialogOpen, setDrawableDialogOpen] = useState(false)
  const [pendingAdaptApp, setPendingAdaptApp] = useState<{
    appInfoId: string
    app: AppInfoDTO
  } | null>(null)

  const totalPages = Math.ceil(total / PER_PAGE)
  const error = requestsError?.message

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleFilterChange = (checked: boolean) => {
    setIncludingAdapted(checked)
    setCurrentPage(1)
  }

  const handleToggleAdapted = async (
    appInfoId: string,
    app: AppInfoDTO,
    adapted: boolean
  ) => {
    if (!packId || !auth.user?.access_token) return

    // If marking as adapted, open dialog
    if (adapted) {
      setPendingAdaptApp({ appInfoId, app })
      setDrawableDialogOpen(true)
      return
    }

    // If removing, proceed directly without drawable
    setIsMarking(true)
    try {
      await markAppsAsAdapted(
        auth.user.access_token,
        packId,
        [appInfoId],
        false,
        {}, // Empty drawables dictionary when unmarking
        {} // Empty categories when unmarking
      )
      await mutateRequests()
    } catch (err) {
      console.error(t("errors.updateAdaptedStatus"), err)
    } finally {
      setIsMarking(false)
    }
  }

  const handleDrawableNameConfirm = async (drawableName: string, categories: string[]) => {
    if (!packId || !auth.user?.access_token || !pendingAdaptApp) return

    setIsMarking(true)
    try {
      await markAppsAsAdapted(
        auth.user.access_token,
        packId,
        [pendingAdaptApp.appInfoId],
        true,
        { [pendingAdaptApp.appInfoId]: drawableName },
        { [pendingAdaptApp.appInfoId]: categories }
      )
      await mutateRequests()
      setDrawableDialogOpen(false)
      setPendingAdaptApp(null)
    } catch (err) {
      console.error(t("errors.updateAdaptedStatus"), err)
      // Keep dialog open on error
    } finally {
      setIsMarking(false)
    }
  }

  const getVisiblePages = () => {
    const pages: (number | "ellipsis")[] = []

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      if (currentPage > 3) {
        pages.push("ellipsis")
      }

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push("ellipsis")
      }

      pages.push(totalPages)
    }

    return pages
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString()
  }

  const getIconUrl = (packageName?: string) => {
    if (!packageName) return null
    return `${API_BASE_URL}/app-icon?packageName=${encodeURIComponent(packageName)}`
  }

  const columns: AppRequestsTableColumn<IconPackVersionRequestRecordResponse>[] = [
    {
      key: "appName",
      header: t("iconPack.appName"),
      width: "w-[15%]",
      render: (item: IconPackVersionRequestRecordResponse) => (
        <div className="truncate font-medium" title={item.requestRecord.appInfo?.defaultName ?? "-"}>
          {item.requestRecord.appInfo?.defaultName ?? "-"}
        </div>
      ),
      showInMobile: false,
    },
    {
      key: "packageName",
      header: t("iconPack.packageName"),
      mobileLabel: t("iconPack.packageName"),
      width: "w-[25%]",
      className: "font-mono text-sm break-all",
      render: (item: IconPackVersionRequestRecordResponse) => (
        <div className="truncate" title={item.requestRecord.appInfo?.packageName ?? "-"}>
          {item.requestRecord.appInfo?.packageName ?? "-"}
        </div>
      ),
    },
    {
      key: "mainActivity",
      header: t("iconPack.mainActivity"),
      mobileLabel: t("iconPack.mainActivity"),
      width: "w-[25%]",
      className: "font-mono text-sm break-all",
      render: (item: IconPackVersionRequestRecordResponse) => (
        <div className="truncate" title={item.requestRecord.appInfo?.mainActivity ?? "-"}>
          {item.requestRecord.appInfo?.mainActivity ?? "-"}
        </div>
      ),
    },
    {
      key: "requested",
      header: t("iconPack.requested"),
      width: "w-[100px]",
      render: (item: IconPackVersionRequestRecordResponse) => formatDate(item.requestRecord.createdAt),
      showInMobile: true,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("iconPack.versionDetail")}</h2>
        <p className="text-muted-foreground">{t("iconPack.manageVersion", { version: versionId })}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>{t("iconPack.requests")}</CardTitle>
              <CardDescription>
                {t("iconPack.requestCount", { count: total })}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-adapted"
                checked={includingAdapted}
                onCheckedChange={(checked) =>
                  handleFilterChange(checked === true)
                }
              />
              <Label htmlFor="show-adapted" className="text-sm font-normal">
                {t("iconPack.showAdaptedApps")}
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && requests.length === 0 ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <p className="text-destructive">{error}</p>
          ) : requests.length > 0 ? (
            <div className={`space-y-4 transition-opacity ${isValidating ? "opacity-50 pointer-events-none" : ""}`}>
              <AppRequestsTable
                items={requests}
                columns={columns}
                getIconUrl={(item: IconPackVersionRequestRecordResponse) =>
                  getIconUrl(item.requestRecord.appInfo?.packageName)
                }
                getAppName={(item: IconPackVersionRequestRecordResponse) =>
                  item.requestRecord.appInfo?.defaultName ?? "-"
                }
                isSystemApp={(item: IconPackVersionRequestRecordResponse) =>
                  item.requestRecord.isSystemApp ?? false
                }
                renderActions={(item: IconPackVersionRequestRecordResponse) => (
                  <AppActionDropdown
                    item={item}
                    isAdapted={!!item.iconPackApp}
                    isMarking={isMarking}
                    onToggleAdapted={(adapted) =>
                      item.requestRecord.appInfo?.id &&
                      item.requestRecord.appInfo &&
                      handleToggleAdapted(
                        item.requestRecord.appInfo.id,
                        item.requestRecord.appInfo,
                        adapted
                      )
                    }
                    disabled={!item.requestRecord.appInfo?.id}
                  />
                )}
                getItemKey={(item: IconPackVersionRequestRecordResponse) =>
                  item.requestRecord.id ?? ""
                }
              />
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(currentPage - 1)}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {getVisiblePages().map((page, index) =>
                      page === "ellipsis" ? (
                        <PaginationItem key={`ellipsis-${index}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(currentPage + 1)}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">{t("iconPack.noRequests")}</p>
          )}
        </CardContent>
      </Card>

      {pendingAdaptApp && designerId && (
        <DrawableNameDialog
          open={drawableDialogOpen}
          onOpenChange={(open) => {
            setDrawableDialogOpen(open)
            if (!open) setPendingAdaptApp(null)
          }}
          app={pendingAdaptApp.app}
          iconPackId={packId!}
          designerId={designerId}
          onConfirm={handleDrawableNameConfirm}
          isSubmitting={isMarking}
        />
      )}
    </div>
  )
}

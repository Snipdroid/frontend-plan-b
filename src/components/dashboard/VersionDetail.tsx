import { useState, useEffect } from "react"
import { useParams } from "react-router"
import { useAuth } from "react-oidc-context"
import { useTranslation } from "react-i18next"
import { Plus, Minus } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { getVersionRequests, markAppsAsAdapted } from "@/services/icon-pack"
import { API_BASE_URL } from "@/services/api"
import { AppRequestsTable, type AppRequestsTableColumn } from "./AppRequestsTable"
import type { IconPackVersionRequestRecordResponse } from "@/types/icon-pack"

const PER_PAGE = 10

export function VersionDetail() {
  const { packId, versionId } = useParams()
  const auth = useAuth()
  const { t } = useTranslation()
  const [requests, setRequests] = useState<IconPackVersionRequestRecordResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [includingAdapted, setIncludingAdapted] = useState(false)
  const [isMarking, setIsMarking] = useState(false)

  const totalPages = Math.ceil(total / PER_PAGE)

  const fetchRequests = async () => {
    if (!packId || !versionId || !auth.user?.access_token) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await getVersionRequests(
        auth.user.access_token,
        packId,
        versionId,
        currentPage,
        PER_PAGE,
        includingAdapted
      )
      setRequests(response.items)
      setTotal(response.metadata.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.loadRequests"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packId, versionId, auth.user?.access_token, currentPage, includingAdapted])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleFilterChange = (checked: boolean) => {
    setIncludingAdapted(checked)
    setCurrentPage(1)
  }

  const handleToggleAdapted = async (appInfoId: string, adapted: boolean) => {
    if (!packId || !auth.user?.access_token) return

    setIsMarking(true)
    try {
      await markAppsAsAdapted(auth.user.access_token, packId, [appInfoId], adapted)
      await fetchRequests()
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.updateAdaptedStatus"))
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

  const columns: AppRequestsTableColumn[] = [
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
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <p className="text-destructive">{error}</p>
          ) : requests.length > 0 ? (
            <div className="space-y-4">
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
                renderActions={(item: IconPackVersionRequestRecordResponse) => {
                  const isAdapted = !!item.iconPackApp
                  return isAdapted ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        item.requestRecord.appInfo?.id &&
                        handleToggleAdapted(item.requestRecord.appInfo.id, false)
                      }
                      disabled={isMarking || !item.requestRecord.appInfo?.id}
                    >
                      <Minus className="h-4 w-4 mr-1" />
                      {t("common.remove")}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        item.requestRecord.appInfo?.id &&
                        handleToggleAdapted(item.requestRecord.appInfo.id, true)
                      }
                      disabled={isMarking || !item.requestRecord.appInfo?.id}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {t("common.add")}
                    </Button>
                  )
                }}
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
    </div>
  )
}

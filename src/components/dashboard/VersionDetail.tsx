import { useState, useEffect } from "react"
import { useParams } from "react-router"
import { useAuth } from "react-oidc-context"
import { useTranslation } from "react-i18next"
import { ImageOff, Plus, Minus, Settings } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-3">
                {requests.map((item) => {
                  const request = item.requestRecord
                  const isAdapted = !!item.iconPackApp
                  const iconUrl = getIconUrl(request.appInfo?.packageName)
                  return (
                    <div key={request.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          {iconUrl ? (
                            <img
                              src={iconUrl}
                              alt={request.appInfo?.defaultName ?? "App icon"}
                              className="h-10 w-10 rounded object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = "none"
                                e.currentTarget.nextElementSibling?.classList.remove("hidden")
                              }}
                            />
                          ) : null}
                          <div className={`${iconUrl ? "hidden" : ""} flex h-10 w-10 items-center justify-center rounded bg-muted`}>
                            <ImageOff className="h-5 w-5 text-muted-foreground" />
                          </div>
                          {request.isSystemApp && (
                            <div className="absolute -bottom-1 -right-1 bg-background border rounded-full p-0.5">
                              <Settings className="h-3 w-3 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium break-words">
                            {request.appInfo?.defaultName ?? "-"}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {formatDate(request.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <div className="text-muted-foreground">{t("iconPack.packageName")}</div>
                          <div className="font-mono break-all">{request.appInfo?.packageName ?? "-"}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">{t("iconPack.mainActivity")}</div>
                          <div className="font-mono break-all">{request.appInfo?.mainActivity ?? "-"}</div>
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        {isAdapted ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              request.appInfo?.id &&
                              handleToggleAdapted(request.appInfo.id, false)
                            }
                            disabled={isMarking || !request.appInfo?.id}
                          >
                            <Minus className="h-4 w-4 mr-1" />
                            {t("common.remove")}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              request.appInfo?.id &&
                              handleToggleAdapted(request.appInfo.id, true)
                            }
                            disabled={isMarking || !request.appInfo?.id}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            {t("common.add")}
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block w-full overflow-hidden">
                <Table className="table-fixed w-full">
                  <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">{t("iconPack.icon")}</TableHead>
                    <TableHead className="w-[15%]">{t("iconPack.appName")}</TableHead>
                    <TableHead className="w-[25%]">{t("iconPack.packageName")}</TableHead>
                    <TableHead className="w-[25%]">{t("iconPack.mainActivity")}</TableHead>
                    <TableHead className="w-[100px]">{t("iconPack.requested")}</TableHead>
                    <TableHead className="w-[120px] text-right">{t("iconPack.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((item) => {
                    const request = item.requestRecord
                    const isAdapted = !!item.iconPackApp
                    const iconUrl = getIconUrl(request.appInfo?.packageName)
                    return (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="relative inline-block">
                            {iconUrl ? (
                              <img
                                src={iconUrl}
                                alt={request.appInfo?.defaultName ?? "App icon"}
                                className="h-8 w-8 rounded object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none"
                                  e.currentTarget.nextElementSibling?.classList.remove("hidden")
                                }}
                              />
                            ) : null}
                            <div className={`${iconUrl ? "hidden" : ""} flex h-8 w-8 items-center justify-center rounded bg-muted`}>
                              <ImageOff className="h-4 w-4 text-muted-foreground" />
                            </div>
                            {request.isSystemApp && (
                              <div className="absolute -bottom-1 -right-1 bg-background border rounded-full p-0.5">
                                <Settings className="h-3 w-3 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="truncate" title={request.appInfo?.defaultName ?? "-"}>
                            {request.appInfo?.defaultName ?? "-"}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <div className="truncate" title={request.appInfo?.packageName ?? "-"}>
                            {request.appInfo?.packageName ?? "-"}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <div className="truncate" title={request.appInfo?.mainActivity ?? "-"}>
                            {request.appInfo?.mainActivity ?? "-"}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(request.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          {isAdapted ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                request.appInfo?.id &&
                                handleToggleAdapted(request.appInfo.id, false)
                              }
                              disabled={isMarking || !request.appInfo?.id}
                            >
                              <Minus className="h-4 w-4 mr-1" />
                              {t("common.remove")}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                request.appInfo?.id &&
                                handleToggleAdapted(request.appInfo.id, true)
                              }
                              disabled={isMarking || !request.appInfo?.id}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              {t("common.add")}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              </div>
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

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import {
  deleteIconPack,
  deleteIconPackVersion,
  getIconPack,
  getIconPackVersions,
  getIconPackRequests,
  getIconPackAdaptedApps,
  markAppsAsAdapted,
} from "@/services/icon-pack"
import { API_BASE_URL } from "@/services/api"
import { CreateVersionDialog } from "./CreateVersionDialog"
import { CreateAccessTokenDialog } from "./CreateAccessTokenDialog"
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog"
import { AppRequestsTable, type AppRequestsTableColumn } from "./AppRequestsTable"
import type { IconPackDTO, IconPackVersionDTO, AppInfoWithRequestCount, AppInfoDTO } from "@/types/icon-pack"

const REQUESTS_PER_PAGE = 10
const ADAPTED_PER_PAGE = 10

export function IconPackManage() {
  const { packId } = useParams()
  const navigate = useNavigate()
  const auth = useAuth()
  const { t } = useTranslation()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeletingVersion, setIsDeletingVersion] = useState(false)
  const [iconPack, setIconPack] = useState<IconPackDTO | null>(null)
  const [versions, setVersions] = useState<IconPackVersionDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Requests state
  const [requests, setRequests] = useState<AppInfoWithRequestCount[]>([])
  const [requestsTotal, setRequestsTotal] = useState(0)
  const [requestsPage, setRequestsPage] = useState(1)
  const [includingAdapted, setIncludingAdapted] = useState(false)
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)
  const [isMarking, setIsMarking] = useState(false)

  // Adapted apps state
  const [adaptedApps, setAdaptedApps] = useState<AppInfoDTO[]>([])
  const [adaptedTotal, setAdaptedTotal] = useState(0)
  const [adaptedPage, setAdaptedPage] = useState(1)
  const [isLoadingAdapted, setIsLoadingAdapted] = useState(false)

  const requestsTotalPages = Math.ceil(requestsTotal / REQUESTS_PER_PAGE)
  const adaptedTotalPages = Math.ceil(adaptedTotal / ADAPTED_PER_PAGE)

  const [createVersionOpen, setCreateVersionOpen] = useState(false)
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false)
  const [deletePackDialogOpen, setDeletePackDialogOpen] = useState(false)
  const [deleteVersionDialogOpen, setDeleteVersionDialogOpen] = useState(false)
  const [selectedVersion, setSelectedVersion] =
    useState<IconPackVersionDTO | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!packId || !auth.user?.access_token) return

      setIsLoading(true)
      setError(null)

      try {
        const [iconPackData, versionsResponse] = await Promise.all([
          getIconPack(auth.user.access_token, packId),
          getIconPackVersions(auth.user.access_token, packId),
        ])
        setIconPack(iconPackData)
        setVersions(versionsResponse.items)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t("errors.loadIconPack")
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [packId, auth.user?.access_token])

  // Fetch requests
  const fetchRequests = async () => {
    if (!packId || !auth.user?.access_token) return

    setIsLoadingRequests(true)
    try {
      const response = await getIconPackRequests(
        auth.user.access_token,
        packId,
        requestsPage,
        REQUESTS_PER_PAGE,
        includingAdapted
      )
      setRequests(response.items)
      setRequestsTotal(response.metadata.total)
    } catch (err) {
      console.error(t("errors.loadRequests"), err)
    } finally {
      setIsLoadingRequests(false)
    }
  }

  useEffect(() => {
    fetchRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packId, auth.user?.access_token, requestsPage, includingAdapted])

  // Fetch adapted apps
  const fetchAdaptedApps = async () => {
    if (!packId || !auth.user?.access_token) return

    setIsLoadingAdapted(true)
    try {
      const response = await getIconPackAdaptedApps(
        auth.user.access_token,
        packId,
        adaptedPage,
        ADAPTED_PER_PAGE
      )
      setAdaptedApps(response.items)
      setAdaptedTotal(response.metadata.total)
    } catch (err) {
      console.error(t("errors.loadAdaptedApps"), err)
    } finally {
      setIsLoadingAdapted(false)
    }
  }

  useEffect(() => {
    fetchAdaptedApps()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packId, auth.user?.access_token, adaptedPage])

  const handleAdaptedPageChange = (page: number) => {
    if (page >= 1 && page <= adaptedTotalPages) {
      setAdaptedPage(page)
    }
  }

  const handleRequestsPageChange = (page: number) => {
    if (page >= 1 && page <= requestsTotalPages) {
      setRequestsPage(page)
    }
  }

  const handleIncludingAdaptedChange = (checked: boolean) => {
    setIncludingAdapted(checked)
    setRequestsPage(1)
  }

  const handleMarkAsAdapted = async (appInfoId: string, adapted: boolean) => {
    if (!packId || !auth.user?.access_token) return

    setIsMarking(true)
    try {
      await markAppsAsAdapted(auth.user.access_token, packId, [appInfoId], adapted)
      await Promise.all([fetchRequests(), fetchAdaptedApps()])
    } catch (err) {
      console.error(t("errors.updateAdaptedStatus"), err)
    } finally {
      setIsMarking(false)
    }
  }

  const getIconUrl = (packageName?: string) => {
    if (!packageName) return null
    return `${API_BASE_URL}/app-icon?packageName=${encodeURIComponent(packageName)}`
  }

  const getVisibleRequestsPages = () => {
    const pages: (number | "ellipsis")[] = []

    if (requestsTotalPages <= 5) {
      for (let i = 1; i <= requestsTotalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      if (requestsPage > 3) {
        pages.push("ellipsis")
      }

      const start = Math.max(2, requestsPage - 1)
      const end = Math.min(requestsTotalPages - 1, requestsPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (requestsPage < requestsTotalPages - 2) {
        pages.push("ellipsis")
      }

      pages.push(requestsTotalPages)
    }

    return pages
  }

  const getVisibleAdaptedPages = () => {
    const pages: (number | "ellipsis")[] = []

    if (adaptedTotalPages <= 5) {
      for (let i = 1; i <= adaptedTotalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      if (adaptedPage > 3) {
        pages.push("ellipsis")
      }

      const start = Math.max(2, adaptedPage - 1)
      const end = Math.min(adaptedTotalPages - 1, adaptedPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (adaptedPage < adaptedTotalPages - 2) {
        pages.push("ellipsis")
      }

      pages.push(adaptedTotalPages)
    }

    return pages
  }

  const handleDeletePack = async () => {
    if (!packId || !auth.user?.access_token) return

    setIsDeleting(true)
    try {
      await deleteIconPack(auth.user.access_token, packId)
      navigate("/dashboard")
    } catch (error) {
      console.error(t("errors.deleteIconPack"), error)
      setError(t("errors.deleteIconPack"))
    } finally {
      setIsDeleting(false)
      setDeletePackDialogOpen(false)
    }
  }

  const handleDeleteVersion = async () => {
    if (!packId || !auth.user?.access_token || !selectedVersion?.id) return

    setIsDeletingVersion(true)
    try {
      await deleteIconPackVersion(
        auth.user.access_token,
        packId,
        selectedVersion.id
      )
      setVersions((prev) => prev.filter((v) => v.id !== selectedVersion.id))
      setDeleteVersionDialogOpen(false)
      setSelectedVersion(null)
    } catch (error) {
      console.error(t("errors.deleteVersion"), error)
      setError(t("errors.deleteVersion"))
    } finally {
      setIsDeletingVersion(false)
    }
  }

  const handleVersionCreated = (version: IconPackVersionDTO) => {
    setVersions((prev) => [...prev, version])
  }

  const handleCreateToken = (version: IconPackVersionDTO) => {
    setSelectedVersion(version)
    setTokenDialogOpen(true)
  }

  const handleDeleteVersionClick = (version: IconPackVersionDTO) => {
    setSelectedVersion(version)
    setDeleteVersionDialogOpen(true)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString()
  }

  const requestColumns: AppRequestsTableColumn[] = [
    {
      key: "appName",
      header: t("iconPack.appName"),
      width: "w-[15%]",
      render: (item: AppInfoWithRequestCount) => (
        <div className="truncate font-medium" title={item.appInfo?.defaultName ?? "-"}>
          {item.appInfo?.defaultName ?? "-"}
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
      render: (item: AppInfoWithRequestCount) => (
        <div className="truncate" title={item.appInfo?.packageName ?? "-"}>
          {item.appInfo?.packageName ?? "-"}
        </div>
      ),
    },
    {
      key: "mainActivity",
      header: t("iconPack.mainActivity"),
      mobileLabel: t("iconPack.mainActivity"),
      width: "w-[25%]",
      className: "font-mono text-sm break-all",
      render: (item: AppInfoWithRequestCount) => (
        <div className="truncate" title={item.appInfo?.mainActivity ?? "-"}>
          {item.appInfo?.mainActivity ?? "-"}
        </div>
      ),
    },
    {
      key: "count",
      header: t("iconPack.count"),
      width: "w-[100px]",
      render: (item: AppInfoWithRequestCount) => item.count,
      showInMobile: true,
    },
  ]

  const adaptedColumns: AppRequestsTableColumn[] = [
    {
      key: "appName",
      header: t("iconPack.appName"),
      width: "w-[15%]",
      render: (item: AppInfoDTO) => (
        <div className="truncate font-medium" title={item.defaultName ?? "-"}>
          {item.defaultName ?? "-"}
        </div>
      ),
      showInMobile: false,
    },
    {
      key: "packageName",
      header: t("iconPack.packageName"),
      mobileLabel: t("iconPack.packageName"),
      width: "w-[30%]",
      className: "font-mono text-sm break-all",
      render: (item: AppInfoDTO) => (
        <div className="truncate" title={item.packageName ?? "-"}>
          {item.packageName ?? "-"}
        </div>
      ),
    },
    {
      key: "mainActivity",
      header: t("iconPack.mainActivity"),
      mobileLabel: t("iconPack.mainActivity"),
      width: "w-[30%]",
      className: "font-mono text-sm break-all",
      render: (item: AppInfoDTO) => (
        <div className="truncate" title={item.mainActivity ?? "-"}>
          {item.mainActivity ?? "-"}
        </div>
      ),
    },
  ]

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
          <h2 className="text-2xl font-bold tracking-tight">{t("common.error")}</h2>
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {iconPack?.name || t("iconPack.management")}
        </h2>
        <p className="text-muted-foreground">{t("iconPack.manageDesc", { id: packId })}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("iconPack.versions")}</CardTitle>
            <CardDescription>
              {t("iconPack.versionsDesc")}
            </CardDescription>
          </div>
          <Button onClick={() => setCreateVersionOpen(true)}>
            {t("iconPack.newVersion")}
          </Button>
        </CardHeader>
        <CardContent>
          {versions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>{t("iconPack.created")}</TableHead>
                  <TableHead className="text-right">{t("iconPack.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell className="font-medium">
                      {version.versionString}
                    </TableCell>
                    <TableCell>{formatDate(version.createdAt)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link
                          to={`/dashboard/icon-pack/${packId}/version/${version.id}`}
                          state={{
                            iconPackName: iconPack?.name,
                            versionString: version.versionString,
                          }}
                        >
                          {t("common.view")}
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateToken(version)}
                      >
                        {t("iconPack.createAccessToken")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteVersionClick(version)}
                      >
                        {t("common.delete")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">
              {t("iconPack.noVersions")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>{t("iconPack.requests")}</CardTitle>
              <CardDescription>
                {t("iconPack.requestsCount", { count: requestsTotal })}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-adapted"
                checked={includingAdapted}
                onCheckedChange={(checked) =>
                  handleIncludingAdaptedChange(checked === true)
                }
              />
              <Label htmlFor="show-adapted" className="text-sm font-normal">
                {t("iconPack.showAdaptedApps")}
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingRequests ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : requests.length > 0 ? (
            <div className="space-y-4">
              <AppRequestsTable
                items={requests}
                columns={requestColumns}
                getIconUrl={(item: AppInfoWithRequestCount) =>
                  getIconUrl(item.appInfo?.packageName)
                }
                getAppName={(item: AppInfoWithRequestCount) =>
                  item.appInfo?.defaultName ?? "-"
                }
                renderActions={(item: AppInfoWithRequestCount) => {
                  const isAdapted = !!item.iconPackApp
                  return isAdapted ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        item.appInfo?.id &&
                        handleMarkAsAdapted(item.appInfo.id, false)
                      }
                      disabled={isMarking || !item.appInfo?.id}
                    >
                      <Minus className="h-4 w-4 mr-1" />
                      {t("common.remove")}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        item.appInfo?.id &&
                        handleMarkAsAdapted(item.appInfo.id, true)
                      }
                      disabled={isMarking || !item.appInfo?.id}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {t("common.add")}
                    </Button>
                  )
                }}
                getItemKey={(item: AppInfoWithRequestCount) =>
                  item.appInfo?.id ?? ""
                }
              />
              {requestsTotalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handleRequestsPageChange(requestsPage - 1)}
                        className={requestsPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {getVisibleRequestsPages().map((page, index) =>
                      page === "ellipsis" ? (
                        <PaginationItem key={`ellipsis-${index}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handleRequestsPageChange(page)}
                            isActive={requestsPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handleRequestsPageChange(requestsPage + 1)}
                        className={requestsPage === requestsTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
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

      <Card>
        <CardHeader>
          <CardTitle>{t("iconPack.adaptedApps")}</CardTitle>
          <CardDescription>
            {t("iconPack.adaptedAppsCount", { count: adaptedTotal })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAdapted ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : adaptedApps.length > 0 ? (
            <div className="space-y-4">
              <AppRequestsTable
                items={adaptedApps}
                columns={adaptedColumns}
                getIconUrl={(item: AppInfoDTO) => getIconUrl(item.packageName)}
                getAppName={(item: AppInfoDTO) => item.defaultName ?? "-"}
                renderActions={(item: AppInfoDTO) => (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => item.id && handleMarkAsAdapted(item.id, false)}
                    disabled={isMarking || !item.id}
                  >
                    <Minus className="h-4 w-4 mr-1" />
                    {t("common.remove")}
                  </Button>
                )}
                getItemKey={(item: AppInfoDTO) => item.id ?? ""}
              />
              {adaptedTotalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handleAdaptedPageChange(adaptedPage - 1)}
                        className={adaptedPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {getVisibleAdaptedPages().map((page, index) =>
                      page === "ellipsis" ? (
                        <PaginationItem key={`ellipsis-${index}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handleAdaptedPageChange(page)}
                            isActive={adaptedPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handleAdaptedPageChange(adaptedPage + 1)}
                        className={adaptedPage === adaptedTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">{t("iconPack.noAdaptedApps")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("iconPack.dangerZone")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setDeletePackDialogOpen(true)}
            disabled={isDeleting}
          >
            {t("iconPack.deleteIconPack")}
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

      {iconPack?.name && (
        <ConfirmDeleteDialog
          open={deletePackDialogOpen}
          onOpenChange={setDeletePackDialogOpen}
          title={t("iconPack.deleteIconPack")}
          description={t("iconPack.deletePackConfirm", { name: iconPack.name })}
          confirmText={iconPack.name}
          onConfirm={handleDeletePack}
          isDeleting={isDeleting}
        />
      )}

      {selectedVersion && (
        <ConfirmDeleteDialog
          open={deleteVersionDialogOpen}
          onOpenChange={setDeleteVersionDialogOpen}
          title={t("iconPack.deleteVersion")}
          description={t("iconPack.deleteVersionConfirm", { version: selectedVersion.versionString })}
          confirmText={selectedVersion.versionString}
          onConfirm={handleDeleteVersion}
          isDeleting={isDeletingVersion}
        />
      )}
    </div>
  )
}

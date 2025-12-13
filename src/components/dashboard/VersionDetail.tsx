import { useState, useEffect } from "react"
import { useParams } from "react-router"
import { useAuth } from "react-oidc-context"
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
import type { RequestRecordDTO } from "@/types/icon-pack"

const PER_PAGE = 10

export function VersionDetail() {
  const { packId, versionId } = useParams()
  const auth = useAuth()
  const [requests, setRequests] = useState<RequestRecordDTO[]>([])
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
      setError(err instanceof Error ? err.message : "Failed to load requests")
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

  const handleMarkAsAdapted = async (appInfoId: string) => {
    if (!packId || !auth.user?.access_token) return

    setIsMarking(true)
    try {
      await markAppsAsAdapted(auth.user.access_token, packId, [appInfoId], true)
      await fetchRequests()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark as adapted")
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Version Details</h2>
        <p className="text-muted-foreground">Manage version: {versionId}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Requests</CardTitle>
              <CardDescription>
                {total} request{total !== 1 ? "s" : ""} for this version.
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
                Show adapted apps
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>App Name</TableHead>
                    <TableHead>Package Name</TableHead>
                    <TableHead>Main Activity</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.appInfo?.defaultName ?? "-"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {request.appInfo?.packageName ?? "-"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {request.appInfo?.mainActivity ?? "-"}
                      </TableCell>
                      <TableCell>{formatDate(request.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            request.appInfo?.id &&
                            handleMarkAsAdapted(request.appInfo.id)
                          }
                          disabled={isMarking || !request.appInfo?.id}
                        >
                          Mark as Adapted
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
            <p className="text-muted-foreground">No requests yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

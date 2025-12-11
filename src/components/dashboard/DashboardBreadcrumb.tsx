import { Link, useLocation, useMatch } from "react-router"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface BreadcrumbState {
  iconPackName?: string
  versionString?: string
}

export function DashboardBreadcrumb() {
  const location = useLocation()
  const state = (location.state as BreadcrumbState) || {}

  // Use useMatch to determine current route
  const iconPackMatch = useMatch("/dashboard/icon-pack/:packId")
  const versionMatch = useMatch("/dashboard/icon-pack/:packId/version/:versionId")

  const isOnDashboard = location.pathname === "/dashboard"
  const isOnIconPack = iconPackMatch && !versionMatch
  const isOnVersion = !!versionMatch

  const packId = iconPackMatch?.params.packId || versionMatch?.params.packId
  const versionId = versionMatch?.params.versionId

  // Use state values, fallback to IDs if state is missing (e.g., direct URL access)
  const iconPackName = state.iconPackName || packId
  const versionString = state.versionString || versionId

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {isOnDashboard ? (
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link to="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {(isOnIconPack || isOnVersion) && packId && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {isOnIconPack ? (
                <BreadcrumbPage>{iconPackName}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    to={`/dashboard/icon-pack/${packId}`}
                    state={{ iconPackName: state.iconPackName }}
                  >
                    {iconPackName}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </>
        )}

        {isOnVersion && versionId && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{versionString}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

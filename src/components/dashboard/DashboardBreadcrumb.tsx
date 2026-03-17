import { Link, useLocation, matchPath } from "react-router"
import { useTranslation } from "react-i18next"
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

interface CrumbItem {
  label: string
  to?: string
  state?: Pick<BreadcrumbState, "iconPackName">
}

export function DashboardBreadcrumb() {
  const { t } = useTranslation()
  const location = useLocation()
  const state = (location.state as BreadcrumbState) || {}

  const routeCrumbs = [
    {
      pattern: "/dashboard/icon-pack/:packId/version/:versionId",
      build: (packId: string, versionId?: string): CrumbItem[] => [
        {
          label: state.iconPackName || packId,
          to: `/dashboard/icon-pack/${packId}`,
          state: { iconPackName: state.iconPackName },
        },
        { label: state.versionString || versionId || "" },
      ],
    },
    {
      pattern: "/dashboard/icon-pack/:packId/studio",
      build: (packId: string): CrumbItem[] => [
        {
          label: state.iconPackName || packId,
          to: `/dashboard/icon-pack/${packId}`,
          state: { iconPackName: state.iconPackName },
        },
        { label: t("iconPack.studio") },
      ],
    },
    {
      pattern: "/dashboard/icon-pack/:packId",
      build: (packId: string): CrumbItem[] => [{ label: state.iconPackName || packId }],
    },
  ]

  const matchedRoute = routeCrumbs.find((route) =>
    matchPath({ path: route.pattern, end: true }, location.pathname)
  )

  const match = matchedRoute
    ? matchPath({ path: matchedRoute.pattern, end: true }, location.pathname)
    : null

  const packId = match?.params.packId
  const versionId = match?.params.versionId

  const detailCrumbs = matchedRoute && packId
    ? matchedRoute.build(packId, versionId)
    : []

  const crumbs: CrumbItem[] = [
    {
      label: t("dashboard.title"),
      to: detailCrumbs.length > 0 ? "/dashboard" : undefined,
    },
    ...detailCrumbs,
  ]

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          const key = `${crumb.label}-${index}`

          return (
            <BreadcrumbItem key={key}>
              {index > 0 && <BreadcrumbSeparator />}
              {isLast || !crumb.to ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={crumb.to} state={crumb.state}>
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

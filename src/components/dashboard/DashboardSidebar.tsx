import { useState, useEffect } from "react"
import { useAuth } from "react-oidc-context"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router"
import {
  ChevronRight,
  ChevronsUpDown,
  Home,
  BarChart3,
  Package,
  Settings,
  LogOut,
  Plus,
  Sun,
  Moon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { SidebarMenuSkeleton } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { extractUserProfile } from "@/types/user"
import type { IconPackDTO } from "@/types/icon-pack"
import { getIconPacks } from "@/services/icon-pack"
import { getDesignerMe } from "@/services/designer"
import { CreateIconPackDialog } from "./CreateIconPackDialog"
import { ThemeMenu } from "@/components/theme-menu"

export function DashboardSidebar() {
  const auth = useAuth()
  const location = useLocation()
  const { t } = useTranslation()
  const [iconPacks, setIconPacks] = useState<IconPackDTO[]>([])
  const [isLoadingPacks, setIsLoadingPacks] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const profile = auth.user
    ? extractUserProfile(auth.user.profile as Record<string, unknown>)
    : null

  const initials =
    profile?.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U"

  const isActive = (path: string) => location.pathname === path

  const handleLogout = () => {
    auth.signoutRedirect()
  }

  const handleIconPackCreated = (iconPack: IconPackDTO) => {
    setIconPacks((prev) => [...prev, iconPack])
  }

  useEffect(() => {
    async function fetchIconPacks() {
      if (!auth.user?.access_token) return

      try {
        const packs = await getIconPacks(auth.user.access_token)
        setIconPacks(packs)
      } catch (error) {
        console.error("Failed to fetch icon packs:", error)
      } finally {
        setIsLoadingPacks(false)
      }
    }

    fetchIconPacks()
  }, [auth.user?.access_token])

  useEffect(() => {
    async function fetchCurrentUser() {
      if (!auth.user?.access_token) return

      try {
        const designer = await getDesignerMe(auth.user.access_token)
        setCurrentUserId(designer.id || null)
      } catch (error) {
        console.error("Failed to fetch current user:", error)
      }
    }

    fetchCurrentUser()
  }, [auth.user?.access_token])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Package className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">{t("common.appName")}</span>
                  <span className="text-xs text-muted-foreground">{t("nav.dashboard")}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* General Section */}
        <SidebarGroup>
          <SidebarGroupLabel>{t("dashboard.general")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
                  <Link to="/dashboard">
                    <BarChart3 />
                    <span>{t("dashboard.statistics")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Icon Packs Section - Collapsible */}
        <SidebarGroup>
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center">
                {t("dashboard.iconPacks")}
                <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {isLoadingPacks ? (
                    <>
                      <SidebarMenuSkeleton showIcon />
                      <SidebarMenuSkeleton showIcon />
                    </>
                  ) : (
                    <>
                      {iconPacks.map((pack) => {
                        const isOwner = !currentUserId || pack.designer?.id === currentUserId
                        return (
                          <SidebarMenuItem key={pack.id}>
                            <SidebarMenuButton
                              asChild
                              isActive={isActive(`/dashboard/icon-pack/${pack.id}`)}
                            >
                              <Link
                                to={`/dashboard/icon-pack/${pack.id}`}
                                state={{ iconPackName: pack.name }}
                              >
                                <Package />
                                <span className="flex-1">{pack.name}</span>
                                {!isOwner && (
                                  <Badge variant="secondary" className="ml-auto text-xs">
                                    {t("common.shared")}
                                  </Badge>
                                )}
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )
                      })}
                      <SidebarMenuItem>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-muted-foreground"
                          onClick={() => setShowCreateDialog(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {t("dashboard.createIconPack")}
                        </Button>
                      </SidebarMenuItem>
                    </>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {/* Back to Home link */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/">
                <Home className="!size-4" />
                <span>{t("nav.backToHome")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Theme toggle */}
        <SidebarMenu>
          <SidebarMenuItem>
            <ThemeMenu
              align="start"
              side="top"
              trigger={
                <SidebarMenuButton>
                  <Sun className="!size-4 scale-100 rotate-0 dark:scale-0 dark:-rotate-90" />
                  <Moon className="absolute !size-4 scale-0 rotate-90 dark:scale-100 dark:rotate-0" />
                  <span>{t("theme.toggle")}</span>
                </SidebarMenuButton>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User dropdown menu */}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="group/user">
                  <Avatar className="h-8 w-8">
                    {profile?.picture && (
                      <AvatarImage src={profile.picture} alt={profile.name} />
                    )}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-medium">{profile?.name}</span>
                    <span className="text-xs text-muted-foreground group-hover/user:text-sidebar-accent-foreground group-data-[state=open]/user:text-sidebar-accent-foreground">
                      {profile?.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <a
                    href={import.meta.env.VITE_OIDC_AUTHORITY}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Settings />
                    {t("nav.accountManagement")}
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut />
                  {t("nav.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <CreateIconPackDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={handleIconPackCreated}
      />
    </Sidebar>
  )
}

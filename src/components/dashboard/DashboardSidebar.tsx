import { useState, useEffect } from "react"
import { useAuth } from "react-oidc-context"
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
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
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
import { SidebarMenuSkeleton } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { extractUserProfile } from "@/types/user"
import type { IconPackDTO } from "@/types/icon-pack"
import { getIconPacks } from "@/services/icon-pack"
import { CreateIconPackDialog } from "./CreateIconPackDialog"

export function DashboardSidebar() {
  const auth = useAuth()
  const location = useLocation()
  const [iconPacks, setIconPacks] = useState<IconPackDTO[]>([])
  const [isLoadingPacks, setIsLoadingPacks] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

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
                  <span className="font-semibold">AppTracker</span>
                  <span className="text-xs text-muted-foreground">Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* General Section */}
        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
                  <Link to="/dashboard">
                    <BarChart3 />
                    <span>Statistics</span>
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
                Icon Packs
                <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <SidebarGroupAction
              title="Create Icon Pack"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus />
              <span className="sr-only">Create Icon Pack</span>
            </SidebarGroupAction>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {isLoadingPacks ? (
                    <>
                      <SidebarMenuSkeleton showIcon />
                      <SidebarMenuSkeleton showIcon />
                    </>
                  ) : iconPacks.length === 0 ? (
                    <SidebarMenuItem>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-muted-foreground"
                        onClick={() => setShowCreateDialog(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create your first icon pack
                      </Button>
                    </SidebarMenuItem>
                  ) : (
                    iconPacks.map((pack) => (
                      <SidebarMenuItem key={pack.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(`/dashboard/icon-pack/${pack.id}`)}
                        >
                          <Link to={`/dashboard/icon-pack/${pack.id}`}>
                            <Package />
                            <span>{pack.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
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
                <span>Back to Home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User dropdown menu */}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="h-8 w-8">
                    {profile?.picture && (
                      <AvatarImage src={profile.picture} alt={profile.name} />
                    )}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-medium">{profile?.name}</span>
                    <span className="text-xs text-muted-foreground">
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
                    Account management
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut />
                  Sign out
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

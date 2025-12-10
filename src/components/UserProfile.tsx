import { useAuth } from "react-oidc-context"
import { useNavigate } from "react-router"
import { User, LayoutDashboard } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { extractUserProfile } from "@/types/user"
import { saveReturnUrl } from "@/lib/auth-config"

export function UserProfile() {
  const auth = useAuth()
  const navigate = useNavigate()

  const handleLogin = () => {
    saveReturnUrl()
    auth.signinRedirect()
  }

  const handleLogout = () => {
    auth.signoutRedirect()
  }

  // Loading state
  if (auth.isLoading) {
    return (
      <Avatar className="h-9 w-9 border">
        <AvatarFallback>
          <User className="h-4 w-4 animate-pulse" />
        </AvatarFallback>
      </Avatar>
    )
  }

  // Not authenticated - show dropdown with sign in option
  if (!auth.isAuthenticated || !auth.user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="h-9 w-9 border">
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleLogin}>Sign in</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Authenticated - show user profile dropdown
  const profile = extractUserProfile(auth.user.profile as Record<string, unknown>)
  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="h-9 w-9 border">
            {profile.picture && <AvatarImage src={profile.picture} alt={profile.name} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{profile.name}</p>
            {profile.email && (
              <p className="text-xs text-muted-foreground">{profile.email}</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/dashboard")}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

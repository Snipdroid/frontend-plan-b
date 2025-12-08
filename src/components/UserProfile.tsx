import { useAuth } from "react-oidc-context"
import { User } from "lucide-react"
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
      <Avatar className="h-9 w-9">
        <AvatarFallback>
          <User className="h-4 w-4 animate-pulse" />
        </AvatarFallback>
      </Avatar>
    )
  }

  // Not authenticated - show login button
  if (!auth.isAuthenticated || !auth.user) {
    return (
      <Button variant="ghost" size="icon" onClick={handleLogin} aria-label="Sign in">
        <Avatar className="h-9 w-9">
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </Button>
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
          <Avatar className="h-9 w-9">
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
        <DropdownMenuItem onClick={handleLogout}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

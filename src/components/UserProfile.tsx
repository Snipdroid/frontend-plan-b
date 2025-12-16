import { useAuth } from "react-oidc-context"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { User, LayoutDashboard, Languages } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { extractUserProfile } from "@/types/user"
import { saveReturnUrl } from "@/lib/auth-config"
import { supportedLanguages } from "@/lib/i18n"

export function UserProfile() {
  const auth = useAuth()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const handleLogin = () => {
    saveReturnUrl()
    auth.signinRedirect()
  }

  const handleLogout = () => {
    auth.signoutRedirect()
  }

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  const currentLanguage = supportedLanguages.find(
    (lang) => lang.code === i18n.language
  ) || supportedLanguages[0]

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

  // Not authenticated - show dropdown with sign in option and language switcher
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
          <DropdownMenuItem onClick={handleLogin}>{t("nav.signIn")}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Languages className="mr-2 h-4 w-4" />
              {currentLanguage.nativeName}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={i18n.language}
                onValueChange={handleLanguageChange}
              >
                {supportedLanguages.map((lang) => (
                  <DropdownMenuRadioItem key={lang.code} value={lang.code}>
                    {lang.nativeName}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
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
          {t("nav.dashboard")}
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Languages className="mr-2 h-4 w-4" />
            {currentLanguage.nativeName}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={i18n.language}
              onValueChange={handleLanguageChange}
            >
              {supportedLanguages.map((lang) => (
                <DropdownMenuRadioItem key={lang.code} value={lang.code}>
                  {lang.nativeName}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>{t("nav.signOut")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

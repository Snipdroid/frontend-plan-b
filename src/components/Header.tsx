import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { Package, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserProfile } from "@/components/UserProfile"

export function Header() {
  const { t } = useTranslation()

  return (
    <header className="w-full border-b">
      <div className="max-w-[1640px] mx-auto flex w-full items-center justify-between px-4 md:px-10">
        <div className="flex h-16 items-center">
          <a href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <Package className="size-8" />
            <h1 className="text-lg font-semibold tracking-tight">{t("common.appName")}</h1>
          </a>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/upload">
              <Upload className="mr-2 h-4 w-4" />
              {t("nav.upload")}
            </Link>
          </Button>
          <ThemeToggle />
          <UserProfile />
        </div>
      </div>
    </header>
  )
}

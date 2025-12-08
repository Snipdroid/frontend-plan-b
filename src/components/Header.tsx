import { Package } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserProfile } from "@/components/UserProfile"

export function Header() {
  return (
    <header className="w-full border-b">
      <div className="max-w-[1640px] mx-auto flex w-full items-center justify-between px-4 md:px-10">
        <div className="flex h-16 items-center">
          <a href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <Package className="size-8" />
            <h1 className="text-lg font-semibold tracking-tight">AppTracker</h1>
          </a>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <UserProfile />
        </div>
      </div>
    </header>
  )
}

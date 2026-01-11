import { Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme, type Theme } from "@/components/theme"
import { type ColorTheme, colorThemeKeys, themes } from "@/lib/themes"

function ThemeSwatch({ theme, isDark }: { theme: ColorTheme; isDark: boolean }) {
  const preview = isDark ? themes[theme].preview.dark : themes[theme].preview.light

  return (
    <span className="flex gap-0.5">
      <span
        className="size-3 rounded-full border border-border"
        style={{ background: preview.background }}
      />
      <span
        className="size-3 rounded-full"
        style={{ background: preview.primary }}
      />
    </span>
  )
}

interface ThemeMenuProps {
  /** Custom trigger element. If not provided, uses default icon button */
  trigger?: React.ReactNode
  /** Dropdown alignment */
  align?: "start" | "center" | "end"
  /** Dropdown side */
  side?: "top" | "right" | "bottom" | "left"
}

export function ThemeMenu({ trigger, align = "end", side }: ThemeMenuProps) {
  const { theme, setTheme, colorTheme, setColorTheme, resolvedColorScheme } = useTheme()
  const { t } = useTranslation()

  const defaultTrigger = (
    <Button variant="ghost" size="icon">
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">{t("theme.toggle")}</span>
    </Button>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ?? defaultTrigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side}>
        {/* Color Scheme Section */}
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as Theme)}
        >
          <DropdownMenuRadioItem value="light">{t("theme.light")}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">{t("theme.dark")}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">{t("theme.system")}</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        {/* Color Theme Section */}
        <DropdownMenuLabel>{t("theme.colorTheme")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={colorTheme}
          onValueChange={(value) => setColorTheme(value as ColorTheme)}
        >
          {colorThemeKeys.map((key) => (
            <DropdownMenuRadioItem key={key} value={key}>
              <span className="flex items-center gap-2">
                <ThemeSwatch theme={key} isDark={resolvedColorScheme === "dark"} />
                {t(themes[key].nameKey)}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

import { Palette } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme"
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

export function ThemePicker() {
  const { colorTheme, setColorTheme, resolvedColorScheme } = useTheme()
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t("theme.colorTheme")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
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

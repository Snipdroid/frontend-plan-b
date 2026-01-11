import { createContext, useContext } from "react"
import type { ColorTheme } from "@/lib/themes"

export type ColorScheme = "dark" | "light" | "system"

// Keep "Theme" as alias for backwards compatibility
export type Theme = ColorScheme

export type ThemeProviderState = {
  // Color scheme (light/dark/system)
  colorScheme: ColorScheme
  setColorScheme: (scheme: ColorScheme) => void
  // Color theme (default/vscode/etc)
  colorTheme: ColorTheme
  setColorTheme: (theme: ColorTheme) => void
  // Resolved color scheme (light or dark, never system)
  resolvedColorScheme: "light" | "dark"
  // Legacy aliases for backwards compatibility
  theme: ColorScheme
  setTheme: (theme: ColorScheme) => void
}

export const initialState: ThemeProviderState = {
  colorScheme: "system",
  setColorScheme: () => null,
  colorTheme: "default",
  setColorTheme: () => null,
  resolvedColorScheme: "light",
  theme: "system",
  setTheme: () => null,
}

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export const useTheme = () => useContext(ThemeProviderContext)

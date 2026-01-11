import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react"
import { type ColorTheme, colorThemeKeys, getThemeDefinition } from "@/lib/themes"

export type ColorScheme = "dark" | "light" | "system"

// Keep "Theme" as alias for backwards compatibility
export type Theme = ColorScheme

type ThemeProviderProps = {
  children: React.ReactNode
  defaultColorScheme?: ColorScheme
  defaultColorTheme?: ColorTheme
  storageKeyColorScheme?: string
  storageKeyColorTheme?: string
}

type ThemeProviderState = {
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

const initialState: ThemeProviderState = {
  colorScheme: "system",
  setColorScheme: () => null,
  colorTheme: "default",
  setColorTheme: () => null,
  resolvedColorScheme: "light",
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

// Subscribe to system color scheme changes
function subscribeToSystemTheme(callback: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
  mediaQuery.addEventListener("change", callback)
  return () => mediaQuery.removeEventListener("change", callback)
}

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function getServerSnapshot(): "light" | "dark" {
  return "light" // Default to light for SSR
}

// Custom hook to manage localStorage-backed state
function useLocalStorageState<T extends string>(
  key: string,
  defaultValue: T,
  validator?: (value: string) => boolean
): [T, (value: T) => void] {
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener("storage", callback)
    return () => window.removeEventListener("storage", callback)
  }, [])

  const getSnapshot = useCallback(() => {
    const stored = localStorage.getItem(key)
    if (stored && (!validator || validator(stored))) {
      return stored as T
    }
    return defaultValue
  }, [key, defaultValue, validator])

  const value = useSyncExternalStore(subscribe, getSnapshot, () => defaultValue)

  const setValue = useCallback((newValue: T) => {
    localStorage.setItem(key, newValue)
    // Trigger re-render by dispatching storage event
    window.dispatchEvent(new StorageEvent("storage", { key }))
  }, [key])

  return [value, setValue]
}

export function ThemeProvider({
  children,
  defaultColorScheme = "system",
  defaultColorTheme = "default",
  storageKeyColorScheme = "apptracker-color-scheme",
  storageKeyColorTheme = "apptracker-color-theme",
  ...props
}: ThemeProviderProps) {
  // Migrate from old storage key on mount
  useEffect(() => {
    const oldKey = localStorage.getItem("apptracker-theme")
    if (oldKey && !localStorage.getItem(storageKeyColorScheme)) {
      localStorage.setItem(storageKeyColorScheme, oldKey)
      localStorage.removeItem("apptracker-theme")
      window.dispatchEvent(new StorageEvent("storage", { key: storageKeyColorScheme }))
    }
  }, [storageKeyColorScheme])

  const [colorScheme, setColorScheme] = useLocalStorageState<ColorScheme>(
    storageKeyColorScheme,
    defaultColorScheme,
    (v) => ["light", "dark", "system"].includes(v)
  )

  const [colorTheme, setColorTheme] = useLocalStorageState<ColorTheme>(
    storageKeyColorTheme,
    defaultColorTheme,
    (v) => colorThemeKeys.includes(v as ColorTheme)
  )

  // Track system theme preference
  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
    getServerSnapshot
  )

  // Compute resolved color scheme
  const resolvedColorScheme: "light" | "dark" = colorScheme === "system" ? systemTheme : colorScheme

  // Apply classes to document element
  useEffect(() => {
    const root = window.document.documentElement

    // Remove all theme classes
    colorThemeKeys.forEach((key) => {
      const def = getThemeDefinition(key)
      if (def.className) {
        root.classList.remove(def.className)
      }
    })
    root.classList.remove("light", "dark")

    // Add current theme class (if not default)
    const themeDef = getThemeDefinition(colorTheme)
    if (themeDef.className) {
      root.classList.add(themeDef.className)
    }

    // Add resolved color scheme class
    root.classList.add(resolvedColorScheme)
  }, [colorTheme, resolvedColorScheme])

  const value: ThemeProviderState = {
    colorScheme,
    setColorScheme,
    colorTheme,
    setColorTheme,
    resolvedColorScheme,
    // Legacy aliases
    theme: colorScheme,
    setTheme: setColorScheme,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}

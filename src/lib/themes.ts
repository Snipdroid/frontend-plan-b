/**
 * Theme registry - defines available color themes
 * Each theme has both light and dark variants managed by the color scheme toggle
 */

export interface ThemeDefinition {
  /** Display name (translation key) */
  nameKey: string
  /** CSS class to apply to html element (empty string for default) */
  className: string
  /** Preview colors for the theme picker */
  preview: {
    light: {
      primary: string
      background: string
    }
    dark: {
      primary: string
      background: string
    }
  }
}

export const themes = {
  default: {
    nameKey: "theme.themes.default",
    className: "",
    preview: {
      light: {
        primary: "oklch(0.205 0 0)",
        background: "oklch(1 0 0)",
      },
      dark: {
        primary: "oklch(0.922 0 0)",
        background: "oklch(0.145 0 0)",
      },
    },
  },
  vscode: {
    nameKey: "theme.themes.vscode",
    className: "theme-vscode",
    preview: {
      light: {
        primary: "oklch(0.71 0.15 239.15)",
        background: "oklch(0.97 0.02 225.66)",
      },
      dark: {
        primary: "oklch(0.71 0.15 239.15)",
        background: "oklch(0.18 0.02 271.27)",
      },
    },
  },
  marshmallow: {
    nameKey: "theme.themes.marshmallow",
    className: "theme-marshmallow",
    preview: {
      light: {
        primary: "oklch(0.80 0.14 348.82)",
        background: "oklch(0.97 0.01 267.41)",
      },
      dark: {
        primary: "oklch(0.80 0.14 348.82)",
        background: "oklch(0.22 0 0)",
      },
    },
  },
  twitter: {
    nameKey: "theme.themes.twitter",
    className: "theme-twitter",
    preview: {
      light: {
        primary: "oklch(0.6723 0.1606 244.9955)",
        background: "oklch(1 0 0)",
      },
      dark: {
        primary: "oklch(0.6692 0.1607 245.0110)",
        background: "oklch(0 0 0)",
      },
    },
  },
  doom64: {
    nameKey: "theme.themes.doom64",
    className: "theme-doom64",
    preview: {
      light: {
        primary: "oklch(0.5016 0.1887 27.4816)",
        background: "oklch(0.8452 0 0)",
      },
      dark: {
        primary: "oklch(0.6083 0.2090 27.0276)",
        background: "oklch(0.2178 0 0)",
      },
    },
  },
  neobrutalism: {
    nameKey: "theme.themes.neobrutalism",
    className: "theme-neobrutalism",
    preview: {
      light: {
        primary: "oklch(0.6489 0.2370 26.9728)",
        background: "oklch(1 0 0)",
      },
      dark: {
        primary: "oklch(0.7044 0.1872 23.1858)",
        background: "oklch(0 0 0)",
      },
    },
  },
} as const satisfies Record<string, ThemeDefinition>

export type ColorTheme = keyof typeof themes
export const colorThemeKeys = Object.keys(themes) as ColorTheme[]

export function getThemeDefinition(theme: ColorTheme): ThemeDefinition {
  return themes[theme]
}

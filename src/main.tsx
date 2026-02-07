import '@fontsource-variable/noto-sans-sc'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { AuthProvider } from 'react-oidc-context'
import { SWRConfig } from 'swr'
import './lib/i18n'
import './index.css'
import App from './App.tsx'
import { oidcConfig } from './lib/auth-config'
import { ThemeProvider } from './components/theme'
import { AutoSilentRenew } from './components/AutoSilentRenew'
import { Toaster } from './components/ui/sonner'
import { isWindows } from './lib/platform'
import { swrConfig, publicFetcher } from './lib/swr-config'

// Apply Windows-specific font
if (isWindows()) {
  document.documentElement.classList.add('windows-font')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultColorScheme="system">
      <AuthProvider {...oidcConfig}>
        <AutoSilentRenew />
        <SWRConfig value={{ ...swrConfig, fetcher: publicFetcher }}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </SWRConfig>
      </AuthProvider>
      <Toaster />
    </ThemeProvider>
  </StrictMode>,
)

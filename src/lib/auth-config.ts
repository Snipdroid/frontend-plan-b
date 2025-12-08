import type { AuthProviderProps } from "react-oidc-context"
import { WebStorageStateStore } from "oidc-client-ts"

export const oidcConfig: AuthProviderProps = {
  authority: import.meta.env.VITE_OIDC_AUTHORITY,
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID,
  redirect_uri: `${window.location.origin}/callback`,
  post_logout_redirect_uri: window.location.origin,
  scope: "openid profile email",
  response_type: "code",
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  onSigninCallback: () => {
    // Restore the original URL after login
    const returnUrl = sessionStorage.getItem("auth_return_url") || "/"
    sessionStorage.removeItem("auth_return_url")
    window.history.replaceState({}, document.title, returnUrl)
  },
}

export function saveReturnUrl() {
  sessionStorage.setItem("auth_return_url", window.location.pathname + window.location.search)
}

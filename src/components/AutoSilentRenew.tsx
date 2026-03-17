import { useCallback, useEffect, useRef } from "react"
import { useAuth } from "react-oidc-context"

/**
 * Supplements the built-in `automaticSilentRenew` (which relies on
 * setTimeout and only works while the tab is active) by attempting a
 * refresh-token-based `signinSilent()` when the user returns to the
 * page with an already-expired access token.
 *
 * If renewal fails (refresh token also expired), clears the dead
 * session so the user can log in again.
 */
export function AutoSilentRenew() {
  const { isLoading, user, signinSilent, removeUser, events, activeNavigator, stopSilentRenew } = useAuth()
  const renewingRef = useRef(false)
  const failedRef = useRef(false)

  const clearExpiredSession = useCallback(() => {
    stopSilentRenew()
    void removeUser()
  }, [stopSilentRenew, removeUser])

  const attemptRenew = useCallback(() => {
    if (renewingRef.current || failedRef.current || activeNavigator === "signinSilent") return

    const refreshToken = user?.refresh_token
    if (isJwtExpired(refreshToken)) {
      failedRef.current = true
      clearExpiredSession()
      return
    }

    renewingRef.current = true
    signinSilent()
      .catch(() => {
        failedRef.current = true
        clearExpiredSession()
      })
      .finally(() => { renewingRef.current = false })
  }, [activeNavigator, clearExpiredSession, signinSilent, user?.refresh_token])

  // User returned to page with an expired access token
  useEffect(() => {
    if (!isLoading && user?.expired) {
      attemptRenew()
    }
  }, [isLoading, user?.expired, attemptRenew])

  // Built-in automaticSilentRenew failed (e.g. refresh token expired)
  useEffect(() => {
    return events.addSilentRenewError(() => {
      failedRef.current = true
      clearExpiredSession()
    })
  }, [clearExpiredSession, events])

  return null
}

function isJwtExpired(token?: string) {
  if (!token) return false
  const parts = token.split(".")
  if (parts.length !== 3) return false

  try {
    const payloadSegment = parts[1]
    const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
    const payload = JSON.parse(
      atob(padded)
    ) as { exp?: number }
    return typeof payload.exp === "number" && payload.exp <= Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

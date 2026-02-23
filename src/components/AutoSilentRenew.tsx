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
  const { isLoading, user, signinSilent, removeUser, events } = useAuth()
  const renewingRef = useRef(false)
  const failedRef = useRef(false)

  const attemptRenew = useCallback(() => {
    if (renewingRef.current || failedRef.current) return
    renewingRef.current = true
    signinSilent()
      .catch(() => {
        failedRef.current = true
        removeUser()
      })
      .finally(() => { renewingRef.current = false })
  }, [signinSilent, removeUser])

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
      removeUser()
    })
  }, [events, removeUser])

  return null
}

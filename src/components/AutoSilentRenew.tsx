import { useCallback, useEffect, useRef } from "react"
import { useAuth } from "react-oidc-context"

export function AutoSilentRenew() {
  const { isLoading, user, signinSilent, removeUser, events } = useAuth()
  const renewingRef = useRef(false)
  const failedRef = useRef(false)

  const attemptRenew = useCallback(() => {
    if (renewingRef.current || failedRef.current) return
    renewingRef.current = true
    signinSilent()
      .catch(() => {
        // Refresh token is also expired — clear the dead session
        // so the user sees a logged-out state and can log in again.
        failedRef.current = true
        removeUser()
      })
      .finally(() => { renewingRef.current = false })
  }, [signinSilent, removeUser])

  useEffect(() => {
    if (!isLoading && user?.expired) {
      attemptRenew()
    }
  }, [isLoading, user?.expired, attemptRenew])

  useEffect(() => {
    return events.addAccessTokenExpired(() => attemptRenew())
  }, [events, attemptRenew])

  return null
}

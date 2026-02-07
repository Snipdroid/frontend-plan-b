import { useEffect, useRef } from "react"
import { useAuth } from "react-oidc-context"

export function AutoSilentRenew() {
  const { isLoading, user, signinSilent, events } = useAuth()
  const renewingRef = useRef(false)

  useEffect(() => {
    if (!isLoading && user?.expired && !renewingRef.current) {
      renewingRef.current = true
      signinSilent()
        .catch(() => { /* refresh token may also be expired */ })
        .finally(() => { renewingRef.current = false })
    }
  }, [isLoading, user?.expired, signinSilent])

  useEffect(() => {
    const handleExpired = () => {
      if (!renewingRef.current) {
        renewingRef.current = true
        signinSilent()
          .catch(() => { /* refresh token may also be expired */ })
          .finally(() => { renewingRef.current = false })
      }
    }
    return events.addAccessTokenExpired(handleExpired)
  }, [events, signinSilent])

  return null
}

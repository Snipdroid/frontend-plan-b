import { useEffect } from "react"
import { useAuth } from "react-oidc-context"

/**
 * Handles the case where the built-in `automaticSilentRenew` fails
 * (e.g. refresh token expired). Clears the dead session so the user
 * can log in again instead of spamming the token endpoint.
 */
export function AutoSilentRenew() {
  const { removeUser, events } = useAuth()

  useEffect(() => {
    return events.addSilentRenewError(() => {
      removeUser()
    })
  }, [events, removeUser])

  return null
}

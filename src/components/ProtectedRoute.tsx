import { useState, useEffect, useRef } from "react"
import { useAuth } from "react-oidc-context"
import { Navigate, useLocation } from "react-router"
import { saveReturnUrl } from "@/lib/auth-config"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, signinSilent } = useAuth()
  const location = useLocation()
  const [renewalFailed, setRenewalFailed] = useState(false)
  const renewingRef = useRef(false)

  const needsRenewal = !isAuthenticated && !isLoading && !!user?.expired && !renewalFailed

  useEffect(() => {
    if (!needsRenewal || renewingRef.current) return
    renewingRef.current = true
    signinSilent()
      .catch(() => setRenewalFailed(true))
      .finally(() => { renewingRef.current = false })
  }, [needsRenewal, signinSilent])

  if (isLoading || needsRenewal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    saveReturnUrl()
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return <>{children}</>
}

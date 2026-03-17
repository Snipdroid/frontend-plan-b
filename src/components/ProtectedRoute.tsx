import { useAuth } from "react-oidc-context"
import { Navigate, useLocation } from "react-router"
import { saveReturnUrl } from "@/lib/auth-config"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, activeNavigator } = useAuth()
  const location = useLocation()
  const waitingForRenewal = !!user?.expired || activeNavigator === "signinSilent"

  if (isLoading || waitingForRenewal) {
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

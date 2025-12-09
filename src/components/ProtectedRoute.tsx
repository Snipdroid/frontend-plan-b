import { useAuth } from "react-oidc-context"
import { Navigate, useLocation } from "react-router"
import { saveReturnUrl } from "@/lib/auth-config"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const auth = useAuth()
  const location = useLocation()

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!auth.isAuthenticated) {
    saveReturnUrl()
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return <>{children}</>
}

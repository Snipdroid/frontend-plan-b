import { Suspense, lazy } from "react"
import { Routes, Route } from "react-router"
import { Header } from "@/components/Header"
import { ProtectedRoute } from "@/components/ProtectedRoute"

// Lazy load pages for code splitting
const HomePage = lazy(() =>
  import("@/pages/HomePage").then((m) => ({ default: m.HomePage }))
)
const UploadPage = lazy(() =>
  import("@/pages/UploadPage").then((m) => ({ default: m.UploadPage }))
)
const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage }))
)

function PageLoader() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      {/* Public routes with Header */}
      <Route
        path="/"
        element={
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Suspense fallback={<PageLoader />}>
                <HomePage />
              </Suspense>
            </main>
          </div>
        }
      />

      {/* Upload page - public but enhanced when authenticated */}
      <Route
        path="/upload"
        element={
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Suspense fallback={<PageLoader />}>
                <UploadPage />
              </Suspense>
            </main>
          </div>
        }
      />

      {/* OIDC callback route - uses same layout as home */}
      <Route
        path="/callback"
        element={
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Suspense fallback={<PageLoader />}>
                <HomePage />
              </Suspense>
            </main>
          </div>
        }
      />

      {/* Protected dashboard routes - no Header, uses Sidebar layout */}
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <DashboardPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App

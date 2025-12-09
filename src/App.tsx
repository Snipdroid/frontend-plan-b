import { Routes, Route } from "react-router"
import { Header } from "@/components/Header"
import { HomePage } from "@/pages/HomePage"
import { DashboardPage } from "@/pages/DashboardPage"
import { ProtectedRoute } from "@/components/ProtectedRoute"

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
              <HomePage />
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
              <HomePage />
            </main>
          </div>
        }
      />

      {/* Protected dashboard routes - no Header, uses Sidebar layout */}
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App

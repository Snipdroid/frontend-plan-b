import { Header } from "@/components/Header"
import { HomePage } from "@/pages/HomePage"

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HomePage />
      </main>
    </div>
  )
}

export default App

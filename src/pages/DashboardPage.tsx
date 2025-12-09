import { Routes, Route } from "react-router"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"
import { DashboardGeneral } from "@/components/dashboard/DashboardGeneral"
import { IconPackManage } from "@/components/dashboard/IconPackManage"
import { Separator } from "@/components/ui/separator"

export function DashboardPage() {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </header>
        <div className="flex-1 p-4 md:p-6">
          <Routes>
            <Route index element={<DashboardGeneral />} />
            <Route path="icon-pack/:packId" element={<IconPackManage />} />
          </Routes>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

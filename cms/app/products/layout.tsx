import {SidebarProvider, SidebarTrigger, useSidebar} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

/*import DashboardMenuIcon from "@/public/dashboard-menu-icon.svg"*/
export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="w-full">
                {children}
            </main>
        </SidebarProvider>
    )
}

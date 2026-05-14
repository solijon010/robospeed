import { Outlet, useRouterState } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { LayoutDashboard, Users, ClipboardCheck, Trophy, Minus } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const pageMap = [
  { path: "/", label: "Bosh sahifa", icon: LayoutDashboard },
  { path: "/register", label: "Ro'yxatga olish", icon: Users },
  { path: "/evaluate", label: "Baholash", icon: ClipboardCheck },
  { path: "/rating", label: "Reyting", icon: Trophy },
];

function AppLayout() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const currentPage =
    pageMap.find((p) => (p.path === "/" ? currentPath === "/" : currentPath.startsWith(p.path))) ||
    pageMap[0];
  const CurrentIcon = currentPage.icon;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

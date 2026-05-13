import { Outlet, useRouterState } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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
          <header className="h-14 flex items-center gap-4 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-30 px-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2.5">
              <h3 className="flex gap-1">
                ROBO SPEED <Minus />
              </h3>
              <CurrentIcon className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-foreground">{currentPage.label}</span>
            </div>
          </header>
          <main className="flex-1 p-6 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

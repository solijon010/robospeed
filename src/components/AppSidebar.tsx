import { Link, useRouterState } from "@tanstack/react-router";
import { Trophy, Users, ClipboardCheck, LayoutDashboard, Zap, UserCheck } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const items = [
  { title: "Bosh sahifa", url: "/", icon: LayoutDashboard },
  { title: "Ro'yxatga olish", url: "/register", icon: Users },
  { title: "Baholash", url: "/evaluate", icon: ClipboardCheck },
  { title: "Reyting", url: "/rating", icon: Trophy },
  { title: "Hakamlar", url: "/hakamlar", icon: UserCheck },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (path: string) =>
    path === "/" ? currentPath === "/" : currentPath.startsWith(path);

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-200 shrink-0",
        collapsed ? "w-18" : "w-68"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-3 border-b border-sidebar-border", collapsed ? "px-4 py-5 justify-center" : "px-5 py-5")}>
        <div
          className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center shadow-lg"
          style={{ background: "var(--gradient-hero)" }}
        >
          <Zap className="w-6 h-6 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-extrabold text-base leading-tight tracking-wide">ROBO SPEED</div>
            <div className="text-xs text-muted-foreground leading-tight mt-0.5 tracking-widest uppercase">Challenge</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {items.map((item) => {
          const active = isActive(item.url);
          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-4 rounded-xl px-4 py-4 text-base font-semibold transition-all duration-150 group",
                collapsed && "justify-center px-0",
                active
                  ? "text-white shadow-md"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
              style={active ? { background: "var(--gradient-hero)" } : undefined}
              title={collapsed ? item.title : undefined}
            >
              <item.icon
                className={cn(
                  "w-6 h-6 shrink-0 transition-all duration-150",
                  active ? "text-white" : "text-muted-foreground group-hover:text-sidebar-foreground"
                )}
              />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-sidebar-border px-5 py-4">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Robo Speed</p>
        </div>
      )}
    </aside>
  );
}

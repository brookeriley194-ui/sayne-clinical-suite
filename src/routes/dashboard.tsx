import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { SayneLogo } from "@/components/sayne-logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutGrid, Users, FlaskConical, BarChart3, FileText, Beaker, LogOut, Home, Layers, Settings as SettingsIcon,
} from "lucide-react";
import { toast } from "sonner";
import { FloatingCalculator } from "@/components/floating-calculator";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; bottom?: boolean };

const navByRole: Record<AppRole, NavItem[]> = {
  doctor: [
    { to: "/dashboard/protocols", label: "Protocols", icon: LayoutGrid },
    { to: "/dashboard/patients", label: "Patients", icon: Users },
    { to: "/dashboard/vials", label: "Vials", icon: Beaker },
    { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  ],
  researcher: [
    { to: "/dashboard/today", label: "Today", icon: Home },
    { to: "/dashboard/my-vials", label: "My Vials", icon: Beaker },
    { to: "/dashboard/protocols", label: "My Stacks", icon: Layers },
    { to: "/dashboard/settings", label: "Settings", icon: SettingsIcon, bottom: true },
  ],
};

function DashboardLayout() {
  const { user, role, loading, session } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login", replace: true });
  }, [loading, session, navigate]);

  // Redirect to first nav item when landing on /dashboard
  const items = useMemo(() => (role ? navByRole[role] : []), [role]);
  useEffect(() => {
    if (pathname === "/dashboard" && items.length) {
      navigate({ to: items[0].to, replace: true });
    }
  }, [pathname, items, navigate]);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/login", replace: true });
  }

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const initial = (user?.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r p-4 hidden md:flex md:flex-col gap-1"
             style={{ backgroundColor: "var(--sidebar)", borderColor: "color-mix(in oklab, var(--border) 60%, transparent)" }}>
        <div className="px-2 py-3 mb-2">
          <SayneLogo />
        </div>
        <nav className="flex flex-col gap-1">
          {items.filter((it) => !it.bottom).map((it) => {
            const active = pathname === it.to;
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-colors"
                style={{
                  backgroundColor: active ? "var(--panel)" : "transparent",
                  color: active ? "var(--foreground)" : "var(--muted-foreground)",
                }}
              >
                <Icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <nav className="mt-auto flex flex-col gap-1">
          {items.filter((it) => it.bottom).map((it) => {
            const active = pathname === it.to;
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-colors"
                style={{
                  backgroundColor: active ? "var(--panel)" : "transparent",
                  color: active ? "var(--foreground)" : "var(--muted-foreground)",
                }}
              >
                <Icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b flex items-center justify-between px-6"
                style={{ backgroundColor: "var(--card)", borderColor: "color-mix(in oklab, var(--border) 60%, transparent)" }}>
          <div className="md:hidden"><SayneLogo /></div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-muted-foreground font-mono">{user?.email}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full focus:outline-none focus:ring-2"
                        style={{ outlineColor: "var(--primary)" }}>
                  <Avatar className="h-9 w-9" style={{ backgroundColor: "var(--panel)" }}>
                    <AvatarFallback style={{ backgroundColor: "var(--panel)", color: "var(--foreground)" }} className="font-medium">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="text-xs text-muted-foreground">Signed in as</div>
                  <div className="text-sm font-medium truncate">{user?.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

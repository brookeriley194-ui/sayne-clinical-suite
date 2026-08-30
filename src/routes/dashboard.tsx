import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  LayoutGrid, Users, FlaskConical, BarChart3, FileText, Beaker, LogOut, Home, Layers, Settings as SettingsIcon, Users2, BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { FloatingCalculator } from "@/components/floating-calculator";
import { Tutorial, TUTORIAL_FLAG, CompletionChoice } from "@/components/tutorial";
import { InstallBanner } from "@/components/install-banner";
import { SayneFooter } from "@/components/sayne-footer";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; bottom?: boolean; accent?: string };

const navByRole: Record<AppRole, NavItem[]> = {
  doctor: [
    { to: "/dashboard/protocols", label: "Protocols", icon: LayoutGrid },
    { to: "/dashboard/patients", label: "Patients", icon: Users },
    { to: "/dashboard/vials", label: "Vials", icon: Beaker },
    { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/dashboard/stack-feed", label: "Stack Feed", icon: Users2, accent: "#C9A8F5" },
  ],
  researcher: [
    { to: "/dashboard/today", label: "Today", icon: Home },
    { to: "/dashboard/my-vials", label: "My Vials", icon: Beaker },
    { to: "/dashboard/protocols", label: "My Stacks", icon: Layers },
    { to: "/dashboard/stack-feed", label: "Stack Feed", icon: Users2, accent: "#C9A8F5" },
    { to: "/getting-started", label: "Guide", icon: BookOpen, bottom: true },
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

  // First-login tutorial trigger: created <5min ago AND zero vials AND not completed
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStart, setTutorialStart] = useState(0);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        if (localStorage.getItem(TUTORIAL_FLAG) === "true") return;
        const created = user.created_at ? new Date(user.created_at).getTime() : 0;
        if (!created || Date.now() - created > 5 * 60 * 1000) return;
        const { count } = await supabase
          .from("vials")
          .select("*", { count: "exact", head: true });
        if (!cancelled && (count ?? 0) === 0) setPendingTutorial(true);
      } catch { /* noop */ }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // "Where do you want to start?" — shown once per login session
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [pendingTutorial, setPendingTutorial] = useState(false);
  useEffect(() => {
    if (!user) return;
    try {
      if (sessionStorage.getItem("sayne_start_choice_shown") === "true") return;
      sessionStorage.setItem("sayne_start_choice_shown", "true");
    } catch { /* noop */ }
    setChoiceOpen(true);
  }, [user]);

  // Global event so any page can re-open the tutorial without unmounting it on navigation.
  // Optional event detail { step: number } jumps directly to that step.
  useEffect(() => {
    const handler = (e: Event) => {
      const step = (e as CustomEvent<{ step?: number }>).detail?.step ?? 0;
      setTutorialStart(step);
      setTutorialOpen(true);
    };
    window.addEventListener("sayne:open-tutorial", handler as EventListener);
    return () => window.removeEventListener("sayne:open-tutorial", handler as EventListener);
  }, []);

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
    <div className="min-h-[100dvh] md:h-screen flex bg-background">
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
                <Icon className="h-4 w-4" style={it.accent ? { color: it.accent } : undefined} />
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
        <header className="h-16 border-b flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 md:static"
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

        <main
          className="flex-1 p-4 md:p-8 md:overflow-auto"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)" }}
        >
          <Outlet />
          <SayneFooter />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t flex items-stretch"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {items.map((it) => {
          const active = pathname === it.to;
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className="flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium"
              style={{ color: active ? "var(--foreground)" : "var(--muted-foreground)" }}
            >
              <Icon className="h-5 w-5" style={it.accent ? { color: it.accent } : undefined} />
              <span className="truncate max-w-full px-1">{it.label}</span>
            </Link>
          );
        })}
      </nav>

      <FloatingCalculator />
      <InstallBanner />
      <Tutorial open={tutorialOpen} startStep={tutorialStart} onClose={() => setTutorialOpen(false)} />
      {choiceOpen && (
        <CompletionChoice
          onClose={() => {
            setChoiceOpen(false);
            if (pendingTutorial) { setPendingTutorial(false); setTutorialStart(0); setTutorialOpen(true); }
          }}
        />
      )}
    </div>
  );
}

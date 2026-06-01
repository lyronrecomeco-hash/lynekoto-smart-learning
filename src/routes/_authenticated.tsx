import { createFileRoute, redirect, Outlet, useRouterState, Link } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: AuthenticatedLayout,
});

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  studio: "Studio",
  library: "Biblioteca",
  classes: "Turmas",
  students: "Alunos",
  scan: "QR Scan",
  analytics: "Analytics",
  achievements: "Conquistas",
  settings: "Configurações",
  present: "Apresentação",
};

function AuthenticatedLayout() {
  const path = useRouterState({ select: (r) => r.location.pathname });

  // Full-bleed routes (no sidebar/header chrome)
  const isFullBleed = path.startsWith("/present/") || /^\/studio\/[^/]+$/.test(path);

  if (isFullBleed) {
    return <Outlet />;
  }

  const segments = path.split("/").filter(Boolean);
  const current = segments[0] ? ROUTE_LABELS[segments[0]] ?? segments[0] : "Dashboard";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-canvas">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <Header current={current} />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Header({ current }: { current: string }) {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 lg:px-6 backdrop-blur-xl">
      <SidebarTrigger className="h-8 w-8" />
      <div className="h-5 w-px bg-border" />
      <nav className="flex items-center gap-1.5 text-sm">
        <span className="text-muted-foreground">LyneKoto</span>
        <span className="text-muted-foreground/40">/</span>
        <span className="font-medium text-foreground">{current}</span>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar projetos, alunos..."
            className="h-9 w-64 pl-8 bg-surface border-border"
          />
        </div>
        <Button asChild size="sm" className="h-9 bg-gradient-primary shadow-soft">
          <Link to="/studio"><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Novo</Link>
        </Button>
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={toggle} aria-label="Alternar tema">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}

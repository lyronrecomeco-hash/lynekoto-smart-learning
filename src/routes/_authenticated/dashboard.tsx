import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sparkles, Library, GraduationCap, Users, ArrowRight, Activity,
  Plus, Clock, Play,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LyneKoto" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [a, c, s, ss] = await Promise.all([
        supabase.from("activities").select("*", { count: "exact", head: true }),
        supabase.from("classes").select("*", { count: "exact", head: true }),
        supabase.from("students").select("*", { count: "exact", head: true }),
        supabase.from("sessions").select("*", { count: "exact", head: true }),
      ]);
      return {
        activities: a.count ?? 0, classes: c.count ?? 0,
        students: s.count ?? 0, sessions: ss.count ?? 0,
      };
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["dashboard-recent"],
    queryFn: async () => {
      const { data } = await supabase.from("activities")
        .select("*").order("updated_at", { ascending: false }).limit(6);
      return data ?? [];
    },
  });

  const kpis = [
    { label: "Projetos", value: stats?.activities ?? 0, icon: Library, tone: "primary" },
    { label: "Turmas", value: stats?.classes ?? 0, icon: GraduationCap, tone: "success" },
    { label: "Alunos", value: stats?.students ?? 0, icon: Users, tone: "warning" },
    { label: "Sessões", value: stats?.sessions ?? 0, icon: Activity, tone: "accent" },
  ];

  return (
    <div className="px-6 lg:px-10 py-8 space-y-8">
      {/* Title row */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold tracking-tight">Visão geral</h1>
          <p className="mt-1 text-sm text-muted-foreground">O que está acontecendo no seu workspace hoje.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="h-9"><Link to="/library">Biblioteca <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
          <Button asChild className="h-9 bg-gradient-primary shadow-soft"><Link to="/studio"><Plus className="mr-1.5 h-3.5 w-3.5" /> Novo projeto</Link></Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5 border-border bg-surface hover:border-strong transition-smooth">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{k.label}</span>
              <k.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3 font-display text-3xl font-bold tabular-nums">{k.value}</div>
          </Card>
        ))}
      </div>

      {/* Main grid 12 col */}
      <div className="grid grid-cols-12 gap-6">
        {/* Recent projects — col 8 */}
        <Card className="col-span-12 lg:col-span-8 border-border bg-surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-display text-base font-semibold">Projetos recentes</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Última edição primeiro</p>
            </div>
            <Button variant="ghost" size="sm" asChild><Link to="/studio">Ver todos</Link></Button>
          </div>
          {!recent || recent.length === 0 ? (
            <EmptyRecent />
          ) : (
            <div className="divide-y divide-border">
              {recent.map((a: any) => (
                <Link key={a.id} to="/studio/$id" params={{ id: a.id }} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-smooth group">
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-primary-foreground font-display text-sm font-bold"
                    style={{ background: a.cover_color ?? "linear-gradient(135deg, oklch(0.55 0.2 268), oklch(0.65 0.2 290))" }}
                  >
                    {a.title?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{a.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>{a.subject ?? "—"}</span>
                      {a.grade && <><span className="opacity-40">·</span><span>{a.grade}</span></>}
                      <span className="opacity-40">·</span>
                      <span>{(a.questions?.length ?? 0)} blocos</span>
                    </div>
                  </div>
                  <StatusBadge status={a.status ?? "draft"} />
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Side col 4 */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <Card className="p-5 border-border bg-surface">
            <h3 className="font-display text-sm font-semibold">Atalhos</h3>
            <div className="mt-4 grid gap-2">
              <QuickAction to="/studio" icon={Sparkles} label="Criar projeto no Studio" />
              <QuickAction to="/classes" icon={GraduationCap} label="Cadastrar nova turma" />
              <QuickAction to="/students" icon={Users} label="Adicionar alunos" />
            </div>
          </Card>

          <Card className="p-5 border-border bg-gradient-hero text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
                <Sparkles className="h-3 w-3" /> Studio IA
              </div>
              <h3 className="mt-3 font-display text-lg font-bold leading-tight">Crie um quiz completo em segundos</h3>
              <p className="mt-1.5 text-xs text-white/70">Descreva o tema e a IA monta blocos prontos no canvas.</p>
              <Button asChild size="sm" className="mt-4 bg-white text-primary hover:bg-white/90 shadow-glow">
                <Link to="/studio"><Play className="mr-1.5 h-3 w-3" /> Abrir Studio</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: "Rascunho", cls: "bg-muted text-muted-foreground" },
    ready: { label: "Pronto", cls: "bg-success/15 text-success" },
    applied: { label: "Aplicado", cls: "bg-primary/15 text-primary" },
  };
  const s = map[status] ?? map.draft;
  return <span className={`hidden md:inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.cls}`}>{s.label}</span>;
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm hover:border-primary/40 hover:bg-accent/40 transition-smooth">
      <Icon className="h-4 w-4 text-primary" />
      <span className="flex-1">{label}</span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
    </Link>
  );
}

function EmptyRecent() {
  return (
    <div className="px-5 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
        <Sparkles className="h-5 w-5 text-accent-foreground" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">Você ainda não criou projetos.</p>
      <Button asChild className="mt-4 bg-gradient-primary"><Link to="/studio">Criar o primeiro</Link></Button>
    </div>
  );
}

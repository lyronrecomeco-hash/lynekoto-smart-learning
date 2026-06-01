import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Library, GraduationCap, Users, ArrowRight, TrendingUp, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LyneKoto" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [{ count: activities }, { count: classes }, { count: students }, { count: sessions }] = await Promise.all([
        supabase.from("activities").select("*", { count: "exact", head: true }),
        supabase.from("classes").select("*", { count: "exact", head: true }),
        supabase.from("students").select("*", { count: "exact", head: true }),
        supabase.from("sessions").select("*", { count: "exact", head: true }),
      ]);
      return { activities: activities ?? 0, classes: classes ?? 0, students: students ?? 0, sessions: sessions ?? 0 };
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["recent-activities"],
    queryFn: async () => {
      const { data } = await supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  const cards = [
    { label: "Atividades", value: stats?.activities ?? 0, icon: Library, hint: "criadas" },
    { label: "Turmas", value: stats?.classes ?? 0, icon: GraduationCap, hint: "ativas" },
    { label: "Alunos", value: stats?.students ?? 0, icon: Users, hint: "cadastrados" },
    { label: "Sessões", value: stats?.sessions ?? 0, icon: Activity, hint: "aplicadas" },
  ];

  return (
    <div className="container max-w-7xl mx-auto p-6 md:p-8 space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-8 text-white shadow-elegant">
        <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
        <div className="relative">
          <div className="text-xs font-medium uppercase tracking-wider text-white/60">Bem-vindo de volta</div>
          <h1 className="mt-2 font-display text-3xl md:text-4xl font-bold">Pronto para criar algo incrível hoje?</h1>
          <p className="mt-2 max-w-xl text-white/70">Use o Studio IA para gerar uma nova atividade em segundos ou continue de onde parou.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
              <Link to="/studio"><Sparkles className="mr-2 h-4 w-4" /> Criar com IA</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
              <Link to="/library">Ver biblioteca <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5 shadow-soft hover:shadow-elegant transition-smooth">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <c.icon className="h-5 w-5 text-accent-foreground" />
              </div>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div className="mt-4 font-display text-3xl font-bold">{c.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{c.label} {c.hint}</div>
          </Card>
        ))}
      </div>

      {/* Recent */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold">Atividades recentes</h2>
          <Button variant="ghost" asChild size="sm"><Link to="/library">Ver todas</Link></Button>
        </div>
        {!recent || recent.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">Nenhuma atividade ainda. Crie sua primeira no Studio IA.</p>
            <Button asChild className="mt-4 bg-gradient-primary"><Link to="/studio">Criar agora</Link></Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recent.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground font-display text-sm font-bold">
                    {a.subject?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{a.title}</div>
                    <div className="text-xs text-muted-foreground">{a.subject} · {a.grade} · {(a.questions?.length ?? 0)} questões</div>
                  </div>
                </div>
                <Button size="sm" variant="ghost" asChild><Link to="/present/$id" params={{ id: a.id }}>Apresentar</Link></Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

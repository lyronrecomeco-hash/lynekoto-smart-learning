import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, Brain, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — LyneKoto" }] }),
  component: () => (
    <div className="container max-w-7xl mx-auto p-8">
      <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
        <Brain className="h-3 w-3" /> Learning Analytics
      </div>
      <h1 className="mt-3 font-display text-3xl font-bold">Análise pedagógica</h1>
      <p className="mt-1 text-sm text-muted-foreground">Insights gerados por IA sobre o desempenho das suas turmas.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          { i: BarChart3, t: "Taxa média de acerto", v: "—%" },
          { i: TrendingUp, t: "Evolução mensal", v: "—" },
          { i: Users, t: "Alunos em risco", v: "—" },
        ].map((s, i) => (
          <Card key={i} className="p-6">
            <s.i className="h-5 w-5 text-primary" />
            <div className="mt-4 font-display text-3xl font-bold">{s.v}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.t}</div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-16 text-center border-dashed">
        <Brain className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">Aplique sua primeira sessão ao vivo para ver análises detalhadas.</p>
      </Card>
    </div>
  ),
});

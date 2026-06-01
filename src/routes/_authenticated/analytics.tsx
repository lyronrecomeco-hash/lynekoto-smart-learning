import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, Brain, Users, Target } from "lucide-react";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — LyneKoto" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-data"],
    queryFn: async () => {
      const [sessionsRes, responsesRes, studentsRes, classesRes] = await Promise.all([
        supabase.from("sessions").select("id, created_at, status"),
        supabase.from("responses").select("is_correct, response_time_ms, created_at, session_id"),
        supabase.from("students").select("id"),
        supabase.from("classes").select("id, name"),
      ]);
      return {
        sessions: sessionsRes.data ?? [],
        responses: responsesRes.data ?? [],
        students: studentsRes.data ?? [],
        classes: classesRes.data ?? [],
      };
    },
  });

  const totalResponses = data?.responses.length ?? 0;
  const correctRate = totalResponses
    ? Math.round((data!.responses.filter((r: any) => r.is_correct).length / totalResponses) * 100)
    : 0;
  const avgTime = totalResponses
    ? Math.round(
        data!.responses.reduce((s: number, r: any) => s + (r.response_time_ms ?? 0), 0) /
          totalResponses /
          1000
      )
    : 0;

  // Daily trend (last 7 days)
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const trend = days.map((d) => {
    const key = d.toISOString().slice(0, 10);
    const dayResp = (data?.responses ?? []).filter((r: any) =>
      r.created_at.startsWith(key)
    );
    const correct = dayResp.filter((r: any) => r.is_correct).length;
    return {
      day: d.toLocaleDateString("pt-BR", { weekday: "short" }),
      respostas: dayResp.length,
      acertos: correct,
    };
  });

  const pie = [
    { name: "Acertos", value: data?.responses.filter((r: any) => r.is_correct).length ?? 0 },
    { name: "Erros", value: data?.responses.filter((r: any) => r.is_correct === false).length ?? 0 },
  ];
  const COLORS = ["oklch(0.62 0.16 155)", "oklch(0.58 0.22 25)"];

  return (
    <div className="px-6 lg:px-10 py-8">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
          <Brain className="h-3 w-3" /> Learning Analytics
        </div>
        <h1 className="mt-2 font-display text-2xl lg:text-3xl font-bold tracking-tight">
          Análise pedagógica
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Indicadores reais agregados das suas sessões aplicadas.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <KPI icon={Target} label="Taxa de acerto" value={`${correctRate}%`} accent="success" loading={isLoading} />
        <KPI icon={BarChart3} label="Respostas registradas" value={String(totalResponses)} loading={isLoading} />
        <KPI icon={TrendingUp} label="Tempo médio (s)" value={String(avgTime)} loading={isLoading} />
        <KPI icon={Users} label="Alunos cadastrados" value={String(data?.students.length ?? 0)} loading={isLoading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-2 border-border bg-surface p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Tendência semanal</h3>
              <p className="text-xs text-muted-foreground">Respostas e acertos por dia</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="respostas" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="acertos" stroke="var(--success)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-2 border-border bg-surface p-5">
          <h3 className="font-display text-lg font-semibold">Distribuição</h3>
          <p className="text-xs text-muted-foreground">Acertos vs erros</p>
          <div className="h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {pie.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success" /> Acertos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-destructive" /> Erros
            </span>
          </div>
        </Card>

        <Card className="border-2 border-border bg-surface p-5 lg:col-span-3">
          <h3 className="font-display text-lg font-semibold mb-4">Volume por dia</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="respostas" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

function KPI({
  icon: Icon, label, value, accent, loading,
}: { icon: any; label: string; value: string; accent?: string; loading?: boolean }) {
  return (
    <Card className="border-2 border-border bg-surface p-5">
      <Icon className={`h-5 w-5 ${accent === "success" ? "text-success" : "text-primary"}`} />
      <div className="mt-4 font-display text-3xl font-bold">{loading ? "—" : value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </Card>
  );
}

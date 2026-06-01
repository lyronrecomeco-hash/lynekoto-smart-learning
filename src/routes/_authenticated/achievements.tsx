import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flame, Star, Crown, Medal, Zap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/achievements")({
  head: () => ({ meta: [{ title: "Conquistas — LyneKoto" }] }),
  component: AchievementsPage,
});

const BADGES = [
  { id: "first", icon: Star, name: "Primeira resposta", desc: "Respondeu seu primeiro quiz", min: 1 },
  { id: "ten", icon: Zap, name: "Decuplicado", desc: "10 respostas registradas", min: 10 },
  { id: "fifty", icon: Flame, name: "Em chamas", desc: "50 respostas registradas", min: 50 },
  { id: "hundred", icon: Medal, name: "Centena", desc: "100 respostas", min: 100 },
  { id: "perfect", icon: Crown, name: "Perfeito", desc: "100% de acertos numa sessão", min: 0, kind: "perfect" },
  { id: "speed", icon: Trophy, name: "Velocista", desc: "Resposta em menos de 5s", min: 0, kind: "speed" },
];

function AchievementsPage() {
  const { data } = useQuery({
    queryKey: ["gamification"],
    queryFn: async () => {
      const [studentsRes, responsesRes] = await Promise.all([
        supabase.from("students").select("id, full_name, class_id"),
        supabase.from("responses").select("student_id, is_correct, response_time_ms, session_id"),
      ]);
      const students = studentsRes.data ?? [];
      const responses = responsesRes.data ?? [];
      const byStudent = new Map<string, { name: string; xp: number; correct: number; total: number; fastest: number }>();
      for (const s of students)
        byStudent.set(s.id, { name: s.full_name, xp: 0, correct: 0, total: 0, fastest: Infinity });
      for (const r of responses) {
        const e = byStudent.get(r.student_id);
        if (!e) continue;
        e.total++;
        if (r.is_correct) {
          e.correct++;
          e.xp += 10;
        }
        if (r.response_time_ms && r.response_time_ms < e.fastest) e.fastest = r.response_time_ms;
      }
      const ranking = Array.from(byStudent.entries())
        .map(([id, v]) => ({ id, ...v, level: Math.floor(v.xp / 100) + 1 }))
        .sort((a, b) => b.xp - a.xp);
      return { ranking, totalResponses: responses.length };
    },
  });

  const top = data?.ranking.slice(0, 10) ?? [];
  const total = data?.totalResponses ?? 0;
  const unlocked = new Set<string>();
  BADGES.forEach((b) => {
    if (b.kind === "perfect" && (data?.ranking ?? []).some((r) => r.total > 0 && r.correct === r.total))
      unlocked.add(b.id);
    else if (b.kind === "speed" && (data?.ranking ?? []).some((r) => r.fastest < 5000)) unlocked.add(b.id);
    else if (!b.kind && total >= b.min) unlocked.add(b.id);
  });

  return (
    <div className="px-6 lg:px-10 py-8">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
          <Trophy className="h-3 w-3" /> Gamificação
        </div>
        <h1 className="mt-2 font-display text-2xl lg:text-3xl font-bold tracking-tight">
          Conquistas & Ranking
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          XP automático: cada acerto vale 10 pontos. A cada 100 XP, sobe de nível.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        {BADGES.map((b) => {
          const got = unlocked.has(b.id);
          const Icon = b.icon;
          return (
            <Card
              key={b.id}
              className={`border-2 p-5 transition-smooth ${
                got
                  ? "border-primary/40 bg-gradient-subtle shadow-soft"
                  : "border-border bg-surface opacity-60"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    got ? "bg-gradient-primary shadow-glow" : "bg-muted"
                  }`}
                >
                  <Icon className={`h-6 w-6 ${got ? "text-primary-foreground" : "text-muted-foreground"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold">{b.name}</h3>
                    {got && <Badge className="bg-success text-white">Desbloqueado</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{b.desc}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="border-2 border-border bg-surface overflow-hidden">
        <div className="px-5 py-4 border-b-2 border-border flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Ranking de alunos</h3>
          <Badge variant="outline" className="border-border-strong">Top 10</Badge>
        </div>
        {top.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Nenhum aluno pontuou ainda. Aplique uma sessão ao vivo para começar.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left w-12">#</th>
                <th className="px-5 py-3 text-left">Aluno</th>
                <th className="px-5 py-3 text-left">Nível</th>
                <th className="px-5 py-3 text-left">XP</th>
                <th className="px-5 py-3 text-left">Acerto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {top.map((r, i) => (
                <tr key={r.id} className="hover:bg-accent/30 transition-smooth">
                  <td className="px-5 py-3 font-display font-bold text-muted-foreground">{i + 1}</td>
                  <td className="px-5 py-3 font-medium">{r.name}</td>
                  <td className="px-5 py-3">
                    <Badge className="bg-gradient-primary text-primary-foreground">Lv {r.level}</Badge>
                  </td>
                  <td className="px-5 py-3 font-mono">{r.xp}</td>
                  <td className="px-5 py-3 text-xs">
                    {r.total > 0 ? `${Math.round((r.correct / r.total) * 100)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

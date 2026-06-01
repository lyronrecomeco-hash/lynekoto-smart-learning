import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/achievements")({
  head: () => ({ meta: [{ title: "Conquistas — LyneKoto" }] }),
  component: () => (
    <div className="container max-w-7xl mx-auto p-8">
      <h1 className="font-display text-3xl font-bold">Conquistas e Gamificação</h1>
      <p className="mt-1 text-sm text-muted-foreground">XP, níveis, medalhas e missões dos seus alunos.</p>
      <Card className="mt-8 p-16 text-center border-dashed">
        <Trophy className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">Sistema de gamificação ativado automaticamente após primeiras sessões.</p>
      </Card>
    </div>
  ),
});

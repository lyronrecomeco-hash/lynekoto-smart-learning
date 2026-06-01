import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/students")({
  head: () => ({ meta: [{ title: "Alunos — LyneKoto" }] }),
  component: () => (
    <div className="container max-w-7xl mx-auto p-8">
      <h1 className="font-display text-3xl font-bold">Alunos</h1>
      <p className="mt-1 text-sm text-muted-foreground">Gerencie alunos por turma e seus QR Cards.</p>
      <Card className="mt-8 p-16 text-center border-dashed">
        <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">Crie uma turma primeiro para começar a adicionar alunos.</p>
      </Card>
    </div>
  ),
});

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Library, Plus, Play, Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({ meta: [{ title: "Biblioteca — LyneKoto" }] }),
  component: LibraryPage,
});

function LibraryPage() {
  const [q, setQ] = useState("");
  const { data: items, isLoading } = useQuery({
    queryKey: ["activities-list"],
    queryFn: async () => {
      const { data } = await supabase.from("activities").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const filtered = items?.filter((a: any) => a.title?.toLowerCase().includes(q.toLowerCase()) || a.subject?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="container max-w-7xl mx-auto p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Biblioteca</h1>
          <p className="mt-1 text-sm text-muted-foreground">Todas as suas atividades organizadas e prontas para aplicar.</p>
        </div>
        <Button asChild className="bg-gradient-primary"><Link to="/studio"><Plus className="mr-2 h-4 w-4" /> Nova atividade</Link></Button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título ou matéria..." className="pl-9" />
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      ) : !filtered || filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-16 text-center border-dashed">
          <Library className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">Nenhuma atividade encontrada.</p>
          <Button asChild className="mt-4 bg-gradient-primary"><Link to="/studio">Criar primeira</Link></Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a: any) => (
            <Card key={a.id} className="group p-5 hover:shadow-elegant transition-smooth cursor-pointer">
              <div className="flex h-24 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground font-display text-3xl font-bold">
                {a.subject?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="mt-4">
                <div className="text-xs font-mono uppercase text-muted-foreground">{a.activity_type}</div>
                <h3 className="mt-1 font-semibold truncate">{a.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{a.subject} · {a.grade} · {(a.questions?.length ?? 0)} questões</p>
              </div>
              <Button asChild size="sm" className="mt-4 w-full bg-gradient-primary opacity-0 group-hover:opacity-100 transition-smooth">
                <Link to="/present/$id" params={{ id: a.id }}><Play className="mr-2 h-3 w-3" /> Apresentar</Link>
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

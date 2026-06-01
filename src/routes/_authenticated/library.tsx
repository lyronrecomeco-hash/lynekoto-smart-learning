import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Library, Plus, Play, Search, Pencil } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({ meta: [{ title: "Biblioteca — LyneKoto" }] }),
  component: LibraryPage,
});

function LibraryPage() {
  const [q, setQ] = useState("");
  const { data: items, isLoading } = useQuery({
    queryKey: ["library-activities"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activities")
        .select("*")
        .order("updated_at", { ascending: false });
      return data ?? [];
    },
  });
  const filtered = (items ?? []).filter(
    (a: any) =>
      a.title?.toLowerCase().includes(q.toLowerCase()) ||
      a.subject?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="px-6 lg:px-10 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
            <Library className="h-3 w-3" /> Biblioteca
          </div>
          <h1 className="mt-2 font-display text-2xl lg:text-3xl font-bold tracking-tight">
            Todas as suas atividades
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Atividades criadas no Studio, prontas para aplicar em sala.
          </p>
        </div>
        <Button asChild className="h-9 bg-gradient-primary shadow-soft">
          <Link to="/studio">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Nova atividade
          </Link>
        </Button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por título ou matéria..."
          className="h-9 pl-9 bg-surface border-border-strong"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl border-2 border-border bg-surface animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-2 border-dashed border-border-strong bg-surface/50 p-16 text-center">
          <Library className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">Nenhuma atividade encontrada.</p>
          <Button asChild className="mt-4 bg-gradient-primary">
            <Link to="/studio">Criar primeira</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((a: any) => (
            <Card
              key={a.id}
              className="group overflow-hidden border-2 border-border bg-surface hover:border-primary/50 hover:shadow-soft transition-smooth"
            >
              <div
                className="relative h-24"
                style={{
                  background:
                    a.cover_color ??
                    "linear-gradient(135deg, oklch(0.55 0.2 268), oklch(0.65 0.22 300))",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <span className="absolute top-2 left-3 rounded-md bg-white/25 backdrop-blur px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                  {a.activity_type}
                </span>
                <div className="absolute bottom-2 left-3 font-display text-2xl font-bold text-white drop-shadow">
                  {a.title?.[0]?.toUpperCase() ?? "?"}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm truncate">{a.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground truncate">
                  {a.subject ?? "—"} {a.grade && `· ${a.grade}`} ·{" "}
                  {(a.questions as any[])?.length ?? 0} blocos
                </p>
                <div className="mt-4 flex gap-2">
                  <Button asChild size="sm" variant="outline" className="flex-1 h-8 border-border-strong">
                    <Link to="/studio/$id" params={{ id: a.id }}>
                      <Pencil className="mr-1 h-3 w-3" /> Editar
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1 h-8 bg-gradient-primary">
                    <Link to="/present/$id" params={{ id: a.id }}>
                      <Play className="mr-1 h-3 w-3" /> Aplicar
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

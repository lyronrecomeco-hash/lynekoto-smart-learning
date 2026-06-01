import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { GraduationCap, Plus, Users, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/classes")({
  head: () => ({ meta: [{ title: "Turmas — LyneKoto" }] }),
  component: ClassesPage,
});

function ClassesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", grade: "", subject: "" });

  const { data: classes, isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("classes")
        .select("*, students(count)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase
      .from("classes")
      .insert({ ...form, teacher_id: u.user.id });
    if (error) toast.error(error.message);
    else {
      toast.success("Turma criada!");
      setOpen(false);
      setForm({ name: "", grade: "", subject: "" });
      qc.invalidateQueries({ queryKey: ["classes"] });
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir turma? Todos os alunos vinculados serão removidos.")) return;
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Turma removida");
      qc.invalidateQueries({ queryKey: ["classes"] });
    }
  };

  return (
    <div className="px-6 lg:px-10 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
            <GraduationCap className="h-3 w-3" /> Sala de aula
          </div>
          <h1 className="mt-2 font-display text-2xl lg:text-3xl font-bold tracking-tight">Turmas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize suas turmas e seus alunos.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-9 bg-gradient-primary shadow-soft">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Nova turma
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Criar nova turma</DialogTitle>
            </DialogHeader>
            <form onSubmit={create} className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="7º Ano A — Manhã"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Série</Label>
                  <Input
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    placeholder="7º Ano"
                  />
                </div>
                <div>
                  <Label>Disciplina</Label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Matemática"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-primary">Criar turma</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 rounded-xl border-2 border-border bg-surface animate-pulse" />
          ))}
        </div>
      ) : !classes || classes.length === 0 ? (
        <Card className="border-2 border-dashed border-border-strong bg-surface/50 p-16 text-center">
          <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">Nenhuma turma ainda.</p>
          <Button onClick={() => setOpen(true)} className="mt-4 bg-gradient-primary">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Criar primeira turma
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c: any) => (
            <Card
              key={c.id}
              className="group border-2 border-border bg-surface p-5 hover:border-primary/50 hover:shadow-soft transition-smooth"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                  onClick={() => remove(c.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Link to="/students" search={{ class: c.id } as any} className="block mt-4">
                <h3 className="font-display text-lg font-semibold hover:text-primary transition-smooth">
                  {c.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {c.grade ?? "—"} {c.subject && `· ${c.subject}`}
                </p>
              </Link>
              <div className="mt-4 flex items-center justify-between border-t-2 border-border pt-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" /> {c.students?.[0]?.count ?? 0} alunos
                </span>
                <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                  <Link to="/students">Gerenciar</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

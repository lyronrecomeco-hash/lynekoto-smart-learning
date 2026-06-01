import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GraduationCap, Plus, Users } from "lucide-react";
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

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("*, students(count)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("classes").insert({ ...form, teacher_id: u.user.id });
    if (error) toast.error(error.message);
    else { toast.success("Turma criada!"); setOpen(false); setForm({ name: "", grade: "", subject: "" }); qc.invalidateQueries({ queryKey: ["classes"] }); }
  };

  return (
    <div className="container max-w-7xl mx-auto p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Turmas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie suas turmas e alunos.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-primary"><Plus className="mr-2 h-4 w-4" /> Nova turma</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar turma</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-4">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required placeholder="7º Ano A" /></div>
              <div><Label>Série</Label><Input value={form.grade} onChange={(e) => setForm({...form, grade: e.target.value})} placeholder="7º Ano" /></div>
              <div><Label>Disciplina</Label><Input value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} placeholder="Matemática" /></div>
              <Button type="submit" className="w-full bg-gradient-primary">Criar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!classes || classes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-16 text-center border-dashed">
          <GraduationCap className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">Nenhuma turma ainda.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c: any) => (
            <Card key={c.id} className="p-5 hover:shadow-elegant transition-smooth">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground"><GraduationCap className="h-5 w-5" /></div>
              <h3 className="mt-4 font-display text-lg font-semibold">{c.name}</h3>
              <p className="text-xs text-muted-foreground">{c.grade} · {c.subject}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3" /> {c.students?.[0]?.count ?? 0} alunos
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

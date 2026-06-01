import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Sparkles, MoreHorizontal, Play, Copy, Trash2, Pencil, LayoutGrid } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/studio")({
  head: () => ({ meta: [{ title: "Studio — LyneKoto" }] }),
  component: StudioList,
});

const COVERS = [
  "linear-gradient(135deg, oklch(0.32 0.08 268), oklch(0.42 0.10 282))",
  "linear-gradient(135deg, oklch(0.30 0.05 230), oklch(0.40 0.08 245))",
  "linear-gradient(135deg, oklch(0.34 0.07 165), oklch(0.44 0.08 180))",
  "linear-gradient(135deg, oklch(0.38 0.09 40), oklch(0.46 0.10 55))",
  "linear-gradient(135deg, oklch(0.22 0.02 260), oklch(0.30 0.03 270))",
  "linear-gradient(135deg, oklch(0.32 0.06 320), oklch(0.40 0.07 340))",
];

function StudioList() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["studio-projects"],
    queryFn: async () => {
      const { data } = await supabase.from("activities")
        .select("*").order("updated_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = (projects ?? []).filter((p: any) => {
    const matchQ = !q || p.title?.toLowerCase().includes(q.toLowerCase()) || p.subject?.toLowerCase().includes(q.toLowerCase());
    const matchType = typeFilter === "all" || p.activity_type === typeFilter;
    return matchQ && matchType;
  });

  const handleCreate = async (payload: { title: string; subject: string; grade: string; activity_type: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Sessão expirada"); return; }
    const cover = COVERS[Math.floor(Math.random() * COVERS.length)];
    const { data, error } = await supabase.from("activities").insert({
      owner_id: user.id,
      title: payload.title,
      subject: payload.subject || null,
      grade: payload.grade || null,
      activity_type: payload.activity_type,
      questions: [],
      status: "draft",
      cover_color: cover,
    } as any).select().single();
    if (error) { toast.error(error.message); return; }
    toast.success("Projeto criado!");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["studio-projects"] });
    navigate({ to: "/studio/$id", params: { id: data.id } });
  };

  const duplicate = async (p: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("activities").insert({
      owner_id: user.id,
      title: `${p.title} (cópia)`,
      subject: p.subject, grade: p.grade, activity_type: p.activity_type,
      questions: p.questions ?? [], status: "draft", cover_color: p.cover_color,
    } as any);
    if (error) toast.error(error.message);
    else { toast.success("Duplicado"); qc.invalidateQueries({ queryKey: ["studio-projects"] }); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este projeto?")) return;
    const { error } = await supabase.from("activities").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Excluído"); qc.invalidateQueries({ queryKey: ["studio-projects"] }); }
  };

  return (
    <div className="px-6 lg:px-10 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
            <LayoutGrid className="h-3 w-3" /> Studio
          </div>
          <h1 className="mt-2 font-display text-2xl lg:text-3xl font-bold tracking-tight">Seus projetos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Crie, edite e organize quizzes em formato canvas.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="h-9 bg-gradient-primary shadow-soft">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Novo projeto
        </Button>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou matéria..." className="h-9 pl-9 bg-surface" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 w-[160px] bg-surface"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="quiz">Quiz</SelectItem>
            <SelectItem value="review">Revisão</SelectItem>
            <SelectItem value="simulation">Simulado</SelectItem>
            <SelectItem value="challenge">Desafio</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface h-56 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-2 border-border bg-surface/50 p-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="mt-5 font-display text-lg font-semibold">{q ? "Nada encontrado" : "Comece criando seu primeiro projeto"}</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">Um projeto é um quiz, simulado ou atividade que você monta arrastando blocos no canvas.</p>
          <Button onClick={() => setOpen(true)} className="mt-5 bg-gradient-primary"><Plus className="mr-1.5 h-3.5 w-3.5" /> Criar projeto</Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p: any) => (
            <Card key={p.id} className="group overflow-hidden border-border bg-surface hover:border-primary/50 hover:shadow-soft transition-smooth">
              <Link to="/studio/$id" params={{ id: p.id }} className="block">
                <div className="relative h-28" style={{ background: p.cover_color ?? COVERS[0] }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute top-2 left-3 right-3 flex items-start justify-between">
                    <span className="rounded-md bg-white/20 backdrop-blur px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                      {p.activity_type}
                    </span>
                    <StatusPill status={p.status ?? "draft"} />
                  </div>
                  <div className="absolute bottom-3 left-3 font-display text-3xl font-bold text-white drop-shadow">
                    {p.title?.[0]?.toUpperCase() ?? "?"}
                  </div>
                </div>
              </Link>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link to="/studio/$id" params={{ id: p.id }} className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm leading-tight truncate hover:text-primary transition-smooth">{p.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      {p.subject ?? "Sem matéria"} {p.grade && `· ${p.grade}`}
                    </p>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem asChild><Link to="/studio/$id" params={{ id: p.id }}><Pencil className="mr-2 h-3.5 w-3.5" /> Editar</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/present/$id" params={{ id: p.id }}><Play className="mr-2 h-3.5 w-3.5" /> Apresentar</Link></DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicate(p)}><Copy className="mr-2 h-3.5 w-3.5" /> Duplicar</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => remove(p.id)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{(p.questions?.length ?? 0)} blocos</span>
                  <span>{new Date(p.updated_at).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <NewProjectDialog open={open} onOpenChange={setOpen} onCreate={handleCreate} />
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-white/20 text-white",
    ready: "bg-success text-white",
    applied: "bg-primary text-white",
  };
  const labels: Record<string, string> = { draft: "Rascunho", ready: "Pronto", applied: "Aplicado" };
  return <span className={`rounded-md backdrop-blur px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${map[status] ?? map.draft}`}>{labels[status] ?? status}</span>;
}

function NewProjectDialog({
  open, onOpenChange, onCreate,
}: { open: boolean; onOpenChange: (v: boolean) => void; onCreate: (p: any) => void }) {
  const [form, setForm] = useState({ title: "", subject: "", grade: "", activity_type: "quiz" });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onCreate(form);
    setForm({ title: "", subject: "", grade: "", activity_type: "quiz" });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Novo projeto</DialogTitle>
          <DialogDescription>Dê um nome ao seu projeto. Você poderá editar tudo depois no canvas.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="title">Nome do projeto *</Label>
            <Input id="title" autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Quiz de Frações — 7º Ano" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="subject">Matéria</Label>
              <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Matemática" />
            </div>
            <div>
              <Label htmlFor="grade">Série</Label>
              <Input id="grade" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="7º Ano" />
            </div>
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={form.activity_type} onValueChange={(v) => setForm({ ...form, activity_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="review">Revisão</SelectItem>
                <SelectItem value="simulation">Simulado</SelectItem>
                <SelectItem value="challenge">Desafio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="bg-gradient-primary">Criar projeto</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

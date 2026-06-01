import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { generateActivity } from "@/lib/activities.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Wand2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/studio")({
  head: () => ({ meta: [{ title: "Studio IA — LyneKoto" }] }),
  component: Studio,
});

function Studio() {
  const navigate = useNavigate();
  const fn = useServerFn(generateActivity);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    subject: "", grade: "", topic: "", difficulty: "medium" as "easy"|"medium"|"hard", count: 10, activity_type: "quiz" as const,
  });
  const [generated, setGenerated] = useState<any>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setGenerated(null);
    try {
      const res = await fn({ data: form });
      setGenerated(res.activity);
      toast.success("Atividade criada!");
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao gerar");
    } finally { setLoading(false); }
  };

  return (
    <div className="container max-w-7xl mx-auto p-6 md:p-8">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
          <Sparkles className="h-3 w-3" /> Studio IA
        </div>
        <h1 className="mt-3 font-display text-3xl md:text-4xl font-bold">Crie atividades com IA pedagógica</h1>
        <p className="mt-2 text-muted-foreground">Informe o tema e os parâmetros — a IA gera questões, alternativas e justificativas alinhadas à BNCC.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <Card className="p-6 h-fit sticky top-20">
          <form onSubmit={handleGenerate} className="space-y-5">
            <div>
              <Label>Matéria</Label>
              <Input value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} placeholder="Ex.: Matemática" required />
            </div>
            <div>
              <Label>Série / Ano</Label>
              <Input value={form.grade} onChange={(e) => setForm({...form, grade: e.target.value})} placeholder="Ex.: 7º Ano" required />
            </div>
            <div>
              <Label>Tema</Label>
              <Input value={form.topic} onChange={(e) => setForm({...form, topic: e.target.value})} placeholder="Ex.: Frações equivalentes" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Dificuldade</Label>
                <Select value={form.difficulty} onValueChange={(v: any) => setForm({...form, difficulty: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Fácil</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="hard">Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Questões</Label>
                <Input type="number" min={1} max={30} value={form.count} onChange={(e) => setForm({...form, count: parseInt(e.target.value) || 10})} />
              </div>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.activity_type} onValueChange={(v: any) => setForm({...form, activity_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="review">Revisão</SelectItem>
                  <SelectItem value="simulation">Simulado</SelectItem>
                  <SelectItem value="challenge">Desafio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-primary shadow-elegant hover:shadow-glow transition-smooth">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</> : <><Wand2 className="mr-2 h-4 w-4" /> Gerar com IA</>}
            </Button>
          </form>
        </Card>

        <div>
          {!generated && !loading && (
            <Card className="flex flex-col items-center justify-center p-16 text-center border-dashed">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow animate-float">
                <Sparkles className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold">Pronto para criar</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">Preencha os parâmetros ao lado e clique em <strong>Gerar com IA</strong>. Em segundos sua atividade estará pronta.</p>
            </Card>
          )}
          {loading && (
            <Card className="flex flex-col items-center justify-center p-16 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">A IA pedagógica está preparando sua atividade...</p>
            </Card>
          )}
          {generated && (
            <Card className="p-6">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <div className="flex items-center gap-2 text-success text-xs font-semibold">
                    <CheckCircle2 className="h-4 w-4" /> Criada com sucesso
                  </div>
                  <h2 className="mt-2 font-display text-2xl font-bold">{generated.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{generated.subject} · {generated.grade} · {generated.questions.length} questões</p>
                </div>
                <Button onClick={() => navigate({ to: "/present/$id", params: { id: generated.id }})} className="bg-gradient-primary">
                  Apresentar
                </Button>
              </div>
              <div className="mt-4 space-y-4">
                {generated.questions.map((q: any, i: number) => (
                  <div key={i} className="rounded-xl border border-border p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">{i+1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{q.question}</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {q.options.map((opt: string, idx: number) => (
                            <div key={idx} className={`rounded-lg border px-3 py-2 text-sm ${idx === q.correct_index ? "border-success bg-success/5 font-medium" : "border-border"}`}>
                              <span className="font-mono text-xs text-muted-foreground mr-2">{String.fromCharCode(65+idx)}</span>
                              {opt}
                              {idx === q.correct_index && <CheckCircle2 className="ml-2 inline h-3 w-3 text-success" />}
                            </div>
                          ))}
                        </div>
                        {q.explanation && <p className="mt-3 text-xs text-muted-foreground italic">💡 {q.explanation}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

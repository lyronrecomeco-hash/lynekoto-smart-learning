import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X, ScanLine, Eye, EyeOff, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/present/$id")({
  head: () => ({ meta: [{ title: "Apresentando — LyneKoto" }] }),
  component: Present,
  errorComponent: ({ error, reset }) => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-10 text-center text-foreground">
      <h2 className="font-display text-xl font-semibold">Não foi possível apresentar</h2>
      <p className="max-w-md text-sm text-muted-foreground">{error.message}</p>
      <div className="flex gap-2">
        <Button onClick={reset} size="sm">Tentar novamente</Button>
        <Button asChild size="sm" variant="outline"><Link to="/studio">Voltar ao Studio</Link></Button>
      </div>
    </div>
  ),
});

type AnyBlock = any;

/** Normalize legacy + new block formats into a single shape. */
function normalize(blocks: AnyBlock[]) {
  return (blocks ?? [])
    .map((b) => {
      // New canvas format: { id, type, data: {...} }
      if (b && typeof b === "object" && b.type && b.data) {
        return { type: b.type, ...b.data };
      }
      // Legacy mcq directly { question, options, correct_index, explanation }
      if (b && b.options && Array.isArray(b.options)) {
        return { type: "mcq", ...b };
      }
      return b;
    })
    .filter((b) => b && (b.type === "mcq" || b.type === "tf" || b.type === "short" || b.type === "poll" || b.type === "multi"));
}

function Present() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [reveal, setReveal] = useState(false);

  const { data: activity, isLoading } = useQuery({
    queryKey: ["activity", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("activities").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    enabled: typeof window !== "undefined",
  });

  const questions = useMemo(() => normalize((activity?.questions as any[]) ?? []), [activity]);

  // keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIdx((i) => Math.min(questions.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      if (e.key === " ") { e.preventDefault(); setReveal((r) => !r); }
      if (e.key === "Escape") navigate({ to: "/studio" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [questions.length, navigate]);

  if (isLoading || !activity) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-10 text-center">
        <h2 className="font-display text-xl font-semibold">Nenhuma pergunta para apresentar</h2>
        <p className="max-w-md text-sm text-muted-foreground">Volte ao Studio e adicione blocos de pergunta (múltipla escolha, V/F, resposta curta).</p>
        <Button asChild><Link to="/studio/$id" params={{ id }}>Editar projeto</Link></Button>
      </div>
    );
  }

  const q = questions[idx];
  const last = idx === questions.length - 1;
  const options: string[] = q.options ?? (q.type === "tf" ? ["Verdadeiro", "Falso"] : []);
  const correctIdx: number =
    q.correct_index !== undefined
      ? q.correct_index
      : q.type === "tf"
        ? (q.correct ? 0 : 1)
        : -1;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-display text-sm font-bold">
            {String(idx + 1).padStart(2, "0")}
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {activity.subject ?? "—"} · {activity.grade ?? "—"}
            </div>
            <div className="font-display font-semibold leading-tight">{activity.title}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/scan"><ScanLine className="mr-1.5 h-3.5 w-3.5" /> Coletar respostas</Link>
          </Button>
          <div className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {idx + 1} / {questions.length}
          </div>
          <Button size="icon" variant="ghost" onClick={() => navigate({ to: "/studio/$id", params: { id } })}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-12">
        <div className="w-full max-w-5xl">
          <div className="text-center">
            <div className="font-display text-[11px] uppercase tracking-widest text-muted-foreground">
              Questão {idx + 1}
            </div>
            <h1 className="mt-4 font-display text-3xl md:text-5xl font-bold leading-tight">
              {q.question || q.content || "—"}
            </h1>
          </div>

          {options.length > 0 && (
            <div className="mt-10 grid gap-3 md:grid-cols-2">
              {options.map((opt, i) => {
                const isRight = i === correctIdx;
                return (
                  <div
                    key={i}
                    className={`rounded-xl border-2 bg-surface p-5 text-left transition-smooth ${
                      reveal && isRight
                        ? "border-success bg-success/10"
                        : reveal && correctIdx >= 0
                          ? "border-border opacity-50"
                          : "border-border hover:border-strong"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-lg font-display text-lg font-bold ${
                        reveal && isRight ? "bg-success text-white" : "bg-muted text-foreground"
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span className="font-display text-lg font-medium">{opt}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {q.type === "short" && reveal && q.answer && (
            <div className="mx-auto mt-10 max-w-2xl rounded-xl border-2 border-success bg-success/10 p-6 text-center font-display text-2xl font-semibold">
              {q.answer}
            </div>
          )}

          {reveal && q.explanation && (
            <p className="mx-auto mt-8 max-w-2xl text-center italic text-muted-foreground animate-fade-up">
              💡 {q.explanation}
            </p>
          )}
        </div>
      </main>

      <footer className="flex items-center justify-between border-t border-border bg-surface px-6 py-3">
        <Button variant="outline" disabled={idx === 0} onClick={() => { setIdx(idx - 1); setReveal(false); }}>
          <ChevronLeft className="mr-1.5 h-4 w-4" /> Anterior
        </Button>
        <Button variant={reveal ? "outline" : "default"} onClick={() => setReveal(!reveal)}>
          {reveal ? <><EyeOff className="mr-1.5 h-4 w-4" /> Ocultar resposta</> : <><Eye className="mr-1.5 h-4 w-4" /> Revelar resposta</>}
        </Button>
        <Button disabled={last} onClick={() => { setIdx(idx + 1); setReveal(false); }}>
          Próxima <ChevronRight className="ml-1.5 h-4 w-4" />
        </Button>
      </footer>
    </div>
  );
}

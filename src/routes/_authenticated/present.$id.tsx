import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/present/$id")({
  head: () => ({ meta: [{ title: "Apresentando — LyneKoto" }] }),
  component: Present,
});

function Present() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [reveal, setReveal] = useState(false);

  const { data: activity } = useQuery({
    queryKey: ["activity", id],
    queryFn: async () => {
      const { data } = await supabase.from("activities").select("*").eq("id", id).single();
      return data;
    },
  });

  if (!activity) return <div className="flex min-h-screen items-center justify-center text-white bg-gradient-hero">Carregando...</div>;

  const questions = (activity.questions as any[]) ?? [];
  const q = questions[idx];
  const last = idx === questions.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-hero text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-mesh opacity-30" />

      <header className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur"><Sparkles className="h-4 w-4" /></div>
          <div>
            <div className="text-xs text-white/60 uppercase tracking-wider">{activity.subject} · {activity.grade}</div>
            <div className="font-display font-semibold">{activity.title}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur">
            {idx + 1} / {questions.length}
          </div>
          <Button variant="outline" size="icon" onClick={() => navigate({ to: "/library" })} className="border-white/30 bg-white/10 text-white hover:bg-white/20">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="relative z-10 flex flex-col items-center justify-center px-6 pt-8 pb-32">
        <div className="mx-auto max-w-5xl w-full text-center">
          <div className="font-display text-xs uppercase tracking-widest text-white/50">Questão {idx + 1}</div>
          <h1 className="mt-4 font-display text-4xl md:text-6xl font-bold leading-tight">{q?.question}</h1>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {q?.options.map((opt: string, i: number) => {
              const isRight = i === q.correct_index;
              return (
                <div key={i} className={`rounded-2xl border p-6 text-left backdrop-blur transition-smooth ${reveal && isRight ? "border-success bg-success/20 scale-105" : reveal ? "border-white/10 bg-white/5 opacity-50" : "border-white/20 bg-white/10 hover:bg-white/15"}`}>
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl font-display text-xl font-bold ${reveal && isRight ? "bg-success text-white" : "bg-white/10"}`}>
                      {String.fromCharCode(65+i)}
                    </div>
                    <span className="font-display text-xl font-semibold">{opt}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {reveal && q?.explanation && (
            <p className="mt-8 text-white/70 italic max-w-2xl mx-auto animate-fade-up">💡 {q.explanation}</p>
          )}
        </div>
      </div>

      <footer className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between p-6">
        <Button variant="outline" disabled={idx === 0} onClick={() => { setIdx(idx - 1); setReveal(false); }} className="border-white/30 bg-white/10 text-white hover:bg-white/20 h-12 px-6">
          <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
        </Button>
        <Button onClick={() => setReveal(!reveal)} className="bg-white text-primary hover:bg-white/90 h-12 px-8 font-semibold">
          {reveal ? "Ocultar resposta" : "Revelar resposta"}
        </Button>
        <Button disabled={last} onClick={() => { setIdx(idx + 1); setReveal(false); }} className="bg-gradient-primary h-12 px-6 shadow-glow">
          Próxima <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </footer>
    </div>
  );
}

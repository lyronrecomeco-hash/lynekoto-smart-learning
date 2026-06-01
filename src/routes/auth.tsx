import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Mail, Lock, BookOpen, Brain, BarChart3 } from "lucide-react";
// Google sign-in intentionally removed per product decision.
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar — LyneKoto" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/dashboard" });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message ?? "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen bg-background">
      {/* Left — animated brand panel */}
      <div className="relative hidden lg:flex lg:w-1/2 overflow-hidden bg-gradient-hero">
        {/* Animated orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-20 h-96 w-96 rounded-full bg-primary-glow/30 blur-3xl animate-float" />
          <div
            className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-accent/40 blur-3xl animate-float"
            style={{ animationDelay: "1.5s" }}
          />
          <div
            className="absolute -bottom-20 left-1/4 h-72 w-72 rounded-full bg-primary/40 blur-3xl animate-float"
            style={{ animationDelay: "3s" }}
          />
          <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
        </div>

        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        <div className="relative z-10 flex w-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-xl border border-white/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-lg font-bold leading-none">LyneKoto</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/60 mt-1">
                Edu Intelligence
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="animate-fade-up">
              <h2 className="font-display text-4xl font-bold leading-[1.1] xl:text-5xl">
                Ensine com <span className="text-white/70">clareza</span>,{" "}
                avalie com <span className="text-white/70">precisão</span>,{" "}
                evolua com <span className="text-white/70">dados</span>.
              </h2>
              <p className="mt-5 max-w-md text-white/70 leading-relaxed">
                Construa quizzes interativos, colete respostas por QR em segundos e
                acompanhe o progresso de cada turma em um só lugar.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-md animate-fade-up" style={{ animationDelay: "0.15s" }}>
              {[
                { icon: Brain, label: "IA Pedagógica" },
                { icon: BookOpen, label: "Studio" },
                { icon: BarChart3, label: "Analytics" },
              ].map((f) => (
                <div
                  key={f.label}
                  className="rounded-xl border border-white/15 bg-white/5 p-3 backdrop-blur-xl"
                >
                  <f.icon className="h-5 w-5 text-white/90" />
                  <div className="mt-2 text-xs font-medium text-white/80">{f.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-white/50">
            <span>© 2026 LyneKoto</span>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Plataforma operacional
            </div>
          </div>
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">LyneKoto</span>
          </div>

          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Bem-vindo de volta
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre com suas credenciais para acessar o console.
          </p>


          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground">E-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email" type="email" placeholder="voce@escola.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="h-11 pl-9 bg-surface border-2 border-border-strong text-foreground placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-foreground">Senha</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password" type="password" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} required minLength={1}
                  className="h-11 pl-9 bg-surface border-2 border-border-strong text-foreground placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
                />
              </div>
            </div>
            <Button type="submit" disabled={loading}
              className="w-full h-11 bg-gradient-primary text-primary-foreground shadow-elegant hover:shadow-glow transition-smooth font-semibold">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar no console
            </Button>
          </form>


          <p className="mt-6 text-center text-xs text-muted-foreground">
            Acesso exclusivo para educadores e instituições parceiras.
          </p>
        </div>
      </div>
    </div>
  );
}

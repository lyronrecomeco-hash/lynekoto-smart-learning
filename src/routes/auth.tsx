import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Mail, Lock, BookOpen, Brain, BarChart3 } from "lucide-react";
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

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (result.error) {
      toast.error("Falha no login com Google");
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
                A sala de aula que <span className="text-white/70">pensa</span>,{" "}
                <span className="text-white/70">mede</span> e{" "}
                <span className="text-white/70">evolui</span> em tempo real.
              </h2>
              <p className="mt-5 max-w-md text-white/70 leading-relaxed">
                IA pedagógica, QR Cards inteligentes e analytics avançado — em uma única
                experiência integrada.
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

          <Button
            onClick={handleGoogle}
            disabled={loading}
            variant="outline"
            className="mt-8 w-full h-11 border-2 border-border-strong bg-surface text-foreground hover:bg-accent/40 hover:border-primary/50 transition-smooth"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar com Google
          </Button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border-strong" />
            <span className="text-xs font-medium text-muted-foreground">ou com e-mail</span>
            <div className="h-px flex-1 bg-border-strong" />
          </div>

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

          <div className="mt-6 rounded-lg border-2 border-dashed border-border-strong bg-surface/60 p-3 text-center">
            <p className="text-[11px] font-mono text-muted-foreground">
              Acesso de demonstração: <span className="font-semibold text-foreground">admin@painel.com</span> / <span className="font-semibold text-foreground">admin1</span>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Acesso exclusivo para educadores e instituições parceiras.
          </p>
        </div>
      </div>
    </div>
  );
}

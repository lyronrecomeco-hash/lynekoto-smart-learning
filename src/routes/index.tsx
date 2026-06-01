import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Sparkles, ScanLine, BarChart3, GraduationCap, Brain, Trophy,
  ArrowRight, CheckCircle2, Zap, Shield, Globe,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LyneKoto — Avaliação Inteligente com IA e QR Cards" },
      { name: "description", content: "A plataforma educacional que une criação por IA, leitura coletiva de QR Cards e analytics em tempo real. Para escolas que querem o próximo nível." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Sparkles, title: "Studio IA", desc: "Crie quizzes, simulados, jogos e trilhas em segundos com IA pedagógica especializada." },
  { icon: ScanLine, title: "QR Cards Inteligentes", desc: "Leia respostas de dezenas de alunos simultaneamente com visão computacional." },
  { icon: BarChart3, title: "Learning Analytics", desc: "Insights automáticos: quem precisa de reforço, quais conteúdos têm baixa retenção." },
  { icon: Brain, title: "IA Pedagógica", desc: "Recomendações personalizadas baseadas em desempenho real de cada aluno." },
  { icon: Trophy, title: "Gamificação", desc: "XP, níveis, medalhas, missões e ranking — engajamento total da turma." },
  { icon: GraduationCap, title: "Multi-Tenant SaaS", desc: "Cada escola com seus dados, professores e configurações isolados." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">LyneKoto</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth">Recursos</a>
            <a href="#how" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth">Como funciona</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth">Planos</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm font-medium hover:text-primary transition-smooth">Entrar</Link>
            <Button asChild className="bg-gradient-primary shadow-elegant hover:shadow-glow transition-smooth">
              <Link to="/auth">Começar grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-24">
        <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
        <div className="container relative mx-auto px-6 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur animate-fade-up">
            <Zap className="h-3.5 w-3.5 text-primary" />
            Nova geração de plataformas educacionais
          </div>
          <h1 className="mx-auto mt-6 max-w-4xl font-display text-5xl font-bold tracking-tight md:text-7xl animate-fade-up" style={{ animationDelay: "0.1s" }}>
            A sala de aula que <span className="text-gradient">pensa, mede e evolui</span> em tempo real.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground animate-fade-up" style={{ animationDelay: "0.2s" }}>
            LyneKoto une IA pedagógica, QR Cards inteligentes e analytics avançado em um único ecossistema. Crie, aplique, analise e evolua suas atividades — sem fricção.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Button size="lg" asChild className="bg-gradient-primary shadow-elegant hover:shadow-glow transition-smooth h-12 px-7">
              <Link to="/auth">Começar gratuitamente <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-7">
              Ver demonstração
            </Button>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Sem cartão de crédito</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Setup em 2 minutos</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Cancele quando quiser</div>
          </div>
        </div>

        {/* Hero mock */}
        <div className="container mx-auto mt-20 px-6 animate-fade-up" style={{ animationDelay: "0.5s" }}>
          <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-card p-3 shadow-elegant">
            <div className="rounded-xl bg-gradient-hero p-12 text-center">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> AO VIVO · 7º Ano A
              </div>
              <h2 className="mt-6 font-display text-3xl font-bold text-white md:text-5xl">
                Qual é o planeta mais próximo do Sol?
              </h2>
              <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
                {["Mercúrio", "Vênus", "Terra", "Marte"].map((opt, i) => (
                  <div key={i} className="rounded-xl border border-white/20 bg-white/5 p-6 text-left text-white backdrop-blur">
                    <div className="text-xs font-mono opacity-60">{String.fromCharCode(65+i)}</div>
                    <div className="mt-2 font-semibold">{opt}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-gradient-subtle py-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Ecossistema completo</div>
            <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">Tudo que sua escola precisa</h2>
            <p className="mt-4 text-muted-foreground">Da criação à análise, tudo integrado em uma única plataforma premium.</p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={i} className="group relative rounded-2xl border border-border bg-card p-7 shadow-soft transition-smooth hover:shadow-elegant hover:-translate-y-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="py-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-4xl font-bold md:text-5xl">3 passos para revolucionar sua aula</h2>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              { n: "01", t: "Crie com IA", d: "Informe tema, série e quantidade. A IA pedagógica gera questões, alternativas e justificativas em segundos." },
              { n: "02", t: "Aplique ao vivo", d: "Modo apresentação para datashow. Alunos respondem levantando o QR Card na orientação correta." },
              { n: "03", t: "Analise e evolua", d: "Dashboards automáticos identificam dificuldades, alunos em risco e recomendam reforço personalizado." },
            ].map((s, i) => (
              <div key={i} className="relative">
                <div className="font-display text-7xl font-bold text-gradient opacity-80">{s.n}</div>
                <h3 className="mt-4 font-display text-2xl font-semibold">{s.t}</h3>
                <p className="mt-3 text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-t border-border bg-sidebar py-20 text-sidebar-foreground">
        <div className="container mx-auto px-6 text-center">
          <div className="grid gap-12 md:grid-cols-3">
            <div>
              <Shield className="mx-auto h-8 w-8 text-sidebar-primary" />
              <h3 className="mt-4 font-display text-lg font-semibold">Segurança Enterprise</h3>
              <p className="mt-2 text-sm text-sidebar-foreground/70">RBAC, auditoria, criptografia e dados isolados por escola.</p>
            </div>
            <div>
              <Globe className="mx-auto h-8 w-8 text-sidebar-primary" />
              <h3 className="mt-4 font-display text-lg font-semibold">Multi-dispositivo</h3>
              <p className="mt-2 text-sm text-sidebar-foreground/70">Desktop, tablet, smartphone, smart TV — responsividade total.</p>
            </div>
            <div>
              <Zap className="mx-auto h-8 w-8 text-sidebar-primary" />
              <h3 className="mt-4 font-display text-lg font-semibold">Tempo real</h3>
              <p className="mt-2 text-sm text-sidebar-foreground/70">Respostas, ranking e analytics instantâneos via realtime.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
        <div className="container relative mx-auto px-6 text-center">
          <h2 className="mx-auto max-w-3xl font-display text-4xl font-bold md:text-6xl">
            Pronto para construir a <span className="text-gradient">próxima geração</span> da sua escola?
          </h2>
          <Button size="lg" asChild className="mt-10 h-14 bg-gradient-primary px-10 shadow-elegant hover:shadow-glow transition-smooth">
            <Link to="/auth">Começar agora <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          © 2026 LyneKoto · Edu Intelligence Platform
        </div>
      </footer>
    </div>
  );
}

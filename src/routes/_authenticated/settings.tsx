import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Settings as SettingsIcon, User, Palette, Bell, Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Configurações — LyneKoto" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [fullName, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      setName(data?.full_name ?? "");
    })();
  }, []);

  const save = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
      if (error) toast.error(error.message);
      else toast.success("Perfil atualizado");
    }
    setLoading(false);
  };

  return (
    <div className="px-6 lg:px-10 py-8 max-w-5xl">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
          <SettingsIcon className="h-3 w-3" /> Conta
        </div>
        <h1 className="mt-2 font-display text-2xl lg:text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gerencie seu perfil, preferências e segurança.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-2 border-border bg-surface p-6">
            <div className="flex items-center gap-2 mb-5">
              <User className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg font-semibold">Perfil</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Nome completo</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-canvas border-border-strong"
                />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input value={email} disabled className="bg-muted border-border-strong" />
              </div>
              <Button onClick={save} disabled={loading} className="bg-gradient-primary">
                Salvar alterações
              </Button>
            </div>
          </Card>

          <Card className="border-2 border-border bg-surface p-6">
            <div className="flex items-center gap-2 mb-5">
              <Shield className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg font-semibold">Segurança</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Para alterar sua senha, faça logout e use a opção de recuperação.
            </p>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-2 border-border bg-surface p-6">
            <Palette className="h-4 w-4 text-primary mb-2" />
            <h3 className="font-display font-semibold">Aparência</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Use o botão sol/lua no topo para alternar tema claro/escuro.
            </p>
          </Card>
          <Card className="border-2 border-border bg-surface p-6">
            <Bell className="h-4 w-4 text-primary mb-2" />
            <h3 className="font-display font-semibold">Notificações</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Em breve: alertas em tempo real sobre sessões ao vivo.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Configurações — LyneKoto" }] }),
  component: Settings,
});

function Settings() {
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
      if (error) toast.error(error.message); else toast.success("Salvo!");
    }
    setLoading(false);
  };

  return (
    <div className="container max-w-3xl mx-auto p-8">
      <h1 className="font-display text-3xl font-bold">Configurações</h1>
      <Card className="mt-8 p-6 space-y-5">
        <div><Label>Nome</Label><Input value={fullName} onChange={(e) => setName(e.target.value)} /></div>
        <div><Label>E-mail</Label><Input value={email} disabled /></div>
        <Button onClick={save} disabled={loading} className="bg-gradient-primary">Salvar</Button>
      </Card>
    </div>
  );
}

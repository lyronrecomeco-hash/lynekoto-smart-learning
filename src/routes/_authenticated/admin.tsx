import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { ShieldCheck, Building2, Users2, FileText, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin Center — LyneKoto" }] }),
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    if (!roles?.some((r: any) => r.role === "admin")) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminPage,
});

function AdminPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [school, setSchool] = useState({ name: "", brand_color: "#4f46e5" });

  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [profilesRes, activitiesRes, schoolsRes, sessionsRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, created_at").order("created_at", { ascending: false }),
        supabase.from("activities").select("id"),
        supabase.from("schools").select("*").order("created_at", { ascending: false }),
        supabase.from("sessions").select("id, status"),
      ]);
      return {
        profiles: profilesRes.data ?? [],
        activities: activitiesRes.data ?? [],
        schools: schoolsRes.data ?? [],
        sessions: sessionsRes.data ?? [],
      };
    },
  });

  const createSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("schools")
      .insert({ name: school.name, brand_color: school.brand_color, owner_id: user.id });
    if (error) toast.error(error.message);
    else {
      toast.success("Escola criada");
      setOpen(false);
      setSchool({ name: "", brand_color: "#4f46e5" });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    }
  };

  return (
    <div className="px-6 lg:px-10 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-destructive">
            <ShieldCheck className="h-3 w-3" /> Admin Center
          </div>
          <h1 className="mt-2 font-display text-2xl lg:text-3xl font-bold tracking-tight">
            Centro de administração
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão consolidada da plataforma. Multi-tenant, usuários e operação.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-9 bg-gradient-primary shadow-soft">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Nova escola
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Cadastrar escola</DialogTitle>
            </DialogHeader>
            <form onSubmit={createSchool} className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  required
                  value={school.name}
                  onChange={(e) => setSchool({ ...school, name: e.target.value })}
                  placeholder="Colégio Lumière"
                />
              </div>
              <div>
                <Label>Cor da marca</Label>
                <Input
                  type="color"
                  value={school.brand_color}
                  onChange={(e) => setSchool({ ...school, brand_color: e.target.value })}
                  className="h-11 w-24"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-primary">Criar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <KPI icon={Building2} label="Escolas" value={String(data?.schools.length ?? 0)} />
        <KPI icon={Users2} label="Usuários" value={String(data?.profiles.length ?? 0)} />
        <KPI icon={FileText} label="Atividades" value={String(data?.activities.length ?? 0)} />
        <KPI icon={ShieldCheck} label="Sessões ao vivo" value={String((data?.sessions ?? []).filter((s: any) => s.status === "live").length)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-2 border-border bg-surface overflow-hidden">
          <div className="px-5 py-4 border-b-2 border-border">
            <h3 className="font-display text-lg font-semibold">Escolas ({data?.schools.length ?? 0})</h3>
          </div>
          {(data?.schools ?? []).length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Nenhuma escola cadastrada.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left">Nome</th>
                  <th className="px-5 py-3 text-left">Marca</th>
                  <th className="px-5 py-3 text-left">Cadastrada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(data?.schools ?? []).map((s: any) => (
                  <tr key={s.id} className="hover:bg-accent/30">
                    <td className="px-5 py-3 font-medium">{s.name}</td>
                    <td className="px-5 py-3">
                      {s.brand_color && (
                        <span
                          className="inline-block h-5 w-5 rounded-md border-2 border-border-strong align-middle"
                          style={{ background: s.brand_color }}
                        />
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="border-2 border-border bg-surface overflow-hidden">
          <div className="px-5 py-4 border-b-2 border-border">
            <h3 className="font-display text-lg font-semibold">Usuários recentes</h3>
          </div>
          <div className="divide-y divide-border max-h-[420px] overflow-auto">
            {(data?.profiles ?? []).slice(0, 20).map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-accent/30">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground">
                  {p.full_name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{p.full_name ?? "Sem nome"}</div>
                  <div className="text-[10px] text-muted-foreground">
                    Desde {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <Badge variant="outline" className="border-border-strong text-[10px]">
                  Teacher
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function KPI({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card className="border-2 border-border bg-surface p-5">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </Card>
  );
}

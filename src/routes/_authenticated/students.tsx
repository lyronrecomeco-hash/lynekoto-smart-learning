import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Users, Plus, QrCode, Trash2, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

export const Route = createFileRoute("/_authenticated/students")({
  head: () => ({ meta: [{ title: "Alunos — LyneKoto" }] }),
  component: StudentsPage,
});

function StudentsPage() {
  const qc = useQueryClient();
  const [classId, setClassId] = useState<string>("");
  const [addOpen, setAddOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [qrStudent, setQrStudent] = useState<any | null>(null);

  const { data: classes } = useQuery({
    queryKey: ["classes-light"],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("id,name").order("name");
      return data ?? [];
    },
  });

  const { data: students, isLoading } = useQuery({
    queryKey: ["students", classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data } = await supabase
        .from("students")
        .select("*")
        .eq("class_id", classId)
        .order("full_name");
      return data ?? [];
    },
  });

  const addBulk = async () => {
    if (!classId) return toast.error("Selecione uma turma");
    const names = bulkText
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);
    if (!names.length) return;
    const rows = names.map((full_name) => ({
      full_name,
      class_id: classId,
      qr_code: `LK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    }));
    const { error } = await supabase.from("students").insert(rows);
    if (error) toast.error(error.message);
    else {
      toast.success(`${names.length} alunos adicionados`);
      setBulkText("");
      setAddOpen(false);
      qc.invalidateQueries({ queryKey: ["students", classId] });
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este aluno?")) return;
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["students", classId] });
  };

  return (
    <div className="px-6 lg:px-10 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
            <Users className="h-3 w-3" /> Alunos
          </div>
          <h1 className="mt-2 font-display text-2xl lg:text-3xl font-bold tracking-tight">
            Gestão de alunos & QR Cards
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada aluno recebe um QR Card único para resposta visual.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-[220px] h-9 bg-surface border-border-strong">
              <SelectValue placeholder="Selecione uma turma" />
            </SelectTrigger>
            <SelectContent>
              {(classes ?? []).map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button disabled={!classId} className="h-9 bg-gradient-primary shadow-soft">
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar alunos
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Importar alunos em lote</DialogTitle>
              </DialogHeader>
              <div>
                <Label>Um nome por linha</Label>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={8}
                  className="mt-1.5 w-full rounded-md border-2 border-border-strong bg-surface p-3 text-sm focus:border-primary focus:outline-none"
                  placeholder={"Ana Silva\nBruno Costa\nCarla Lima"}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
                <Button onClick={addBulk} className="bg-gradient-primary">Adicionar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!classId ? (
        <Card className="border-2 border-dashed border-border-strong bg-surface/50 p-16 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            Selecione uma turma acima para gerenciar seus alunos.
          </p>
        </Card>
      ) : isLoading ? (
        <Card className="h-60 animate-pulse border-2 border-border bg-surface" />
      ) : !students || students.length === 0 ? (
        <Card className="border-2 border-dashed border-border-strong bg-surface/50 p-16 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">Nenhum aluno nesta turma ainda.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden border-2 border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b-2 border-border">
              <tr>
                <th className="px-5 py-3 text-left">Aluno</th>
                <th className="px-5 py-3 text-left">QR Code</th>
                <th className="px-5 py-3 text-left">Cadastrado</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map((s: any) => (
                <tr key={s.id} className="hover:bg-accent/30 transition-smooth">
                  <td className="px-5 py-3 font-medium">{s.full_name}</td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{s.qr_code}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQrStudent(s)}>
                      <QrCode className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(s.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={!!qrStudent} onOpenChange={(v) => !v && setQrStudent(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">{qrStudent?.full_name}</DialogTitle>
          </DialogHeader>
          {qrStudent && (
            <div className="flex flex-col items-center gap-4 p-4">
              <div className="rounded-2xl border-2 border-border-strong bg-white p-6">
                <QRCodeSVG value={qrStudent.qr_code} size={220} level="H" />
              </div>
              <code className="text-sm font-mono">{qrStudent.qr_code}</code>
              <Button variant="outline" className="w-full" onClick={() => window.print()}>
                <Download className="mr-2 h-4 w-4" /> Imprimir
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

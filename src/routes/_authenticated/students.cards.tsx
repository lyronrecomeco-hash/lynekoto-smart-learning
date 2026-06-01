import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Printer, IdCard } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/students/cards")({
  head: () => ({ meta: [{ title: "Cartões QR — LyneKoto" }] }),
  component: CardsPage,
});

function CardsPage() {
  const [classId, setClassId] = useState<string>("all");

  const { data: classes } = useQuery({
    queryKey: ["classes-list"],
    queryFn: async () => (await supabase.from("classes").select("id,name").order("name")).data ?? [],
    staleTime: 60_000,
  });
  const { data: students } = useQuery({
    queryKey: ["students-cards", classId],
    queryFn: async () => {
      let q = supabase.from("students").select("id,full_name,qr_code,class_id,classes(name)").order("full_name");
      if (classId !== "all") q = q.eq("class_id", classId);
      return (await q).data ?? [];
    },
    staleTime: 30_000,
  });

  return (
    <div className="px-6 lg:px-10 py-8 print:p-0">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6 print:hidden">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
            <IdCard className="h-3 w-3" /> QR Cards
          </div>
          <h1 className="mt-2 font-display text-2xl lg:text-3xl font-bold tracking-tight">Cartões de resposta</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Cada aluno tem um cartão único. A orientação do cartão (topo = A, direita = B,
            base = C, esquerda = D) define a resposta lida pela câmera.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-9 border-border-strong">
            <Link to="/students"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Voltar</Link>
          </Button>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="h-9 w-[200px] bg-surface"><SelectValue placeholder="Todas as turmas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as turmas</SelectItem>
              {classes?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => window.print()} className="h-9 bg-gradient-primary">
            <Printer className="mr-1.5 h-3.5 w-3.5" /> Imprimir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 print:gap-2 print:grid-cols-2">
        {students?.map((s: any) => <Card key={s.id} student={s} />)}
        {students && students.length === 0 && (
          <div className="col-span-2 rounded-xl border border-dashed border-border bg-surface/40 p-10 text-center text-sm text-muted-foreground">
            Nenhum aluno encontrado. Cadastre alunos na aba Alunos primeiro.
          </div>
        )}
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body { background: white !important; }
          [data-card] { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}

function Card({ student }: { student: any }) {
  return (
    <div
      data-card
      className="relative aspect-[1/1.05] rounded-xl border-2 border-foreground bg-white text-black p-6 flex flex-col items-center justify-center"
    >
      {/* Orientation markers */}
      <span className="absolute top-2 left-1/2 -translate-x-1/2 font-display text-3xl font-black tracking-tight">A</span>
      <span className="absolute right-2 top-1/2 -translate-y-1/2 font-display text-3xl font-black tracking-tight" style={{ transform: "translateY(-50%) rotate(90deg)" }}>B</span>
      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-display text-3xl font-black tracking-tight" style={{ transform: "translateX(-50%) rotate(180deg)" }}>C</span>
      <span className="absolute left-2 top-1/2 -translate-y-1/2 font-display text-3xl font-black tracking-tight" style={{ transform: "translateY(-50%) rotate(-90deg)" }}>D</span>

      <div className="rounded-md bg-white p-2 border border-black/10">
        <QRCodeSVG value={student.qr_code} size={180} level="H" includeMargin={false} />
      </div>
      <div className="mt-3 text-center">
        <div className="font-display text-sm font-bold leading-tight">{student.full_name}</div>
        <div className="mt-0.5 text-[10px] text-black/60">{student.classes?.name ?? "—"}</div>
        <div className="mt-0.5 font-mono text-[9px] text-black/40">{student.qr_code}</div>
      </div>
    </div>
  );
}

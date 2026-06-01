import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { ScanLine } from "lucide-react";

export const Route = createFileRoute("/_authenticated/scan")({
  head: () => ({ meta: [{ title: "QR Scan — LyneKoto" }] }),
  component: () => (
    <div className="container max-w-7xl mx-auto p-8">
      <h1 className="font-display text-3xl font-bold">QR Scan Engine</h1>
      <p className="mt-1 text-sm text-muted-foreground">Leitura coletiva de QR Cards inteligentes via câmera.</p>
      <Card className="mt-8 p-16 text-center border-dashed">
        <ScanLine className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">Inicie uma sessão ao vivo a partir de uma atividade para ativar o scanner.</p>
      </Card>
    </div>
  ),
});

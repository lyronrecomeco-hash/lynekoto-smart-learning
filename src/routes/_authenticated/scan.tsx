import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScanLine, Camera, CheckCircle2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/scan")({
  head: () => ({ meta: [{ title: "QR Scan — LyneKoto" }] }),
  component: ScanPage,
});

function ScanPage() {
  const [active, setActive] = useState(false);
  const [scans, setScans] = useState<{ code: string; name: string | null; at: string }[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  const start = async () => {
    setActive(true);
    setScans([]);
    seen.current.clear();
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        async (decoded) => {
          if (seen.current.has(decoded)) return;
          seen.current.add(decoded);
          const { data } = await supabase
            .from("students")
            .select("full_name")
            .eq("qr_code", decoded)
            .maybeSingle();
          setScans((s) => [
            { code: decoded, name: data?.full_name ?? null, at: new Date().toLocaleTimeString("pt-BR") },
            ...s,
          ]);
        },
        () => {}
      );
    } catch (e: any) {
      toast.error("Não foi possível acessar a câmera: " + e.message);
      setActive(false);
    }
  };

  const stop = async () => {
    try {
      await scannerRef.current?.stop();
    } catch {}
    setActive(false);
  };

  return (
    <div className="px-6 lg:px-10 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
            <ScanLine className="h-3 w-3" /> Computer Vision
          </div>
          <h1 className="mt-2 font-display text-2xl lg:text-3xl font-bold tracking-tight">
            QR Scan Engine
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Leitura coletiva de QR Cards inteligentes via câmera.
          </p>
        </div>
        {active ? (
          <Button variant="outline" onClick={stop} className="h-9 border-border-strong">
            <X className="mr-1.5 h-4 w-4" /> Parar
          </Button>
        ) : (
          <Button onClick={start} className="h-9 bg-gradient-primary shadow-soft">
            <Camera className="mr-1.5 h-4 w-4" /> Iniciar câmera
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-2 border-border bg-surface p-4 lg:col-span-2 overflow-hidden">
          <div
            id="qr-reader"
            className="aspect-video w-full rounded-lg bg-black flex items-center justify-center text-white/40"
          >
            {!active && (
              <div className="text-center">
                <Camera className="mx-auto h-10 w-10 mb-2 opacity-40" />
                <p className="text-sm">A câmera será ativada aqui</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="border-2 border-border bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Lidos agora</h3>
            <Badge variant="outline" className="border-border-strong">
              {scans.length}
            </Badge>
          </div>
          {scans.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Aponte a câmera para um QR Card para registrar presença ou resposta.
            </p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-auto">
              {scans.map((s, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border-2 border-border bg-canvas px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {s.name ?? <span className="text-muted-foreground italic">Não cadastrado</span>}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">{s.code}</div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{s.at}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

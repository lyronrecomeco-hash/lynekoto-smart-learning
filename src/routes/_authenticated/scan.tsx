import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScanLine, Camera, CheckCircle2, X, IdCard } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { scanFrame, type DetectedCard } from "@/lib/qr-orientation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/scan")({
  head: () => ({ meta: [{ title: "QR Scan — LyneKoto" }] }),
  component: ScanPage,
});

type Mode = "presence" | "answers";

function ScanPage() {
  const [active, setActive] = useState(false);
  const [mode, setMode] = useState<Mode>("presence");
  const [scans, setScans] = useState<(DetectedCard & { name: string | null; at: string })[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const seen = useRef<Map<string, number>>(new Map()); // code+answer -> ts

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const tick = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== 4) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const detected = scanFrame(img);

    const now = Date.now();
    for (const d of detected) {
      const dedupKey = mode === "answers" ? `${d.code}:${d.answer}` : d.code;
      const last = seen.current.get(dedupKey);
      if (last && now - last < 2500) continue;
      seen.current.set(dedupKey, now);

      const { data } = await supabase
        .from("students")
        .select("full_name")
        .eq("qr_code", d.code)
        .maybeSingle();

      setScans((s) => [
        { ...d, name: data?.full_name ?? null, at: new Date().toLocaleTimeString("pt-BR") },
        ...s,
      ].slice(0, 50));
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [mode]);

  const start = async () => {
    setScans([]);
    seen.current.clear();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
      rafRef.current = requestAnimationFrame(tick);
    } catch (e: any) {
      toast.error("Não foi possível acessar a câmera: " + e.message);
    }
  };

  return (
    <div className="px-6 lg:px-10 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
            <ScanLine className="h-3 w-3" /> Computer Vision
          </div>
          <h1 className="mt-2 font-display text-2xl lg:text-3xl font-bold tracking-tight">QR Scan Engine</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Lê vários QR Cards simultaneamente. No modo respostas, detecta a orientação
            do cartão (A topo · B direita · C base · D esquerda).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-9 border-border-strong">
            <Link to="/students/cards"><IdCard className="mr-1.5 h-3.5 w-3.5" /> Gerar cartões</Link>
          </Button>
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
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="mb-4">
        <TabsList>
          <TabsTrigger value="presence">Presença</TabsTrigger>
          <TabsTrigger value="answers">Respostas (A/B/C/D)</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-2 border-border bg-surface p-4 lg:col-span-2 overflow-hidden">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
            <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            {!active && (
              <div className="absolute inset-0 flex items-center justify-center text-white/40">
                <div className="text-center">
                  <Camera className="mx-auto h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">A câmera será ativada aqui</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="border-2 border-border bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Lidos agora</h3>
            <Badge variant="outline" className="border-border-strong">{scans.length}</Badge>
          </div>
          {scans.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {mode === "answers"
                ? "Peça aos alunos que levantem o cartão na orientação da resposta."
                : "Aponte a câmera para os cartões para registrar presença."}
            </p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-auto">
              {scans.map((s, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border-2 border-border bg-canvas px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {s.name ?? <span className="text-muted-foreground italic">Desconhecido</span>}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground truncate">{s.code}</div>
                  </div>
                  {mode === "answers" && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-display text-sm font-bold">
                      {s.answer}
                    </span>
                  )}
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

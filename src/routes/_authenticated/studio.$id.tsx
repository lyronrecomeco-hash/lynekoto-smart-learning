import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle2, CircleDot, Type, Image as ImageIcon, Minus,
  ListChecks, MessageSquare, GripVertical, Plus, Trash2, Copy, Play,
  Sparkles, Wand2, Loader2, Save, MoreVertical, Settings2,
} from "lucide-react";
import { useAutosave } from "@/hooks/use-autosave";
import { generateBlocks } from "@/lib/activities.functions";


export const Route = createFileRoute("/_authenticated/studio/$id")({
  head: () => ({ meta: [{ title: "Canvas — LyneKoto" }] }),
  component: CanvasEditor,
  errorComponent: ({ error, reset }) => (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 p-10 text-center">
      <h2 className="font-display text-xl font-semibold">Não foi possível abrir o projeto</h2>
      <p className="text-sm text-muted-foreground max-w-md">{error.message}</p>
      <div className="flex gap-2">
        <button onClick={reset} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Tentar novamente</button>
        <a href="/studio" className="rounded-md border border-border-strong px-4 py-2 text-sm font-medium">Voltar ao Studio</a>
      </div>
    </div>
  ),
  pendingComponent: () => (
    <div className="flex h-full min-h-[60vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  ),
});

// Safe ID generator (works in SSR + old browsers)
function genId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

// ============ Block types ============
type BlockType = "mcq" | "tf" | "short" | "text" | "divider" | "media";
interface Block {
  id: string;
  type: BlockType;
  data: any;
  points?: number;
  time_limit?: number;
}

const BLOCK_DEFS: Record<BlockType, { label: string; icon: any; description: string; make: () => Block["data"] }> = {
  mcq: { label: "Múltipla Escolha", icon: ListChecks, description: "4 alternativas, 1 correta", make: () => ({ question: "", options: ["", "", "", ""], correct_index: 0, explanation: "" }) },
  tf: { label: "Verdadeiro / Falso", icon: CircleDot, description: "Pergunta binária", make: () => ({ question: "", correct: true, explanation: "" }) },
  short: { label: "Resposta curta", icon: MessageSquare, description: "Texto livre", make: () => ({ question: "", answer: "", explanation: "" }) },
  text: { label: "Instrução", icon: Type, description: "Texto explicativo", make: () => ({ content: "" }) },
  media: { label: "Mídia", icon: ImageIcon, description: "Imagem por URL", make: () => ({ url: "", caption: "" }) },
  divider: { label: "Seção", icon: Minus, description: "Separador de seção", make: () => ({ label: "Nova seção" }) },
};

// ============ Component ============
function CanvasEditor() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: ["studio-project", id],
    initialData: () => queryClient.getQueryData(["studio-project", id]),
    enabled: typeof window !== "undefined",
    queryFn: async () => {
      const { data, error } = await supabase.from("activities").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<string>("draft");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (project && !hydrated) {
      setTitle(project.title ?? "");
      setStatus(project.status ?? "draft");
      const raw = (project.questions as any[]) ?? [];
      const normalized: Block[] = raw.map((b: any) =>
        b?.type ? b : {
          id: genId(),
          type: "mcq",
          data: { question: b.question, options: b.options, correct_index: b.correct_index, explanation: b.explanation },
          points: 10, time_limit: 30,
        }
      );
      setBlocks(normalized);
      setSelectedId(normalized[0]?.id ?? null);
      setHydrated(true);
    }
  }, [project, hydrated]);

  const saveStatus = useAutosave(
    useMemo(() => ({ title, status, blocks }), [title, status, blocks]),
    async (v) => {
      if (!hydrated) return;
      const { error } = await supabase.from("activities").update({
        title: v.title || "Sem título",
        status: v.status,
        questions: v.blocks as any,
      } as any).eq("id", id);
      if (error) throw error;
    },
  );

  const selected = blocks.find((b) => b.id === selectedId) ?? null;

  // ===== Mutations =====
  const createBlock = (type: BlockType): Block => ({
      id: genId(),
      type,
      data: BLOCK_DEFS[type].make(),
      points: type === "mcq" || type === "tf" || type === "short" ? 10 : undefined,
      time_limit: type === "mcq" || type === "tf" ? 30 : undefined,
  });

  const addBlock = (type: BlockType, atIndex?: number) => {
    const block = createBlock(type);
    setBlocks((prev) => {
      if (atIndex === undefined || atIndex >= prev.length) return [...prev, block];
      const copy = [...prev];
      copy.splice(atIndex, 0, block);
      return copy;
    });
    setSelectedId(block.id);
  };

  const updateBlock = (bid: string, patch: Partial<Block> | { data: any }) => {
    setBlocks((prev) => prev.map((b) => (b.id === bid ? { ...b, ...patch, data: (patch as any).data !== undefined ? { ...b.data, ...(patch as any).data } : b.data } : b)));
  };
  const removeBlock = (bid: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== bid));
    if (selectedId === bid) setSelectedId(null);
  };
  const duplicateBlock = (bid: string) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === bid);
      if (idx === -1) return prev;
      const copy = [...prev];
      const dup = { ...prev[idx], id: genId(), data: structuredClone(prev[idx].data) };
      copy.splice(idx + 1, 0, dup);
      return copy;
    });
  };

  // ===== DnD =====
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    const activeId = String(active.id);
    const overId = over ? String(over.id) : null;
    if (activeId.startsWith("palette:")) {
      const type = activeId.replace("palette:", "") as BlockType;
      const block = createBlock(type);
      setBlocks((items) => {
        if (!overId || overId === "canvas-dropzone") return [...items, block];
        const idx = items.findIndex((b) => b.id === overId);
        if (idx === -1) return [...items, block];
        const copy = [...items];
        copy.splice(idx, 0, block);
        return copy;
      });
      setSelectedId(block.id);
      return;
    }
    if (!over || active.id === over.id) return;
    setBlocks((items) => {
      const oldIdx = items.findIndex((b) => b.id === active.id);
      const newIdx = items.findIndex((b) => b.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return items;
      return arrayMove(items, oldIdx, newIdx);
    });
  };

  // ===== Shortcuts =====
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d" && selectedId) {
        e.preventDefault(); duplicateBlock(selectedId);
      }
      if (e.key === "Delete" && selectedId) removeBlock(selectedId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  if (isLoading || !project) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-canvas">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
    <div className="flex flex-col bg-canvas h-[calc(100vh-3.5rem)]">
      {/* Top toolbar */}
      <header className="flex h-12 flex-shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
        <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5">
          <Link to="/studio"><ArrowLeft className="h-3.5 w-3.5" /> Projetos</Link>
        </Button>
        <div className="h-5 w-px bg-border" />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-8 max-w-md border-transparent bg-transparent px-2 font-display text-base font-semibold focus-visible:bg-background"
          placeholder="Sem título"
        />
        <SaveIndicator status={saveStatus} />
        <div className="ml-auto flex items-center gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="ready">Pronto</SelectItem>
              <SelectItem value="applied">Aplicado</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild size="sm" variant="outline" className="h-8">
            <Link to="/present/$id" params={{ id }}><Play className="mr-1.5 h-3.5 w-3.5" /> Apresentar</Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Left: Palette */}
        <aside className="w-60 flex-shrink-0 border-r border-border bg-surface overflow-y-auto">
          <div className="p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Blocos</div>
            <div className="space-y-1">
              {(Object.keys(BLOCK_DEFS) as BlockType[]).map((t) => {
                const def = BLOCK_DEFS[t];
                return (
                  <PaletteBlockButton
                    key={t}
                    type={t}
                    def={def}
                    onClick={() => addBlock(t)}
                  />
                );
              })}
            </div>
          </div>
        </aside>

        {/* Center: Canvas */}
        <div className="flex-1 overflow-y-auto bg-dots" onClick={() => setSelectedId(null)}>
          <div className="mx-auto max-w-3xl py-10 px-6">
            {blocks.length === 0 ? (
              <CanvasDropZone>
                <EmptyCanvas onAdd={addBlock} />
              </CanvasDropZone>
            ) : (
              <CanvasDropZone>
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {blocks.map((b, i) => (
                      <SortableBlock
                        key={b.id}
                        block={b}
                        index={i}
                        selected={selectedId === b.id}
                        onSelect={(e) => { e.stopPropagation(); setSelectedId(b.id); }}
                        onUpdate={(d) => updateBlock(b.id, { data: d })}
                        onRemove={() => removeBlock(b.id)}
                        onDuplicate={() => duplicateBlock(b.id)}
                        onInsertAfter={(t) => addBlock(t, i + 1)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </CanvasDropZone>
            )}
          </div>
        </div>

        {/* Right: Inspector */}
        <aside className="w-80 flex-shrink-0 border-l border-border bg-surface overflow-y-auto">
          <Inspector
            selected={selected}
            onUpdate={(patch) => selected && updateBlock(selected.id, patch as any)}
            projectId={id}
            onBlocksGenerated={(newBlocks) => setBlocks((prev) => [...prev, ...newBlocks])}
            project={project}
          />
        </aside>
      </div>
    </div>
    </DndContext>
  );
}

// ============ Save indicator ============
function SaveIndicator({ status }: { status: string }) {
  if (status === "saving") return <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Salvando</span>;
  if (status === "saved") return <span className="flex items-center gap-1.5 text-xs text-success"><CheckCircle2 className="h-3 w-3" /> Salvo</span>;
  if (status === "error") return <span className="text-xs text-destructive">Erro ao salvar</span>;
  return <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Save className="h-3 w-3" /> Sincronizado</span>;
}

function PaletteBlockButton({ type, def, onClick }: { type: BlockType; def: typeof BLOCK_DEFS[BlockType]; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `palette:${type}` });
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.65 : 1, zIndex: isDragging ? 50 : undefined };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left text-sm hover:border-primary/50 hover:bg-accent/40 transition-smooth group cursor-grab active:cursor-grabbing"
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-smooth">
        <def.icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="font-medium leading-tight">{def.label}</div>
        <div className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">{def.description}</div>
      </div>
    </button>
  );
}

function CanvasDropZone({ children }: { children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: "canvas-dropzone" });
  return (
    <div ref={setNodeRef} className={`min-h-[32rem] rounded-2xl border border-dashed p-3 transition-smooth ${isOver ? "border-primary bg-primary/5" : "border-transparent"}`}>
      {children}
    </div>
  );
}

// ============ Sortable Block wrapper ============
function SortableBlock({
  block, index, selected, onSelect, onUpdate, onRemove, onDuplicate, onInsertAfter,
}: {
  block: Block; index: number; selected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onUpdate: (data: any) => void;
  onRemove: () => void; onDuplicate: () => void;
  onInsertAfter: (t: BlockType) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="group/block relative">
      <div
        onClick={onSelect}
        className={`rounded-xl border-2 bg-surface transition-smooth cursor-pointer ${
          selected ? "border-primary shadow-soft" : "border-border hover:border-strong"
        }`}
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <button {...attributes} {...listeners} className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="text-[10px] font-mono font-semibold text-muted-foreground">#{index + 1}</span>
          <span className="text-xs font-medium text-muted-foreground">{BLOCK_DEFS[block.type].label}</span>
          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover/block:opacity-100 transition-smooth">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
              <Copy className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="p-4">
          <BlockEditor block={block} onUpdate={onUpdate} />
        </div>
      </div>
      <InsertBetween onAdd={onInsertAfter} />
    </div>
  );
}

function InsertBetween({ onAdd }: { onAdd: (t: BlockType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative h-3 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-smooth">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
        {open ? (
          <div className="flex items-center gap-1 rounded-full border border-border bg-surface shadow-soft p-1 z-10">
            {(["mcq", "tf", "short", "text", "divider"] as BlockType[]).map((t) => {
              const D = BLOCK_DEFS[t];
              return (
                <button key={t} onClick={() => { onAdd(t); setOpen(false); }} title={D.label}
                  className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-accent">
                  <D.icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        ) : (
          <button onClick={() => setOpen(true)} className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft hover:scale-110 transition-smooth">
            <Plus className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============ Block-specific editors ============
function BlockEditor({ block, onUpdate }: { block: Block; onUpdate: (d: any) => void }) {
  switch (block.type) {
    case "mcq": return <MCQEditor data={block.data} onUpdate={onUpdate} />;
    case "tf": return <TFEditor data={block.data} onUpdate={onUpdate} />;
    case "short": return <ShortEditor data={block.data} onUpdate={onUpdate} />;
    case "text": return <TextEditor data={block.data} onUpdate={onUpdate} />;
    case "media": return <MediaEditor data={block.data} onUpdate={onUpdate} />;
    case "divider": return <DividerEditor data={block.data} onUpdate={onUpdate} />;
    default: return null;
  }
}

function MCQEditor({ data, onUpdate }: { data: any; onUpdate: (d: any) => void }) {
  return (
    <div className="space-y-3">
      <Textarea
        value={data.question ?? ""}
        onChange={(e) => onUpdate({ question: e.target.value })}
        placeholder="Digite a pergunta..."
        className="border-0 bg-transparent text-base font-display font-medium resize-none focus-visible:bg-muted/30 px-2 min-h-[2.5rem]"
        rows={2}
      />
      <div className="grid gap-2">
        {(data.options ?? []).map((opt: string, idx: number) => (
          <div key={idx} className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-smooth ${idx === data.correct_index ? "border-success bg-success/5" : "border-border"}`}>
            <button
              onClick={() => onUpdate({ correct_index: idx })}
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${idx === data.correct_index ? "border-success bg-success text-white" : "border-border"}`}
            >
              {idx === data.correct_index && <CheckCircle2 className="h-3 w-3" />}
            </button>
            <span className="font-mono text-xs text-muted-foreground">{String.fromCharCode(65 + idx)}</span>
            <Input
              value={opt}
              onChange={(e) => {
                const opts = [...(data.options ?? [])]; opts[idx] = e.target.value;
                onUpdate({ options: opts });
              }}
              placeholder={`Alternativa ${String.fromCharCode(65 + idx)}`}
              className="border-0 bg-transparent h-7 px-1 focus-visible:bg-background"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function TFEditor({ data, onUpdate }: { data: any; onUpdate: (d: any) => void }) {
  return (
    <div className="space-y-3">
      <Textarea value={data.question ?? ""} onChange={(e) => onUpdate({ question: e.target.value })} placeholder="Afirmação..." className="border-0 bg-transparent text-base font-display font-medium resize-none focus-visible:bg-muted/30 px-2" rows={2} />
      <div className="flex gap-2">
        <button onClick={() => onUpdate({ correct: true })} className={`flex-1 rounded-lg border-2 py-3 font-semibold ${data.correct === true ? "border-success bg-success/10 text-success" : "border-border"}`}>Verdadeiro</button>
        <button onClick={() => onUpdate({ correct: false })} className={`flex-1 rounded-lg border-2 py-3 font-semibold ${data.correct === false ? "border-success bg-success/10 text-success" : "border-border"}`}>Falso</button>
      </div>
    </div>
  );
}

function ShortEditor({ data, onUpdate }: { data: any; onUpdate: (d: any) => void }) {
  return (
    <div className="space-y-3">
      <Textarea value={data.question ?? ""} onChange={(e) => onUpdate({ question: e.target.value })} placeholder="Pergunta..." className="border-0 bg-transparent text-base font-display font-medium resize-none focus-visible:bg-muted/30 px-2" rows={2} />
      <Input value={data.answer ?? ""} onChange={(e) => onUpdate({ answer: e.target.value })} placeholder="Resposta esperada" />
    </div>
  );
}

function TextEditor({ data, onUpdate }: { data: any; onUpdate: (d: any) => void }) {
  return <Textarea value={data.content ?? ""} onChange={(e) => onUpdate({ content: e.target.value })} placeholder="Texto, instruções, contexto..." className="border-0 bg-transparent resize-none focus-visible:bg-muted/30 px-2 min-h-[6rem]" />;
}

function MediaEditor({ data, onUpdate }: { data: any; onUpdate: (d: any) => void }) {
  return (
    <div className="space-y-2">
      <Input value={data.url ?? ""} onChange={(e) => onUpdate({ url: e.target.value })} placeholder="https://..." />
      {data.url && <img src={data.url} alt={data.caption ?? ""} className="rounded-lg max-h-60 object-cover w-full" />}
      <Input value={data.caption ?? ""} onChange={(e) => onUpdate({ caption: e.target.value })} placeholder="Legenda (opcional)" />
    </div>
  );
}

function DividerEditor({ data, onUpdate }: { data: any; onUpdate: (d: any) => void }) {
  return (
    <div className="flex items-center gap-3">
      <Minus className="h-4 w-4 text-muted-foreground" />
      <Input value={data.label ?? ""} onChange={(e) => onUpdate({ label: e.target.value })} className="border-0 bg-transparent font-display font-semibold uppercase tracking-wider text-sm focus-visible:bg-muted/30 px-2" />
    </div>
  );
}

// ============ Empty canvas ============
function EmptyCanvas({ onAdd }: { onAdd: (t: BlockType) => void }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-surface/60 p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
        <Sparkles className="h-6 w-6 text-primary-foreground" />
      </div>
      <h3 className="mt-5 font-display text-xl font-semibold">Canvas vazio</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">Arraste um bloco da paleta ou comece pelos atalhos abaixo. Use a aba IA para gerar questões automaticamente.</p>
      <div className="mt-6 flex flex-wrap gap-2 justify-center">
        <Button variant="outline" onClick={() => onAdd("mcq")}><Plus className="mr-1.5 h-3.5 w-3.5" /> Múltipla Escolha</Button>
        <Button variant="outline" onClick={() => onAdd("tf")}><Plus className="mr-1.5 h-3.5 w-3.5" /> V / F</Button>
        <Button variant="outline" onClick={() => onAdd("text")}><Plus className="mr-1.5 h-3.5 w-3.5" /> Instrução</Button>
      </div>
    </div>
  );
}

// ============ Inspector ============
function Inspector({
  selected, onUpdate, projectId, onBlocksGenerated, project,
}: {
  selected: Block | null;
  onUpdate: (patch: Partial<Block>) => void;
  projectId: string;
  onBlocksGenerated: (b: Block[]) => void;
  project: any;
}) {
  return (
    <Tabs defaultValue="block" className="h-full flex flex-col">
      <TabsList className="grid grid-cols-3 m-3">
        <TabsTrigger value="block"><Settings2 className="h-3.5 w-3.5 mr-1" /> Bloco</TabsTrigger>
        <TabsTrigger value="project">Projeto</TabsTrigger>
        <TabsTrigger value="ai"><Sparkles className="h-3.5 w-3.5 mr-1" /> IA</TabsTrigger>
      </TabsList>

      <TabsContent value="block" className="px-4 pb-4 flex-1 overflow-y-auto">
        {!selected ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            <MoreVertical className="mx-auto h-8 w-8 opacity-30 mb-3" />
            Selecione um bloco no canvas para editar propriedades.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Tipo</Label>
              <div className="mt-1 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm font-medium">{BLOCK_DEFS[selected.type].label}</div>
            </div>
            {(selected.type === "mcq" || selected.type === "tf" || selected.type === "short") && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Pontos</Label>
                    <Input type="number" value={selected.points ?? 0} onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 0 })} className="h-9 mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Tempo (s)</Label>
                    <Input type="number" value={selected.time_limit ?? 30} onChange={(e) => onUpdate({ time_limit: parseInt(e.target.value) || 0 })} className="h-9 mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Justificativa pedagógica</Label>
                  <Textarea
                    value={selected.data.explanation ?? ""}
                    onChange={(e) => onUpdate({ data: { ...selected.data, explanation: e.target.value } } as any)}
                    className="mt-1 text-sm"
                    rows={4}
                    placeholder="Por que a resposta certa é correta?"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </TabsContent>

      <TabsContent value="project" className="px-4 pb-4 flex-1 overflow-y-auto">
        <div className="space-y-3 text-sm">
          <Row label="Matéria" value={project.subject ?? "—"} />
          <Row label="Série" value={project.grade ?? "—"} />
          <Row label="Tipo" value={project.activity_type} />
          <Row label="Criado em" value={new Date(project.created_at).toLocaleDateString("pt-BR")} />
          <Row label="Última edição" value={new Date(project.updated_at).toLocaleString("pt-BR")} />
        </div>
      </TabsContent>

      <TabsContent value="ai" className="px-4 pb-4 flex-1 overflow-y-auto">
        <AIPanel projectId={projectId} project={project} onGenerated={onBlocksGenerated} />
      </TabsContent>
    </Tabs>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function AIPanel({ projectId, project, onGenerated }: { projectId: string; project: any; onGenerated: (b: Block[]) => void }) {
  const fn = useServerFn(generateBlocks);
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!topic.trim()) { toast.error("Informe o tema"); return; }
    setLoading(true);
    try {
      const res = await fn({ data: { topic, count, difficulty, subject: project.subject ?? "", grade: project.grade ?? "" } });
      onGenerated(res.blocks);
      toast.success(`${res.blocks.length} blocos adicionados!`);
      setTopic("");
    } catch (err: any) { toast.error(err.message ?? "Erro ao gerar"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-4">
        <div className="flex items-center gap-2 mb-1">
          <Wand2 className="h-4 w-4 text-primary" />
          <span className="font-display font-semibold text-sm">Gerar com IA</span>
        </div>
        <p className="text-xs text-muted-foreground">Descreva um tema e a IA pedagógica adiciona blocos prontos ao canvas.</p>
      </div>

      <div>
        <Label className="text-xs">Tema</Label>
        <Textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ex.: Frações equivalentes com exemplos do cotidiano" rows={3} className="mt-1 text-sm" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Questões</Label>
          <Input type="number" min={1} max={20} value={count} onChange={(e) => setCount(parseInt(e.target.value) || 5)} className="h-9 mt-1" />
        </div>
        <div>
          <Label className="text-xs">Dificuldade</Label>
          <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
            <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Fácil</SelectItem>
              <SelectItem value="medium">Médio</SelectItem>
              <SelectItem value="hard">Difícil</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button disabled={loading} onClick={handle} className="w-full bg-gradient-primary">
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</> : <><Sparkles className="mr-2 h-4 w-4" /> Gerar blocos</>}
      </Button>
    </div>
  );
}

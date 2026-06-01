import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const generateInput = z.object({
  subject: z.string().min(1).max(80).optional().default(""),
  grade: z.string().min(1).max(40).optional().default(""),
  topic: z.string().min(1).max(200),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  count: z.number().int().min(1).max(20).default(5),
});

async function callAI(payload: any) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY ausente");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 429) throw new Error("Limite de uso da IA atingido. Tente novamente em instantes.");
  if (res.status === 402) throw new Error("Créditos de IA esgotados. Recarregue em Configurações.");
  if (!res.ok) throw new Error(`Falha na IA: ${res.status}`);
  return res.json();
}

const TOOL_SCHEMA = {
  type: "function" as const,
  function: {
    name: "create_blocks",
    description: "Cria blocos de quiz estruturados",
    parameters: {
      type: "object",
      properties: {
        blocks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
              correct_index: { type: "integer", minimum: 0, maximum: 3 },
              explanation: { type: "string" },
            },
            required: ["question", "options", "correct_index", "explanation"],
            additionalProperties: false,
          },
        },
      },
      required: ["blocks"],
      additionalProperties: false,
    },
  },
};

/** Gera blocos prontos para adicionar a um projeto existente (usado dentro do canvas). */
export const generateBlocks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => generateInput.parse(input))
  .handler(async ({ data }) => {
    const systemPrompt = `Você é um especialista em educação brasileira (BNCC). Crie blocos de quiz com altíssimo rigor pedagógico em português do Brasil.`;
    const userPrompt = `Crie ${data.count} questões de múltipla escolha sobre "${data.topic}"${data.subject ? `, matéria ${data.subject}` : ""}${data.grade ? `, série ${data.grade}` : ""}, dificuldade ${data.difficulty}. Cada questão tem 4 alternativas (uma correta) e uma justificativa curta.`;

    const json = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [TOOL_SCHEMA],
      tool_choice: { type: "function", function: { name: "create_blocks" } },
    });

    const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Resposta da IA inválida");
    const parsed = JSON.parse(toolCall.function.arguments);

    const blocks = (parsed.blocks ?? []).map((b: any) => ({
      id: crypto.randomUUID(),
      type: "mcq",
      data: {
        question: b.question,
        options: b.options,
        correct_index: b.correct_index,
        explanation: b.explanation,
      },
      points: 10,
      time_limit: 30,
    }));

    return { blocks };
  });

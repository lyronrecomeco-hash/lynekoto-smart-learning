import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const generateInput = z.object({
  subject: z.string().min(1).max(80),
  grade: z.string().min(1).max(40),
  topic: z.string().min(1).max(200),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  count: z.number().int().min(1).max(30).default(10),
  activity_type: z.enum(["quiz", "review", "simulation", "challenge"]).default("quiz"),
});

export const generateActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => generateInput.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY ausente");

    const systemPrompt = `Você é um especialista em educação brasileira (BNCC). Crie atividades educacionais de altíssima qualidade pedagógica, com linguagem adequada à série solicitada.`;

    const userPrompt = `Crie ${data.count} questões de múltipla escolha sobre o tema "${data.topic}" para ${data.grade}, matéria de ${data.subject}, dificuldade ${data.difficulty}. Cada questão deve ter 4 alternativas (A, B, C, D), uma correta, e uma justificativa pedagógica curta.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_activity",
            description: "Cria a atividade educacional estruturada",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                questions: {
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
              required: ["title", "questions"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_activity" } },
      }),
    });

    if (res.status === 429) throw new Error("Limite de uso da IA atingido. Tente novamente em instantes.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados. Recarregue em Configurações.");
    if (!res.ok) throw new Error(`Falha na IA: ${res.status}`);

    const json = await res.json();
    const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Resposta da IA inválida");
    const parsed = JSON.parse(toolCall.function.arguments);

    // Save to DB
    const { data: activity, error } = await context.supabase
      .from("activities")
      .insert({
        owner_id: context.userId,
        title: parsed.title,
        subject: data.subject,
        grade: data.grade,
        topic: data.topic,
        difficulty: data.difficulty,
        activity_type: data.activity_type,
        questions: parsed.questions,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { activity };
  });

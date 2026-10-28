// @ts-nocheck
// Edge Function do Assistente de estudos do BRIO.
// A chave da IA (Google Gemini) fica em secret no servidor (nunca no navegador).
// Deploy: supabase functions deploy assistente
// Secret:  supabase secrets set GEMINI_API_KEY=sua_chave

import { createClient } from "npm:@supabase/supabase-js@2";

const DAILY_LIMIT = 20;
const HISTORY_SIZE = 10;
const MAX_MESSAGE_CHARS = 4000; // questões do vestibular podem ser longas

// Apelidos do Gemini que apontam sempre para a versão mais recente.
// O primeiro é o principal; o segundo entra quando o principal falha ou demora.
const MODELS = ["gemini-flash-latest", "gemini-flash-lite-latest"];
const ATTEMPTS_PER_MODEL = 2;
const TIMEOUT_MS = 25000;
const RETRY_STATUS = [429, 500, 503];

const SYSTEM_PROMPT = `Você é o Assistente de estudos do BRIO, um app de produtividade para estudantes brasileiros.
Ajude com dúvidas de estudo (explicar conteúdos, revisar textos, resolver exercícios passo a passo), organização da rotina e técnicas de estudo.
Responda em português do Brasil, de forma clara e objetiva. Se a pergunta fugir do estudo, recuse com educação e diga o que você pode ajudar.
Não invente fatos: se não tiver certeza, diga isso.`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Chama um modelo do Gemini com algumas tentativas. Devolve a resposta ou null.
async function callModel(model: string, aiKey: string, body: string): Promise<Response | null> {
  for (let attempt = 1; attempt <= ATTEMPTS_PER_MODEL; attempt++) {
    let res: Response | null = null;
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: {
          "x-goog-api-key": aiKey,
          "content-type": "application/json",
        },
        body,
        // Sem limite, uma resposta travada deixa a função esperando até o Supabase cortar.
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      console.error(`[${model}] tentativa ${attempt} falhou:`, String(err));
    }
    if (res?.ok) return res;
    if (res) console.error(`[${model}] tentativa ${attempt} status ${res.status}`, await res.text());
    const retryable = !res || RETRY_STATUS.includes(res.status);
    if (!retryable) return null; // erro que não adianta repetir (ex.: chave inválida)
    if (attempt < ATTEMPTS_PER_MODEL) await new Promise((r) => setTimeout(r, attempt * 1500));
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const aiKey = Deno.env.get("GEMINI_API_KEY");
  if (!aiKey) return json({ error: "Assistente não configurado no servidor." }, 500);

  // Quem está chamando? Usa o token do próprio aluno.
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: userData } = await userClient.auth.getUser();
  if (!userData?.user) return json({ error: "Faça login para usar o assistente." }, 401);
  const userId = userData.user.id;

  let message = "";
  try {
    const body = await req.json();
    message = typeof body?.message === "string" ? body.message.trim() : "";
  } catch {
    return json({ error: "Requisição inválida." }, 400);
  }
  if (!message) return json({ error: "Escreva uma mensagem." }, 400);
  if (message.length > MAX_MESSAGE_CHARS) {
    return json({ error: `A mensagem pode ter no máximo ${MAX_MESSAGE_CHARS} caracteres.` }, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey);

  // Limite diário (contado em UTC).
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const { count: usedToday } = await admin
    .from("assistant_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("role", "user")
    .gte("created_at", startOfDay.toISOString());

  if ((usedToday ?? 0) >= DAILY_LIMIT) {
    return json({ error: `Você atingiu o limite de ${DAILY_LIMIT} perguntas por dia. Volte amanhã.` }, 429);
  }

  // Últimas mensagens para dar contexto. Como só gravamos pares completos
  // (pergunta + resposta), a ordem sempre alterna user/assistant.
  const { data: history } = await admin
    .from("assistant_messages")
    .select("role, content")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_SIZE);

  // O Gemini usa "model" onde o histórico grava "assistant".
  const past = (history ?? []).reverse().map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content as string }],
  }));

  const aiBody = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [...past, { role: "user", parts: [{ text: message }] }],
    generationConfig: { maxOutputTokens: 1024 },
  });

  // Tenta o modelo principal; se falhar, tenta o reserva.
  let aiResponse: Response | null = null;
  for (const model of MODELS) {
    aiResponse = await callModel(model, aiKey, aiBody);
    if (aiResponse) break;
  }

  if (!aiResponse) {
    return json({ error: "O assistente está indisponível agora. Tente de novo em instantes." }, 502);
  }

  const data = await aiResponse.json();
  const reply = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? "")
    .join("")
    .trim();

  if (!reply) return json({ error: "Não consegui gerar uma resposta. Tente reformular." }, 502);

  // Grava o par só depois de dar certo.
  const now = Date.now();
  const { error: insertError } = await admin.from("assistant_messages").insert([
    { user_id: userId, role: "user", content: message, created_at: new Date(now).toISOString() },
    { user_id: userId, role: "assistant", content: reply, created_at: new Date(now + 1).toISOString() },
  ]);
  if (insertError) console.error("Falha ao salvar histórico:", insertError.message);

  return json({ reply, remaining: Math.max(0, DAILY_LIMIT - ((usedToday ?? 0) + 1)) });
});
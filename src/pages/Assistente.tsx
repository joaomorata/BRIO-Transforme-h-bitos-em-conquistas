import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Sparkles, AlertCircle, GraduationCap } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

const DAILY_LIMIT = 20;

const SUGGESTIONS = [
  "Explique fotossíntese de forma simples",
  "Me ajude a montar uma rotina de estudos",
  "Quais são as causas da Revolução Francesa?",
];

// A IA às vezes responde com Markdown (**negrito**, # títulos). Como o chat mostra texto puro,
// removemos essas marcações para não aparecerem os asteriscos na tela.
function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[*-]\s+/gm, "• ")
    .trim();
}

export default function Assistente() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Carrega o histórico do aluno (RLS garante que só vem o dele).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: loadError } = await supabase
        .from("assistant_messages")
        .select("id, role, content, created_at")
        .order("created_at", { ascending: true })
        .limit(200);
      if (cancelled) return;
      if (loadError) setError("Não foi possível carregar o histórico.");
      else {
        const rows = (data as ChatMessage[]) ?? [];
        setMessages(rows);
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const usedToday = rows.filter((m) => m.role === "user" && new Date(m.created_at) >= startOfDay).length;
        setRemaining(Math.max(0, DAILY_LIMIT - usedToday));
      }
      setLoadingHistory(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || sending) return;
    setSending(true);
    setError("");
    setInput("");

    const { data, error: fnError } = await supabase.functions.invoke("assistente", {
      body: { message: text },
    });

    setSending(false);

    // Erros HTTP da função chegam aqui com a mensagem no corpo.
    const serverMsg = (data as { error?: string } | null)?.error;
    if (fnError || serverMsg || !data?.reply) {
      setError(serverMsg || "Não foi possível falar com o assistente. Verifique sua internet.");
      setInput(text);
      return;
    }

    const now = new Date().toISOString();
    setMessages((prev) => [
      ...prev,
      { id: `local-u-${now}`, role: "user", content: text, created_at: now },
      { id: `local-a-${now}`, role: "assistant", content: data.reply as string, created_at: now },
    ]);
    if (typeof data.remaining === "number") setRemaining(data.remaining);
  };

  const limitReached = remaining !== null && remaining <= 0;
  const usedPct = remaining === null ? 0 : ((DAILY_LIMIT - remaining) / DAILY_LIMIT) * 100;
  const isEmpty = !loadingHistory && messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100dvh-7rem)] max-h-[900px] gap-3">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-heading font-bold text-foreground leading-tight">Assistente de estudos</h1>
            <p className="text-xs text-muted-foreground truncate">Tire dúvidas e organize seus estudos</p>
          </div>
        </div>

        {remaining !== null && (
          <div className="shrink-0 text-right">
            <p className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">{remaining}</span> de {DAILY_LIMIT} hoje
            </p>
            <div className="mt-1 h-1 w-24 rounded-full bg-secondary overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", limitReached ? "bg-destructive" : "bg-primary")}
                style={{ width: `${usedPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Conversa */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-card border border-border rounded-2xl p-4 space-y-4">
        {loadingHistory && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}

        {isEmpty && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Como posso ajudar nos estudos?</p>
              <p className="text-xs text-muted-foreground mt-1">Escolha uma sugestão ou escreva sua dúvida.</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={sending || limitReached}
                  className="text-left text-sm px-4 py-2.5 rounded-xl border border-border bg-secondary/40 hover:border-primary/50 hover:bg-secondary/70 text-foreground transition-colors disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex gap-2.5", m.role === "user" ? "justify-end" : "justify-start")}
          >
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed",
                m.role === "user"
                  ? "bg-primary text-white rounded-br-md"
                  : "bg-secondary/50 border border-border text-foreground rounded-bl-md"
              )}
            >
              {m.role === "assistant" ? cleanMarkdown(m.content) : m.content}
            </div>
          </motion.div>
        ))}

        {sending && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-secondary/50 border border-border rounded-2xl rounded-bl-md px-4 py-2.5 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Pensando...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
          <span>{error}</span>
        </div>
      )}

      {/* Campo de mensagem */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="bg-card border border-border rounded-2xl p-2 flex items-end gap-2 focus-within:border-primary/50 transition-colors"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          disabled={sending || limitReached}
          maxLength={1000}
          rows={1}
          placeholder={limitReached ? "Limite diário atingido. Volte amanhã." : "Escreva sua dúvida..."}
          className="flex-1 resize-none bg-transparent px-2 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none disabled:opacity-60 max-h-32"
        />
        <button
          type="submit"
          disabled={sending || limitReached || !input.trim()}
          className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 text-white transition-colors"
          aria-label="Enviar"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

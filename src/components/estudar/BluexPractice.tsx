import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, CheckCircle2, XCircle, RotateCcw, WifiOff, BookMarked, Sparkles, Play, Trophy,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

// Questões do BLUEX (Fuvest/USP e Convest/Unicamp, 2018–2024), somente sem imagem.
// Arquivo estático em /public/banco/bluex.json. Ver o campo "licenca" dentro do arquivo.

interface BluexQuestion {
  id: string;
  vestibular: string;
  ano: number;
  numero: number;
  materia: string;
  materias: string[];
  assunto: string | null;
  nivel_estimado: "fácil" | "médio" | "difícil";
  enunciado: string;
  alternativas: string[];
  gabarito: string; // "A" | "B" | "C" | "D" | "E"
}

interface BluexFile {
  fonte: string;
  licenca: string;
  observacao: string;
  questoes: BluexQuestion[];
}

type Level = "" | "fácil" | "médio" | "difícil";

const LEVELS: { value: Level; label: string; difficulty: "easy" | "medium" | "hard"; color: string }[] = [
  { value: "", label: "Todos", difficulty: "medium", color: "hsl(var(--primary))" },
  { value: "fácil", label: "Fácil", difficulty: "easy", color: "hsl(175 80% 50%)" },
  { value: "médio", label: "Médio", difficulty: "medium", color: "hsl(45 90% 60%)" },
  { value: "difícil", label: "Difícil", difficulty: "hard", color: "hsl(0 72% 55%)" },
];

const LETTERS = ["A", "B", "C", "D", "E"] as const;
const QUESTIONS_PER_SESSION = 10;
const QUANTITY_OPTIONS = [5, 10, 20, 30];
const XP_PER_CORRECT = 15;

// Remove o prefixo "a) " das alternativas e colapsa quebras de linha/espaços vindos do PDF.
function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function cleanAlternative(text: string): string {
  return cleanText(text.replace(/^\s*[a-eA-E]\)\s*/, ""));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function levelColor(nivel: string): string {
  return LEVELS.find((l) => l.value === nivel)?.color ?? "hsl(var(--primary))";
}

type Screen = "select" | "quiz" | "result";

export default function BluexPractice() {
  const { addXP, logQuizResult } = useApp();

  const [all, setAll] = useState<BluexQuestion[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [screen, setScreen] = useState<Screen>("select");
  const [materia, setMateria] = useState("");
  const [assunto, setAssunto] = useState("");
  const [quantidade, setQuantidade] = useState(QUESTIONS_PER_SESSION);
  const [level, setLevel] = useState<Level>("");
  const [questions, setQuestions] = useState<BluexQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [explaining, setExplaining] = useState(false);
  const [explainError, setExplainError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/banco/bluex.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<BluexFile>;
      })
      .then((d) => {
        if (!cancelled) setAll(d.questoes ?? []);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const materias = useMemo(
    () => (all ? [...new Set(all.map((q) => q.materia))].sort((a, b) => a.localeCompare(b, "pt-BR")) : []),
    [all]
  );

  // Assuntos disponíveis para a matéria escolhida (só os que têm questões classificadas).
  const assuntos = useMemo(
    () =>
      materia && all
        ? [...new Set(all.filter((q) => q.materia === materia && q.assunto).map((q) => q.assunto as string))].sort(
            (a, b) => a.localeCompare(b, "pt-BR")
          )
        : [],
    [all, materia]
  );

  const pool = useMemo(
    () =>
      (all ?? []).filter(
        (q) =>
          (!materia || q.materia === materia) &&
          (!assunto || q.assunto === assunto) &&
          (!level || q.nivel_estimado === level)
      ),
    [all, materia, assunto, level]
  );

  // ID sintético (negativo) por matéria, para não colidir com as matérias do banco principal.
  const subjectId = materia ? -(200 + materias.indexOf(materia)) : -200;

  const start = () => {
    setQuestions(shuffle(pool).slice(0, quantidade));
    setIndex(0);
    setScore(0);
    setSelected(null);
    setExplanation("");
    setExplainError("");
    setScreen("quiz");
  };

  const current = questions[index];

  const handleAnswer = (letter: string) => {
    if (selected || !current) return;
    setSelected(letter);
    if (letter === current.gabarito) setScore((s) => s + 1);
  };

  // Manda a questão e a alternativa marcada para o assistente, que explica o erro.
  // Usa a mesma função e o mesmo limite diário do Assistente.
  const explain = async () => {
    if (!current || !selected || explaining) return;
    setExplaining(true);
    setExplainError("");
    setExplanation("");

    const alternativasTexto = current.alternativas
      .map((alt, i) => `${LETTERS[i]}) ${cleanAlternative(alt)}`)
      .join("\n");

    const message = [
      `Questão de vestibular (${current.vestibular} ${current.ano}, ${current.materia}).`,
      `Enunciado: ${cleanText(current.enunciado)}`,
      `Alternativas:\n${alternativasTexto}`,
      `Gabarito oficial: ${current.gabarito}. Eu marquei ${selected}.`,
      `Explique por que a alternativa ${current.gabarito} está certa e por que a ${selected} está errada. Seja objetivo, em português, em texto simples, sem Markdown e sem asteriscos.`,
    ].join("\n\n");

    const { data, error } = await supabase.functions.invoke("assistente", { body: { message } });
    setExplaining(false);

    const serverMsg = (data as { error?: string } | null)?.error;
    if (error || serverMsg || !data?.reply) {
      setExplainError(serverMsg || "Não foi possível gerar a explicação agora. Tente de novo.");
      return;
    }
    setExplanation(String(data.reply));
  };

  const nextQuestion = () => {
    setExplanation("");
    setExplainError("");
    if (index + 1 >= questions.length) {
      const levelInfo = LEVELS.find((l) => l.value === level) ?? LEVELS[0];
      logQuizResult({
        subject_id: subjectId,
        subject_label: `Vestibular · ${materia || "Todas as matérias"} · ${levelInfo.label}`,
        correct: score,
        total: questions.length,
        difficulty: levelInfo.difficulty,
      });
      if (score > 0) addXP(score * XP_PER_CORRECT);
      setScreen("result");
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  };

  if (loadError) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col items-center gap-2 text-center">
        <WifiOff className="w-5 h-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Não foi possível carregar o banco de questões agora.</p>
      </div>
    );
  }

  if (!all) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando questões...</p>
      </div>
    );
  }

  if (screen === "select") {
    return (
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
              <BookMarked className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Questões de vestibular</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Fuvest (USP) e Convest (Unicamp), 2018 a 2024.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">Matéria</p>
            <select
              value={materia}
              onChange={(e) => {
                setMateria(e.target.value);
                setAssunto("");
              }}
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Todas as matérias</option>
              {materias.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {assuntos.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">Assunto</p>
              <select
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Todos os assuntos</option>
                {assuntos.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">Nível</p>
            <div className="grid grid-cols-4 gap-2">
              {LEVELS.map((l) => {
                const active = level === l.value;
                return (
                  <button
                    key={l.value || "all"}
                    onClick={() => setLevel(l.value)}
                    className={cn(
                      "h-10 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-center gap-1.5",
                      active
                        ? "bg-primary text-white border-primary"
                        : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                    )}
                  >
                    {l.value && <span className="w-1.5 h-1.5 rounded-full" style={{ background: l.color }} />}
                    {l.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">Quantidade</p>
            <div className="grid grid-cols-4 gap-2">
              {QUANTITY_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setQuantidade(n)}
                  className={cn(
                    "h-10 rounded-xl border text-sm font-semibold transition-colors",
                    quantidade === n
                      ? "bg-primary text-white border-primary"
                      : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-secondary/40 border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">Questões com esse filtro</p>
            <p className="text-sm font-semibold text-foreground">{pool.length}</p>
          </div>

          <button
            onClick={start}
            disabled={pool.length === 0}
            className="w-full h-11 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            Começar ({Math.min(quantidade, pool.length)} questões)
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed px-1">
          Fonte: BLUEX (Almeida et al., 2023, arXiv:2307.05410). Só questões sem imagem. O nível é uma estimativa
          automática pelo tamanho e pelas matérias da questão, não uma classificação oficial.
        </p>
      </div>
    );
  }

  if (screen === "result") {
    const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
          <Trophy className="w-7 h-7 text-primary" />
        </div>
        <div>
          <p className="text-4xl font-bold text-foreground">
            {score}/{questions.length}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{pct}% de acerto</p>
        </div>
        {score > 0 && (
          <p className="text-sm text-primary font-semibold">+{score * XP_PER_CORRECT} XP ganhos</p>
        )}
        <button
          onClick={() => setScreen("select")}
          className="h-11 px-5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold text-sm inline-flex items-center gap-2 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Praticar de novo
        </button>
      </div>
    );
  }

  if (!current) return null;

  const progressPct = ((index + (selected ? 1 : 0)) / questions.length) * 100;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={index}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        className="space-y-4"
      >
        {/* Progresso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Questão <span className="font-semibold text-foreground">{index + 1}</span> de {questions.length}
            </span>
            <span>
              Acertos <span className="font-semibold text-foreground">{score}</span>/{index + (selected ? 1 : 0)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Enunciado */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground bg-secondary/60 border border-border rounded-full px-2.5 py-0.5">
              {current.vestibular} {current.ano}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground bg-secondary/60 border border-border rounded-full px-2.5 py-0.5">
              {current.materia}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground bg-secondary/60 border border-border rounded-full px-2.5 py-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: levelColor(current.nivel_estimado) }} />
              {current.nivel_estimado}
            </span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{cleanText(current.enunciado)}</p>
        </div>

        {/* Alternativas */}
        <div className="space-y-2">
          {current.alternativas.map((alt, i) => {
            const letter = LETTERS[i];
            const isSelected = selected === letter;
            const isCorrectAlt = letter === current.gabarito;
            const showState = selected !== null;
            return (
              <button
                key={letter}
                onClick={() => handleAnswer(letter)}
                disabled={selected !== null}
                className={cn(
                  "w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3",
                  showState && isCorrectAlt && "bg-accent/10 border-accent",
                  showState && isSelected && !isCorrectAlt && "bg-destructive/10 border-destructive",
                  !showState && "bg-card border-border hover:border-primary/50",
                  showState && !isCorrectAlt && !isSelected && "bg-card border-border opacity-60"
                )}
              >
                <span
                  className={cn(
                    "w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-mono font-bold shrink-0",
                    showState && isCorrectAlt && "border-accent text-accent",
                    showState && isSelected && !isCorrectAlt && "border-destructive text-destructive",
                    !showState && "border-border text-muted-foreground"
                  )}
                >
                  {letter}
                </span>
                <span className="flex-1 text-sm text-foreground leading-relaxed">{cleanAlternative(alt)}</span>
                {showState && isCorrectAlt && <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />}
                {showState && isSelected && !isCorrectAlt && (
                  <XCircle className="w-4 h-4 text-destructive shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explicação com o assistente */}
        {selected && selected !== current.gabarito && !explanation && (
          <button
            onClick={explain}
            disabled={explaining}
            className="w-full h-11 bg-primary/10 hover:bg-primary/15 border border-primary/30 disabled:opacity-60 text-primary rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            {explaining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {explaining ? "Gerando explicação..." : "Não entendi, me explica"}
          </button>
        )}

        {explainError && (
          <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
            <XCircle className="w-4 h-4 shrink-0 mt-px" />
            <span>{explainError}</span>
          </div>
        )}

        {explanation && (
          <div className="bg-card border border-primary/30 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-xs font-semibold text-foreground">Explicação</p>
            </div>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{explanation}</p>
          </div>
        )}

        {selected && (
          <button
            onClick={nextQuestion}
            className="w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold text-sm transition-all"
          >
            {index + 1 >= questions.length ? "Ver resultado" : "Próxima questão"}
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, CheckCircle2, XCircle, RotateCcw, WifiOff, GraduationCap, Sparkles, Play, Trophy,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

const ENEM_YEARS = Array.from({ length: 2023 - 2009 + 1 }, (_, i) => 2023 - i);

// Rótulos curtos para os botões; o nome completo aparece na etiqueta da questão.
const DISCIPLINES = [
  { value: "", label: "Todas", full: "Todas as áreas" },
  { value: "linguagens", label: "Linguagens", full: "Linguagens, Códigos e suas Tecnologias" },
  { value: "ciencias-humanas", label: "Humanas", full: "Ciências Humanas e suas Tecnologias" },
  { value: "ciencias-natureza", label: "Natureza", full: "Ciências da Natureza e suas Tecnologias" },
  { value: "matematica", label: "Matemática", full: "Matemática e suas Tecnologias" },
];

// IDs sintéticos (negativos) para não colidir com os IDs do banco local de questões.
const DISCIPLINE_SUBJECT_ID: Record<string, number> = {
  "": -1,
  linguagens: -2,
  "ciencias-humanas": -3,
  "ciencias-natureza": -4,
  matematica: -5,
};

const QUANTITY_OPTIONS = [5, 10, 20, 30];

interface EnemAlternative {
  letter: "A" | "B" | "C" | "D" | "E";
  text: string | null;
  file: string | null;
  isCorrect: boolean;
}

interface EnemQuestion {
  title: string;
  index: number;
  discipline: string | null;
  year: number;
  context: string | null;
  files: string[];
  correctAlternative: "A" | "B" | "C" | "D" | "E";
  alternativesIntroduction: string | null;
  alternatives: EnemAlternative[];
}

const XP_PER_CORRECT = 25;
const QUESTIONS_PER_SESSION = 10;

function cleanContext(text: string | null): string {
  if (!text) return "";
  // Remove sintaxe de imagem em Markdown (as imagens já são renderizadas separadamente)
  // e limpa marcações básicas de negrito/itálico pra não sobrar asterisco na tela.
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .trim();
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Screen = "select" | "loading" | "quiz" | "result" | "error";

export default function EnemPractice() {
  const { addXP, logQuizResult } = useApp();

  const [screen, setScreen] = useState<Screen>("select");
  const [year, setYear] = useState(ENEM_YEARS[0]);
  const [discipline, setDiscipline] = useState("");
  const [questions, setQuestions] = useState<EnemQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [quantity, setQuantity] = useState(QUESTIONS_PER_SESSION);
  const [errorMsg, setErrorMsg] = useState("");
  const [explanation, setExplanation] = useState("");
  const [explaining, setExplaining] = useState(false);
  const [explainError, setExplainError] = useState("");

  const disciplineInfo = DISCIPLINES.find((d) => d.value === discipline) ?? DISCIPLINES[0];

  const fetchQuestions = async () => {
    setScreen("loading");
    setErrorMsg("");
    try {
      // A API recusa limit muito alto numa chamada só (erro 400), então
      // buscamos a prova em blocos de 45 questões, respeitando o limite de
      // 1 requisição por segundo da api.enem.dev.
      const PAGE_SIZE = 45;
      const PAGES = 4; // 4 x 45 = cobre as 180 questões da prova
      let pool: EnemQuestion[] = [];

      for (let i = 0; i < PAGES; i++) {
        const res = await fetch(
          `https://api.enem.dev/v1/exams/${year}/questions?limit=${PAGE_SIZE}&offset=${i * PAGE_SIZE}`
        );
        if (!res.ok) {
          if (i === 0) throw new Error(`HTTP ${res.status}`);
          break; // já temos algumas questões; para de paginar se uma página falhar
        }
        const data = await res.json();
        const page: EnemQuestion[] = data.questions ?? [];
        pool = pool.concat(page);
        if (page.length < PAGE_SIZE) break; // acabaram as questões dessa prova
        if (i < PAGES - 1) await new Promise((r) => setTimeout(r, 1100));
      }

      if (discipline) pool = pool.filter((q) => q.discipline === discipline);
      // Só mantém questões que realmente têm alternativas de texto/imagem utilizáveis.
      pool = pool.filter((q) => q.alternatives && q.alternatives.length >= 2);

      if (pool.length === 0) {
        setErrorMsg("Não encontramos questões dessa área para esse ano. Tente outra combinação.");
        setScreen("error");
        return;
      }

      const picked = shuffle(pool).slice(0, quantity);
      setQuestions(picked);
      setIndex(0);
      setScore(0);
      setSelected(null);
      setExplanation("");
      setExplainError("");
      setScreen("quiz");
    } catch {
      setErrorMsg(
        "Não foi possível buscar as questões do ENEM agora. Essa é uma prova externa (api.enem.dev) e precisa de internet — os outros modos de estudo continuam funcionando offline."
      );
      setScreen("error");
    }
  };

  const current = questions[index];

  const handleAnswer = (letter: string) => {
    if (selected) return;
    setSelected(letter);
    if (current && letter === current.correctAlternative) {
      setScore((s) => s + 1);
    }
  };

  // Manda a questão e a alternativa marcada para o assistente, que explica o erro.
  // Imagens não são enviadas: a explicação usa só o texto da questão.
  const explain = async () => {
    if (!current || !selected || explaining) return;
    setExplaining(true);
    setExplainError("");
    setExplanation("");

    const contexto = cleanContext(current.context);
    const alternativasTexto = current.alternatives
      .map((alt) => `${alt.letter}) ${alt.text ? cleanContext(alt.text) : "(alternativa em imagem)"}`)
      .join("\n");
    const temImagem = (current.files ?? []).length > 0 || current.alternatives.some((a) => a.file);

    const message = [
      `Questão do ENEM ${current.year}${current.discipline ? ` (${current.discipline})` : ""}.`,
      contexto ? `Enunciado: ${contexto}` : "",
      current.alternativesIntroduction ? current.alternativesIntroduction : "",
      `Alternativas:\n${alternativasTexto}`,
      `Gabarito oficial: ${current.correctAlternative}. Eu marquei ${selected}.`,
      temImagem ? "(A questão tem imagens que não foram enviadas; explique com base no texto disponível.)" : "",
      `Explique por que a alternativa ${current.correctAlternative} está certa e por que a ${selected} está errada. Seja objetivo, em português, em texto simples, sem Markdown e sem asteriscos.`,
    ]
      .filter(Boolean)
      .join("\n\n");

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
      const subjectId = DISCIPLINE_SUBJECT_ID[discipline] ?? -1;
      logQuizResult({
        subject_id: subjectId,
        subject_label: `ENEM ${year} · ${disciplineInfo.full}`,
        correct: score,
        total: questions.length,
        difficulty: "hard",
      });
      if (score > 0) addXP(score * XP_PER_CORRECT);
      setScreen("result");
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  };

  if (screen === "select" || screen === "error") {
    return (
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Questões reais do ENEM</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Buscadas ao vivo da{" "}
                <a href="https://enem.dev" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  api.enem.dev
                </a>
                . Precisa de internet.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">Prova</p>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {ENEM_YEARS.map((y) => (
                <option key={y} value={y}>
                  ENEM {y}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">Área</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {DISCIPLINES.map((d) => {
                const active = discipline === d.value;
                return (
                  <button
                    key={d.value || "all"}
                    onClick={() => setDiscipline(d.value)}
                    className={cn(
                      "h-10 rounded-xl border text-xs font-semibold transition-colors",
                      active
                        ? "bg-primary text-white border-primary"
                        : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                    )}
                  >
                    {d.label}
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
                  onClick={() => setQuantity(n)}
                  className={cn(
                    "h-10 rounded-xl border text-sm font-semibold transition-colors",
                    quantity === n
                      ? "bg-primary text-white border-primary"
                      : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={fetchQuestions}
            className="w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            Buscar {quantity} questões
          </button>
        </div>

        {screen === "error" && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-card border border-border rounded-xl p-4">
            <WifiOff className="w-4 h-4 shrink-0 mt-px" />
            <span>{errorMsg}</span>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground leading-relaxed px-1">
          Provas de 2009 a 2023. As questões vêm de um projeto aberto e não são classificadas por dificuldade.
        </p>
      </div>
    );
  }

  if (screen === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Buscando questões do ENEM {year}... (pode levar alguns segundos)</p>
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
          <p className="text-sm text-muted-foreground mt-1">
            {pct}% de acerto · ENEM {year}
          </p>
        </div>
        {score > 0 && (
          <p className="text-sm text-primary font-semibold">+{score * XP_PER_CORRECT} XP ganhos</p>
        )}
        <button
          onClick={() => setScreen("select")}
          className="h-11 px-5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold text-sm inline-flex items-center gap-2 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Praticar outra prova
        </button>
      </div>
    );
  }

  if (!current) return null;

  const contextText = cleanContext(current.context);
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
              ENEM {year}
            </span>
            {discipline && (
              <span className="text-[11px] font-medium text-muted-foreground bg-secondary/60 border border-border rounded-full px-2.5 py-0.5">
                {disciplineInfo.label}
              </span>
            )}
          </div>

          {contextText && (
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{contextText}</p>
          )}
          {(current.files ?? []).map((url) => (
            <img
              key={url}
              src={url}
              alt="Imagem da questão"
              className="max-w-full rounded-lg border border-border mx-auto"
            />
          ))}
          {current.alternativesIntroduction && (
            <p className="text-sm font-medium text-foreground pt-1">{current.alternativesIntroduction}</p>
          )}
        </div>

        {/* Alternativas */}
        <div className="space-y-2">
          {current.alternatives.map((alt) => {
            const isSelected = selected === alt.letter;
            const isCorrectAlt = alt.letter === current.correctAlternative;
            const showState = selected !== null;
            return (
              <button
                key={alt.letter}
                onClick={() => handleAnswer(alt.letter)}
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
                  {alt.letter}
                </span>
                <span className="flex-1 text-sm text-foreground leading-relaxed">
                  {alt.text && <span className="whitespace-pre-wrap">{cleanContext(alt.text)}</span>}
                  {alt.file && (
                    <img src={alt.file} alt={`Alternativa ${alt.letter}`} className="max-w-full rounded-lg mt-1" />
                  )}
                </span>
                {showState && isCorrectAlt && <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />}
                {showState && isSelected && !isCorrectAlt && (
                  <XCircle className="w-4 h-4 text-destructive shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explicação com o assistente */}
        {selected && selected !== current.correctAlternative && !explanation && (
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

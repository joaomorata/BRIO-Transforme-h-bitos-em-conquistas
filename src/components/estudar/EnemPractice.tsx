import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, RotateCcw, WifiOff, GraduationCap } from "lucide-react";
import { useApp } from "@/context/AppContext";

const ENEM_YEARS = Array.from({ length: 2023 - 2009 + 1 }, (_, i) => 2023 - i);

const DISCIPLINES = [
  { value: "", label: "Todas as áreas" },
  { value: "linguagens", label: "Linguagens, Códigos e suas Tecnologias" },
  { value: "ciencias-humanas", label: "Ciências Humanas e suas Tecnologias" },
  { value: "ciencias-natureza", label: "Ciências da Natureza e suas Tecnologias" },
  { value: "matematica", label: "Matemática e suas Tecnologias" },
];

// IDs sintéticos (negativos) para não colidir com os IDs do banco local de questões.
const DISCIPLINE_SUBJECT_ID: Record<string, number> = {
  "": -1,
  linguagens: -2,
  "ciencias-humanas": -3,
  "ciencias-natureza": -4,
  matematica: -5,
};

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
  const [errorMsg, setErrorMsg] = useState("");

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

      const picked = shuffle(pool).slice(0, QUESTIONS_PER_SESSION);
      setQuestions(picked);
      setIndex(0);
      setScore(0);
      setSelected(null);
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

  const nextQuestion = () => {
    if (index + 1 >= questions.length) {
      const subjectId = DISCIPLINE_SUBJECT_ID[discipline] ?? -1;
      const disciplineLabel = DISCIPLINES.find((d) => d.value === discipline)?.label ?? "Todas as áreas";
      logQuizResult({
        subject_id: subjectId,
        subject_label: `ENEM ${year} · ${disciplineLabel}`,
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
      <div className="space-y-5">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Questões reais do ENEM</p>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Buscadas ao vivo da{" "}
            <a
              href="https://enem.dev"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              api.enem.dev
            </a>{" "}
            — projeto aberto com provas de 2009 a 2023. Precisa de internet.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="flex-1 h-11 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {ENEM_YEARS.map((y) => (
                <option key={y} value={y}>
                  ENEM {y}
                </option>
              ))}
            </select>
            <select
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
              className="flex-1 h-11 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {DISCIPLINES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchQuestions}
            className="mt-4 w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold text-sm transition-all"
          >
            Buscar questões
          </button>
        </div>

        {screen === "error" && (
          <div className="bg-card border border-border rounded-2xl p-5 flex flex-col items-center gap-2 text-center">
            <WifiOff className="w-5 h-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
          </div>
        )}
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
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <p className="text-4xl font-bold text-foreground mb-1">
          {score}/{questions.length}
        </p>
        <p className="text-sm text-muted-foreground mb-4">{pct}% de acerto · ENEM {year}</p>
        {score > 0 && (
          <p className="text-sm text-primary font-semibold mb-4">+{score * XP_PER_CORRECT} XP ganhos</p>
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

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={index}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Questão {index + 1} de {questions.length} · ENEM {year}
          </span>
          <span>
            Acertos: {score}/{index}
          </span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          {contextText && (
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{contextText}</p>
          )}
          {current.files.map((url) => (
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
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                  showState && isCorrectAlt
                    ? "bg-accent/10 border-accent"
                    : showState && isSelected
                    ? "bg-destructive/10 border-destructive"
                    : "bg-secondary/30 border-border hover:border-primary/40"
                }`}
              >
                <span className="text-xs font-mono font-bold text-muted-foreground shrink-0 mt-0.5">
                  {alt.letter}
                </span>
                <span className="flex-1 text-sm text-foreground">
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

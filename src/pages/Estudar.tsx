import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Trophy, RotateCcw, CheckCircle2, XCircle, Loader2, CalendarClock, Plus, Trash2, Play } from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useApp } from "@/context/AppContext";
import { STUDY_QUESTIONS } from "@/data/studyQuestions";
import EnemPractice from "@/components/estudar/EnemPractice";

const SUBJECTS = [
  { id: 17, label: "Ciências", emoji: "🔬" },
  { id: 23, label: "História", emoji: "📜" },
  { id: 22, label: "Geografia", emoji: "🌍" },
  { id: 19, label: "Matemática", emoji: "➗" },
  { id: 10, label: "Literatura", emoji: "📚" },
  { id: 18, label: "Informática", emoji: "💻" },
  { id: 25, label: "Arte", emoji: "🎨" },
  { id: 21, label: "Esportes", emoji: "⚽" },
];

const DIFFICULTIES = [
  { id: "easy", label: "Fácil", xp: 10, badge: "🟢" },
  { id: "medium", label: "Médio", xp: 20, badge: "🟡" },
  { id: "hard", label: "Difícil", xp: 30, badge: "🔴" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function subjectAccuracy(
  quizResults: { subject_id: number; correct: number; total: number }[],
  subjectId: number
): number | null {
  const results = quizResults.filter((r) => r.subject_id === subjectId);
  if (!results.length) return null;
  const totalCorrect = results.reduce((sum, r) => sum + r.correct, 0);
  const totalQuestions = results.reduce((sum, r) => sum + r.total, 0);
  return totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : null;
}

function recommendPace(daysRemaining: number): string {
  if (daysRemaining < 0) return "A data marcada já passou — hora de atualizar o plano.";
  if (daysRemaining === 0) return "É hoje! Foque numa revisão rápida dos pontos que você mais erra.";
  if (daysRemaining <= 3) return "Reta final: pelo menos uma sessão por dia até a prova.";
  if (daysRemaining <= 7) return "Essa semana, tente 1 sessão por dia.";
  if (daysRemaining <= 14) return "Recomendo 3 a 4 sessões por semana.";
  return "2 sessões por semana já ajudam — vá aumentando conforme a data se aproximar.";
}

interface Question {
  question: string;
  correct: string;
  options: string[];
}

type Screen = "select" | "loading" | "quiz" | "result";
type PageView = "practice" | "examMode" | "enem";

export default function Estudar() {
  const { addXP, logQuizResult, examPlans, quizResults, addExamPlan, deleteExamPlan } = useApp();

  const [pageView, setPageView] = useState<PageView>("practice");
  const [screen, setScreen] = useState<Screen>("select");
  const [selectedSubject, setSelectedSubject] = useState<typeof SUBJECTS[0] | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(DIFFICULTIES[0]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [error, setError] = useState("");
  const [examSubjectId, setExamSubjectId] = useState<number | "">("");
  const [examDate, setExamDate] = useState("");

  const startQuiz = useCallback(
    async (subjectOverride?: typeof SUBJECTS[0]) => {
      const subject = subjectOverride ?? selectedSubject;
      if (!subject) return;
      setSelectedSubject(subject);
      setScreen("loading");
      setError("");
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      const subjectQuestions = STUDY_QUESTIONS.filter((question) => question.subjectId === subject.id);
      if (!subjectQuestions.length) {
        setError("Ainda não há questões disponíveis para essa matéria.");
        setScreen("select");
        return;
      }
      const mapped: Question[] = shuffle(subjectQuestions).map((question) => ({
        question: question.question,
        correct: question.correct,
        options: shuffle([question.correct, ...question.incorrect]),
      }));
      setQuestions(mapped);
      setCurrentIndex(0);
      setScore(0);
      setTotalXP(0);
      setSelected(null);
      setScreen("quiz");
    },
    [selectedSubject]
  );

  const practiceFromExamPlan = useCallback(
    (subjectId: number) => {
      const subject = SUBJECTS.find((s) => s.id === subjectId);
      if (!subject) return;
      setPageView("practice");
      startQuiz(subject);
    },
    [startQuiz]
  );

  const handleAnswer = useCallback(
    (option: string) => {
      if (selected !== null) return;
      setSelected(option);
      const isCorrect = option === questions[currentIndex].correct;
      if (isCorrect) {
        setScore((s) => s + 1);
        setTotalXP((x) => x + selectedDifficulty.xp);
        addXP(selectedDifficulty.xp);
      }
    },
    [selected, questions, currentIndex, selectedDifficulty, addXP]
  );

  const nextQuestion = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      if (selectedSubject) {
        logQuizResult({
          subject_id: selectedSubject.id,
          subject_label: selectedSubject.label,
          correct: score,
          total: questions.length,
          difficulty: selectedDifficulty.id,
        });
      }
      setScreen("result");
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
    }
  }, [currentIndex, questions.length, selectedSubject, selectedDifficulty, score, logQuizResult]);

  const reset = () => {
    setScreen("select");
    setSelected(null);
    setQuestions([]);
  };

  const current = questions[currentIndex];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Estudar</h1>
            <p className="text-sm text-muted-foreground">Pratique em português e ganhe XP real.</p>
      </div>

      <div className="flex gap-2 bg-secondary/50 border border-border rounded-xl p-1">
        <button
          onClick={() => setPageView("practice")}
          className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-colors ${
            pageView === "practice" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Praticar
        </button>
        <button
          onClick={() => setPageView("enem")}
          className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-colors ${
            pageView === "enem" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          ENEM
        </button>
        <button
          onClick={() => setPageView("examMode")}
          className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
            pageView === "examMode" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarClock className="w-3.5 h-3.5" />
          Modo Prova
        </button>
      </div>

      {pageView === "enem" && <EnemPractice />}

      {pageView === "examMode" ? (
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-2xl p-6">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
              Nova prova
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={examSubjectId}
                onChange={(e) => setExamSubjectId(e.target.value ? Number(e.target.value) : "")}
                className="flex-1 h-11 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Selecione a matéria</option>
                {SUBJECTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.emoji} {s.label}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="h-11 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={() => {
                  if (!examSubjectId || !examDate) return;
                  const subject = SUBJECTS.find((s) => s.id === examSubjectId);
                  if (!subject) return;
                  addExamPlan({ subject_id: subject.id, subject_label: subject.label, exam_date: examDate });
                  setExamSubjectId("");
                  setExamDate("");
                }}
                disabled={!examSubjectId || !examDate}
                className="h-11 px-4 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </div>
          </div>

          {examPlans.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma prova marcada ainda. Adicione uma matéria e uma data acima.
            </p>
          ) : (
            <div className="space-y-3">
              {examPlans
                .slice()
                .sort((a, b) => a.exam_date.localeCompare(b.exam_date))
                .map((plan) => {
                  const daysRemaining = differenceInCalendarDays(new Date(`${plan.exam_date}T00:00:00`), new Date());
                  const accuracy = subjectAccuracy(quizResults, plan.subject_id);
                  const subject = SUBJECTS.find((s) => s.id === plan.subject_id);
                  return (
                    <div key={plan.id} className="bg-card border border-border rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground flex items-center gap-2">
                            <span>{subject?.emoji}</span>
                            {plan.subject_label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(`${plan.exam_date}T00:00:00`), "d 'de' MMMM", { locale: ptBR })}
                            {" · "}
                            {daysRemaining < 0
                              ? "data já passou"
                              : daysRemaining === 0
                              ? "é hoje"
                              : `${daysRemaining} dia${daysRemaining === 1 ? "" : "s"} restante${daysRemaining === 1 ? "" : "s"}`}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteExamPlan(plan.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          aria-label="Remover plano"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs text-muted-foreground mt-3">{recommendPace(daysRemaining)}</p>

                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs text-muted-foreground">
                          {accuracy === null ? "Sem histórico ainda nessa matéria" : `Seu aproveitamento: ${accuracy}%`}
                        </span>
                        <button
                          onClick={() => practiceFromExamPlan(plan.subject_id)}
                          className="h-9 px-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          Praticar agora
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      ) : pageView === "practice" ? (
      <AnimatePresence mode="wait">

        {/* ── SELEÇÃO ── */}
        {screen === "select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-5"
          >
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="bg-card border border-border rounded-2xl p-6">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
                Escolha a matéria
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SUBJECTS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSubject(s)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedSubject?.id === s.id
                        ? "border-primary bg-primary/10 scale-[1.04]"
                        : "border-border hover:border-primary/40 hover:bg-secondary/50"
                    }`}
                  >
                    <span className="text-2xl">{s.emoji}</span>
                    <span className="text-xs font-semibold text-center leading-tight">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
                Dificuldade
              </p>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDifficulty(d)}
                    className={`flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedDifficulty.id === d.id
                        ? "border-primary bg-primary/10 scale-[1.04]"
                        : "border-border hover:border-primary/40 hover:bg-secondary/50"
                    }`}
                  >
                    <span className="text-xl">{d.badge}</span>
                    <span className="text-xs sm:text-sm font-semibold">{d.label}</span>
                    <span className="text-[10px] sm:text-xs text-primary font-mono font-bold text-center">
                      +{d.xp} XP<span className="hidden sm:inline">/acerto</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => startQuiz()}
              disabled={!selectedSubject}
              className="w-full h-12 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_hsl(250_85%_65%/0.25)]"
            >
              <BookOpen className="w-4 h-4" />
              {selectedSubject ? `Começar — ${selectedSubject.emoji} ${selectedSubject.label}` : "Selecione uma matéria"}
            </button>
          </motion.div>
        )}

        {/* ── LOADING ── */}
        {screen === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-40 gap-4"
          >
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground text-sm">Preparando questões em português...</p>
          </motion.div>
        )}

        {/* ── QUIZ ── */}
        {screen === "quiz" && current && (
          <motion.div
            key={`quiz-${currentIndex}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* Barra de progresso */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-mono shrink-0">
                {currentIndex + 1}/{questions.length}
              </span>
            </div>

            {/* Info topo */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {selectedSubject?.emoji} {selectedSubject?.label} · {selectedDifficulty.label}
              </span>
              <span className="text-xs font-mono text-primary font-bold">+{totalXP} XP</span>
            </div>

            {/* Pergunta */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
                Questão {currentIndex + 1}
              </p>
              <p className="text-base font-semibold leading-relaxed">{current.question}</p>
            </div>

            {/* Opções */}
            <div className="grid gap-3">
              {current.options.map((opt, i) => {
                const isCorrect = opt === current.correct;
                const isSelected = opt === selected;
                const revealed = selected !== null;

                let cls = "border-border hover:border-primary/50 hover:bg-secondary/50";
                if (revealed && isCorrect) cls = "border-green-500 bg-green-500/10";
                else if (revealed && isSelected && !isCorrect) cls = "border-red-500 bg-red-500/10";
                else if (revealed) cls = "border-border opacity-40";

                return (
                  <motion.button
                    key={opt}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => handleAnswer(opt)}
                    disabled={revealed}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${cls}`}
                  >
                    <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">
                      {["A", "B", "C", "D"][i]}
                    </span>
                    <span className="text-sm font-medium flex-1 leading-snug">{opt}</span>
                    {revealed && isCorrect && <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />}
                    {revealed && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                  </motion.button>
                );
              })}
            </div>

            {/* Feedback + próxima */}
            <AnimatePresence>
              {selected !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    selected === current.correct
                      ? "bg-green-500/10 border-green-500/20 text-green-400"
                      : "bg-red-500/10 border-red-500/20 text-red-400"
                  }`}
                >
                  <span className="text-sm font-semibold">
                    {selected === current.correct
                      ? `✅ Correto! +${selectedDifficulty.xp} XP`
                      : `❌ Errou! Resposta: ${current.correct}`}
                  </span>
                  <button
                    onClick={nextQuestion}
                    className="text-sm font-bold text-primary hover:underline underline-offset-2"
                  >
                    {currentIndex + 1 >= questions.length ? "Ver resultado →" : "Próxima →"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── RESULTADO ── */}
        {screen === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-6 text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-primary" />
            </div>

            <div>
              <h2 className="text-2xl font-heading font-black">Quiz Concluído!</h2>
              <p className="text-muted-foreground text-sm mt-1">
                {selectedSubject?.emoji} {selectedSubject?.label} · {selectedDifficulty.label}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full">
              <div className="bg-secondary rounded-xl p-2.5 sm:p-4">
                <p className="text-lg sm:text-2xl font-heading font-black">{score}/{questions.length}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Acertos</p>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-2.5 sm:p-4">
                <p className="text-lg sm:text-2xl font-heading font-black text-primary">+{totalXP}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">XP ganho</p>
              </div>
              <div className="bg-secondary rounded-xl p-2.5 sm:p-4">
                <p className="text-lg sm:text-2xl font-heading font-black">
                  {Math.round((score / questions.length) * 100)}%
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Aproveit.</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {score === questions.length
                ? "🔥 Perfeito! Mandou muito bem!"
                : score >= questions.length * 0.7
                ? "👏 Ótimo resultado! Continue assim!"
                : score >= questions.length * 0.5
                ? "📚 Bom esforço! Revise o conteúdo."
                : "💪 Continue estudando! Você vai melhorar!"}
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => startQuiz()}
                className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Jogar de novo
              </button>
              <button
                onClick={reset}
                className="flex-1 h-11 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl font-semibold text-sm transition-all"
              >
                Trocar matéria
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
      ) : null}
    </div>
  );
}

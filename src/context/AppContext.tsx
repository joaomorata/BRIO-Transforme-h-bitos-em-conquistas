import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { format, subDays } from "date-fns";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: "study" | "work" | "health" | "personal";
  priority: "low" | "medium" | "high";
  status: "pending" | "completed";
  xp_reward: number;
  pomodoros_target: number;
  due_date?: string;
  created_at: string;
  completed_at?: string;
}

export interface WeeklyXPEntry {
  date: string;
  xp: number;
}

export interface UserStats {
  total_xp: number;
  level: number;
  current_streak: number;
  best_streak: number;
  tasks_completed: number;
  pomodoros_completed: number;
  total_focus_minutes: number;
  last_active_date: string;
  weekly_xp_log: WeeklyXPEntry[];
}

export type SyncStatus = "offline" | "syncing" | "synced";

export interface MoodEntry {
  id: string;
  energy: 1 | 2 | 3 | 4 | 5;
  context: "pre_focus" | "post_focus";
  occurred_at: string;
}

export interface QuizResult {
  id: string;
  subject_id: number;
  subject_label: string;
  correct: number;
  total: number;
  difficulty: string;
  finished_at: string;
}

export interface ExamPlan {
  id: string;
  subject_id: number;
  subject_label: string;
  exam_date: string;
  created_at: string;
}

export const XP_PER_LEVEL = 200;

export function calculateLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function xpForNextLevel(xp: number): number {
  const level = calculateLevel(xp);
  return level * XP_PER_LEVEL;
}

export function xpProgress(xp: number): number {
  const level = calculateLevel(xp);
  const prevLevelXP = (level - 1) * XP_PER_LEVEL;
  const nextLevelXP = level * XP_PER_LEVEL;
  return ((xp - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100;
}

// Conteúdo inicial sugerido para quem acabou de criar a conta.
// É gravado no Supabase na primeira sincronização, não é "dado fake" permanente.
const sampleTasks: Task[] = [
  {
    id: crypto.randomUUID(),
    title: "Estudar React e TypeScript",
    description: "Revisar hooks e generics",
    category: "study",
    priority: "high",
    status: "pending",
    xp_reward: 30,
    pomodoros_target: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: "Fazer exercícios físicos",
    description: "30 minutos de caminhada",
    category: "health",
    priority: "medium",
    status: "pending",
    xp_reward: 20,
    pomodoros_target: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: "Revisar relatório do projeto",
    category: "work",
    priority: "high",
    status: "pending",
    xp_reward: 25,
    pomodoros_target: 3,
    created_at: new Date().toISOString(),
  },
];

const sampleStats: UserStats = {
  total_xp: 0,
  level: 1,
  current_streak: 0,
  best_streak: 0,
  tasks_completed: 0,
  pomodoros_completed: 0,
  total_focus_minutes: 0,
  last_active_date: format(new Date(), "yyyy-MM-dd"),
  weekly_xp_log: [],
};

interface AppContextType {
  stats: UserStats;
  tasks: Task[];
  moodEntries: MoodEntry[];
  quizResults: QuizResult[];
  examPlans: ExamPlan[];
  syncStatus: SyncStatus;
  addXP: (amount: number) => void;
  completeTask: (taskId: string) => void;
  addTask: (task: Omit<Task, "id" | "created_at" | "status">) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addPomodoro: () => void;
  logMood: (energy: MoodEntry["energy"], context: MoodEntry["context"]) => void;
  logQuizResult: (result: Omit<QuizResult, "id" | "finished_at">) => void;
  addExamPlan: (plan: Omit<ExamPlan, "id" | "created_at">) => void;
  deleteExamPlan: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

function statsKey(userId: string | null) {
  return userId ? `brio_stats_${userId}` : "brio_stats_guest";
}

function tasksKey(userId: string | null) {
  return userId ? `brio_tasks_${userId}` : "brio_tasks_guest";
}

function moodKey(userId: string | null) {
  return userId ? `brio_mood_${userId}` : "brio_mood_guest";
}

function quizKey(userId: string | null) {
  return userId ? `brio_quiz_${userId}` : "brio_quiz_guest";
}

function examPlanKey(userId: string | null) {
  return userId ? `brio_examplans_${userId}` : "brio_examplans_guest";
}

// Contador de mutações feitas localmente que ainda não foram confirmadas no
// Supabase. Persistido no localStorage (não em memória) para sobreviver a um
// F5 no meio de uma sessão offline — é o que evita que uma sincronização
// futura sobrescreva mudanças locais mais novas com dados antigos da nuvem.
function pendingKey(userId: string | null) {
  return userId ? `brio_pending_${userId}` : "brio_pending_guest";
}

function readPending(userId: string | null): number {
  try {
    return parseInt(localStorage.getItem(pendingKey(userId)) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

function bumpPending(userId: string | null, delta: number) {
  const next = Math.max(0, readPending(userId) + delta);
  try {
    localStorage.setItem(pendingKey(userId), String(next));
  } catch {
    // localStorage indisponível: segue sem persistir o contador.
  }
  return next;
}

function readLocalStats(userId: string | null): UserStats {
  try {
    const raw = localStorage.getItem(statsKey(userId));
    return raw ? JSON.parse(raw) : sampleStats;
  } catch {
    return sampleStats;
  }
}

function readLocalTasks(userId: string | null): Task[] {
  try {
    const raw = localStorage.getItem(tasksKey(userId));
    return raw ? JSON.parse(raw) : sampleTasks;
  } catch {
    return sampleTasks;
  }
}

function readLocalMood(userId: string | null): MoodEntry[] {
  try {
    const raw = localStorage.getItem(moodKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function readLocalQuiz(userId: string | null): QuizResult[] {
  try {
    const raw = localStorage.getItem(quizKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function readLocalExamPlans(userId: string | null): ExamPlan[] {
  try {
    const raw = localStorage.getItem(examPlanKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [stats, setStats] = useState<UserStats>(() => readLocalStats(userId));
  const [tasks, setTasks] = useState<Task[]>(() => readLocalTasks(userId));
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>(() => readLocalMood(userId));
  const [quizResults, setQuizResults] = useState<QuizResult[]>(() => readLocalQuiz(userId));
  const [examPlans, setExamPlans] = useState<ExamPlan[]>(() => readLocalExamPlans(userId));
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("offline");

  // Guarda o id do usuário atual sem precisar recriar os callbacks de push a cada troca.
  const userIdRef = useRef(userId);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // Marca a qual usuário os dados em `stats`/`tasks`/etc. pertencem de fato.
  // Evita uma corrida: ao trocar de conta, o efeito de "salvar no cache"
  // dispara antes do efeito de "carregar a nova conta" ter atualizado o
  // estado — sem essa trava, ele gravaria os dados da conta ANTIGA sob a
  // chave da conta NOVA.
  const stateOwnerRef = useRef(userId);

  // Cache local: sempre grava, funciona sem internet — mas só se o estado em
  // memória realmente já pertence ao usuário atual (ver stateOwnerRef acima).
  useEffect(() => {
    if (stateOwnerRef.current !== userId) return;
    localStorage.setItem(statsKey(userId), JSON.stringify(stats));
  }, [stats, userId]);

  useEffect(() => {
    if (stateOwnerRef.current !== userId) return;
    localStorage.setItem(tasksKey(userId), JSON.stringify(tasks));
  }, [tasks, userId]);

  useEffect(() => {
    if (stateOwnerRef.current !== userId) return;
    localStorage.setItem(moodKey(userId), JSON.stringify(moodEntries));
  }, [moodEntries, userId]);

  useEffect(() => {
    if (stateOwnerRef.current !== userId) return;
    localStorage.setItem(quizKey(userId), JSON.stringify(quizResults));
  }, [quizResults, userId]);

  useEffect(() => {
    if (stateOwnerRef.current !== userId) return;
    localStorage.setItem(examPlanKey(userId), JSON.stringify(examPlans));
  }, [examPlans, userId]);

  // Ao logar (ou trocar de conta no mesmo navegador), carrega o cache local
  // na hora e tenta buscar/gravar no Supabase em segundo plano.
  useEffect(() => {
    stateOwnerRef.current = userId;
    setStats(readLocalStats(userId));
    setTasks(readLocalTasks(userId));
    setMoodEntries(readLocalMood(userId));
    setQuizResults(readLocalQuiz(userId));
    setExamPlans(readLocalExamPlans(userId));

    if (!userId) {
      setSyncStatus("offline");
      return;
    }

    let cancelled = false;

    const pendingCount = readPending(userId);

    if (pendingCount > 0) {
      // Havia mudanças feitas offline na última sessão que ainda não foram
      // confirmadas no Supabase. Em vez de buscar a versão da nuvem (que
      // sobrescreveria essas mudanças com dados antigos), reenviamos o
      // snapshot local — upsert é idempotente, então é seguro tentar de novo.
      setSyncStatus("syncing");
      (async () => {
        try {
          const localStatsSnap = readLocalStats(userId);
          const { error: statsErr } = await supabase
            .from("user_stats")
            .upsert(
              {
                user_id: userId,
                ...localStatsSnap,
                display_name: user?.name ?? null,
                avatar_color: user?.avatarColor ?? null,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );
          if (statsErr) throw statsErr;

          const localTasksSnap = readLocalTasks(userId);
          if (localTasksSnap.length > 0) {
            const { error: tasksErr } = await supabase
              .from("tasks")
              .upsert(localTasksSnap.map((t) => ({ ...t, user_id: userId })), { onConflict: "id" });
            if (tasksErr) throw tasksErr;
          }

          const localMoodSnap = readLocalMood(userId);
          if (localMoodSnap.length > 0) {
            const { error: moodErr } = await supabase
              .from("mood_entries")
              .upsert(localMoodSnap.map((m) => ({ ...m, user_id: userId })), { onConflict: "id" });
            if (moodErr) throw moodErr;
          }

          const localQuizSnap = readLocalQuiz(userId);
          if (localQuizSnap.length > 0) {
            const { error: quizErr } = await supabase
              .from("quiz_results")
              .upsert(localQuizSnap.map((q) => ({ ...q, user_id: userId })), { onConflict: "id" });
            if (quizErr) throw quizErr;
          }

          const localExamSnap = readLocalExamPlans(userId);
          if (localExamSnap.length > 0) {
            const { error: examErr } = await supabase
              .from("exam_plans")
              .upsert(localExamSnap.map((p) => ({ ...p, user_id: userId })), { onConflict: "id" });
            if (examErr) throw examErr;
          }

          // Tudo confirmado na nuvem: zera o contador de pendências.
          localStorage.setItem(pendingKey(userId), "0");
          if (!cancelled) setSyncStatus("synced");
        } catch {
          // Ainda sem internet (ou Supabase fora do ar): mantém o contador
          // e segue 100% funcional com o cache local. Tenta de novo no
          // próximo carregamento ou na próxima mutação.
          if (!cancelled) setSyncStatus("offline");
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    setSyncStatus("syncing");

    (async () => {
      try {
        const { data: statsRow, error: statsError } = await supabase
          .from("user_stats")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (statsError) throw statsError;
        if (cancelled) return;

        if (statsRow) {
          const {
            user_id: _uid,
            updated_at: _u,
            display_name: _dn,
            avatar_color: _ac,
            ...rest
          } = statsRow as Record<string, unknown>;
          setStats(rest as unknown as UserStats);
        } else {
          const seed = readLocalStats(userId);
          const { error: insertError } = await supabase
            .from("user_stats")
            .insert({
              user_id: userId,
              ...seed,
              display_name: user?.name ?? null,
              avatar_color: user?.avatarColor ?? null,
            });
          if (insertError) throw insertError;
          setStats(seed);
        }

        const { data: taskRows, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (tasksError) throw tasksError;
        if (cancelled) return;

        if (taskRows && taskRows.length > 0) {
          setTasks(
            taskRows.map((row: Record<string, unknown>) => {
              const { user_id: _uid, ...rest } = row;
              return rest as unknown as Task;
            })
          );
        } else {
          // Conta nova sem tarefas no banco ainda: envia as tarefas de exemplo locais.
          const seedTasks = readLocalTasks(userId);
          await supabase
            .from("tasks")
            .insert(seedTasks.map((t) => ({ ...t, user_id: userId })));
          setTasks(seedTasks);
        }

        const { data: moodRows, error: moodError } = await supabase
          .from("mood_entries")
          .select("*")
          .eq("user_id", userId)
          .order("occurred_at", { ascending: false })
          .limit(200);

        if (moodError) throw moodError;
        if (cancelled) return;

        if (moodRows) {
          setMoodEntries(
            moodRows.map((row: Record<string, unknown>) => {
              const { user_id: _uid, ...rest } = row;
              return rest as unknown as MoodEntry;
            })
          );
        }

        const { data: quizRows, error: quizError } = await supabase
          .from("quiz_results")
          .select("*")
          .eq("user_id", userId)
          .order("finished_at", { ascending: false })
          .limit(300);

        if (quizError) throw quizError;
        if (cancelled) return;

        if (quizRows) {
          setQuizResults(
            quizRows.map((row: Record<string, unknown>) => {
              const { user_id: _uid, ...rest } = row;
              return rest as unknown as QuizResult;
            })
          );
        }

        const { data: examRows, error: examError } = await supabase
          .from("exam_plans")
          .select("*")
          .eq("user_id", userId)
          .order("exam_date", { ascending: true });

        if (examError) throw examError;
        if (cancelled) return;

        if (examRows) {
          setExamPlans(
            examRows.map((row: Record<string, unknown>) => {
              const { user_id: _uid, ...rest } = row;
              return rest as unknown as ExamPlan;
            })
          );
        }

        setSyncStatus("synced");
      } catch {
        // Sem internet ou projeto fora do ar: segue 100% funcional com o cache local.
        setSyncStatus("offline");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const pushStats = useCallback((next: UserStats) => {
    const uid = userIdRef.current;
    if (!uid) return;
    bumpPending(uid, 1);
    setSyncStatus("syncing");
    supabase
      .from("user_stats")
      .upsert(
        {
          user_id: uid,
          ...next,
          display_name: user?.name ?? null,
          avatar_color: user?.avatarColor ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .then(({ error }) => {
        if (!error) bumpPending(uid, -1);
        setSyncStatus(error ? "offline" : "synced");
      });
  }, [user]);

  const pushTaskUpsert = useCallback((task: Task) => {
    const uid = userIdRef.current;
    if (!uid) return;
    bumpPending(uid, 1);
    setSyncStatus("syncing");
    supabase
      .from("tasks")
      .upsert({ ...task, user_id: uid }, { onConflict: "id" })
      .then(({ error }) => {
        if (!error) bumpPending(uid, -1);
        setSyncStatus(error ? "offline" : "synced");
      });
  }, []);

  const pushTaskDelete = useCallback((taskId: string) => {
    const uid = userIdRef.current;
    if (!uid) return;
    bumpPending(uid, 1);
    setSyncStatus("syncing");
    supabase
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .then(({ error }) => {
        if (!error) bumpPending(uid, -1);
        setSyncStatus(error ? "offline" : "synced");
      });
  }, []);

  const pushMoodEntry = useCallback((entry: MoodEntry) => {
    const uid = userIdRef.current;
    if (!uid) return;
    bumpPending(uid, 1);
    setSyncStatus("syncing");
    supabase
      .from("mood_entries")
      .upsert({ ...entry, user_id: uid }, { onConflict: "id" })
      .then(({ error }) => {
        if (!error) bumpPending(uid, -1);
        setSyncStatus(error ? "offline" : "synced");
      });
  }, []);

  const pushQuizResult = useCallback((result: QuizResult) => {
    const uid = userIdRef.current;
    if (!uid) return;
    bumpPending(uid, 1);
    setSyncStatus("syncing");
    supabase
      .from("quiz_results")
      .upsert({ ...result, user_id: uid }, { onConflict: "id" })
      .then(({ error }) => {
        if (!error) bumpPending(uid, -1);
        setSyncStatus(error ? "offline" : "synced");
      });
  }, []);

  const pushExamPlanInsert = useCallback((plan: ExamPlan) => {
    const uid = userIdRef.current;
    if (!uid) return;
    bumpPending(uid, 1);
    setSyncStatus("syncing");
    supabase
      .from("exam_plans")
      .upsert({ ...plan, user_id: uid }, { onConflict: "id" })
      .then(({ error }) => {
        if (!error) bumpPending(uid, -1);
        setSyncStatus(error ? "offline" : "synced");
      });
  }, []);

  const pushExamPlanDelete = useCallback((id: string) => {
    const uid = userIdRef.current;
    if (!uid) return;
    bumpPending(uid, 1);
    setSyncStatus("syncing");
    supabase
      .from("exam_plans")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (!error) bumpPending(uid, -1);
        setSyncStatus(error ? "offline" : "synced");
      });
  }, []);

  // Cálculo de XP/nível/streak isolado para poder ser reaproveitado
  // por addXP, completeTask e addPomodoro num único update atômico.
  const applyXP = useCallback((prev: UserStats, amount: number): UserStats => {
    const today = format(new Date(), "yyyy-MM-dd");
    const newXP = prev.total_xp + amount;
    const newLevel = calculateLevel(newXP);
    let weeklyLog = [...prev.weekly_xp_log];
    const todayEntry = weeklyLog.find((e) => e.date === today);
    if (todayEntry) {
      todayEntry.xp += amount;
    } else {
      weeklyLog.push({ date: today, xp: amount });
    }
    weeklyLog = weeklyLog.slice(-14);
    let streak = prev.current_streak;
    let bestStreak = prev.best_streak;
    if (prev.last_active_date !== today) {
      const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
      streak = prev.last_active_date === yesterday ? streak + 1 : 1;
      bestStreak = Math.max(bestStreak, streak);
    }
    return {
      ...prev,
      total_xp: newXP,
      level: newLevel,
      current_streak: streak,
      best_streak: bestStreak,
      last_active_date: today,
      weekly_xp_log: weeklyLog,
    };
  }, []);

  const addXP = useCallback(
    (amount: number) => {
      setStats((prev) => {
        const next = applyXP(prev, amount);
        pushStats(next);
        return next;
      });
    },
    [applyXP, pushStats]
  );

  const completeTask = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.status === "completed") return;

      const updatedTask: Task = { ...task, status: "completed", completed_at: new Date().toISOString() };
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
      pushTaskUpsert(updatedTask);

      setStats((prev) => {
        const withCount = { ...prev, tasks_completed: prev.tasks_completed + 1 };
        const next = applyXP(withCount, task.xp_reward);
        pushStats(next);
        return next;
      });
    },
    [tasks, applyXP, pushStats, pushTaskUpsert]
  );

  const addTask = useCallback(
    (data: Omit<Task, "id" | "created_at" | "status">) => {
      const newTask: Task = {
        ...data,
        id: crypto.randomUUID(),
        status: "pending",
        created_at: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
      pushTaskUpsert(newTask);
    },
    [pushTaskUpsert]
  );

  const updateTask = useCallback(
    (id: string, data: Partial<Task>) => {
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === id ? { ...t, ...data } : t));
        const updated = next.find((t) => t.id === id);
        if (updated) pushTaskUpsert(updated);
        return next;
      });
    },
    [pushTaskUpsert]
  );

  const deleteTask = useCallback(
    (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      pushTaskDelete(id);
    },
    [pushTaskDelete]
  );

  const logMood = useCallback(
    (energy: MoodEntry["energy"], context: MoodEntry["context"]) => {
      const entry: MoodEntry = {
        id: crypto.randomUUID(),
        energy,
        context,
        occurred_at: new Date().toISOString(),
      };
      setMoodEntries((prev) => [entry, ...prev].slice(0, 200));
      pushMoodEntry(entry);
    },
    [pushMoodEntry]
  );

  const logQuizResult = useCallback(
    (result: Omit<QuizResult, "id" | "finished_at">) => {
      const entry: QuizResult = {
        ...result,
        id: crypto.randomUUID(),
        finished_at: new Date().toISOString(),
      };
      setQuizResults((prev) => [entry, ...prev].slice(0, 300));
      pushQuizResult(entry);
    },
    [pushQuizResult]
  );

  const addExamPlan = useCallback(
    (plan: Omit<ExamPlan, "id" | "created_at">) => {
      const entry: ExamPlan = {
        ...plan,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };
      setExamPlans((prev) => [...prev, entry]);
      pushExamPlanInsert(entry);
    },
    [pushExamPlanInsert]
  );

  const deleteExamPlan = useCallback(
    (id: string) => {
      setExamPlans((prev) => prev.filter((p) => p.id !== id));
      pushExamPlanDelete(id);
    },
    [pushExamPlanDelete]
  );

  const addPomodoro = useCallback(() => {
    setStats((prev) => {
      const withPomo = {
        ...prev,
        pomodoros_completed: prev.pomodoros_completed + 1,
        total_focus_minutes: prev.total_focus_minutes + 25,
      };
      const next = applyXP(withPomo, 15);
      pushStats(next);
      return next;
    });
  }, [applyXP, pushStats]);

  return (
    <AppContext.Provider
      value={{
        stats,
        tasks,
        moodEntries,
        quizResults,
        examPlans,
        syncStatus,
        addXP,
        completeTask,
        addTask,
        updateTask,
        deleteTask,
        addPomodoro,
        logMood,
        logQuizResult,
        addExamPlan,
        deleteExamPlan,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

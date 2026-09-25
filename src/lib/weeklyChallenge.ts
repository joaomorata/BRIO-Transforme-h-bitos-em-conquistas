import { getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek, isWithinInterval } from "date-fns";
import type { Task, WeeklyXPEntry } from "@/context/AppContext";

export interface Challenge {
  id: string;
  title: string;
  target: number;
  unit: string;
  xpReward: number;
  getProgress: (tasks: Task[], weeklyLog: WeeklyXPEntry[]) => number;
}

function countTasksThisWeek(tasks: Task[], filter?: (t: Task) => boolean): number {
  const now = new Date();
  const start = startOfISOWeek(now);
  const end = endOfISOWeek(now);
  return tasks.filter((t) => {
    if (t.status !== "completed" || !t.completed_at) return false;
    if (filter && !filter(t)) return false;
    return isWithinInterval(new Date(t.completed_at), { start, end });
  }).length;
}

function sumXPThisWeek(weeklyLog: WeeklyXPEntry[]): number {
  const now = new Date();
  const start = startOfISOWeek(now);
  const end = endOfISOWeek(now);
  return weeklyLog
    .filter((e) => isWithinInterval(new Date(`${e.date}T12:00:00`), { start, end }))
    .reduce((sum, e) => sum + e.xp, 0);
}

// Todos os desafios usam apenas dados que o BRIO já coleta (tarefas concluídas
// e XP diário) — nenhum rastreamento novo foi necessário.
const CHALLENGE_POOL: Challenge[] = [
  {
    id: "tasks_5",
    title: "Complete 5 tarefas essa semana",
    target: 5,
    unit: "tarefas",
    xpReward: 50,
    getProgress: (tasks) => countTasksThisWeek(tasks),
  },
  {
    id: "xp_150",
    title: "Ganhe 150 XP essa semana",
    target: 150,
    unit: "XP",
    xpReward: 40,
    getProgress: (_tasks, weeklyLog) => sumXPThisWeek(weeklyLog),
  },
  {
    id: "high_priority_3",
    title: "Complete 3 tarefas de alta prioridade",
    target: 3,
    unit: "tarefas",
    xpReward: 45,
    getProgress: (tasks) => countTasksThisWeek(tasks, (t) => t.priority === "high"),
  },
  {
    id: "tasks_8",
    title: "Complete 8 tarefas essa semana",
    target: 8,
    unit: "tarefas",
    xpReward: 70,
    getProgress: (tasks) => countTasksThisWeek(tasks),
  },
  {
    id: "xp_300",
    title: "Ganhe 300 XP essa semana",
    target: 300,
    unit: "XP",
    xpReward: 80,
    getProgress: (_tasks, weeklyLog) => sumXPThisWeek(weeklyLog),
  },
];

/** Chave estável da semana atual (ex: "2026-W38"), usada pra saber se um desafio já foi resgatado. */
export function weekKey(): string {
  const now = new Date();
  return `${getISOWeekYear(now)}-W${getISOWeek(now)}`;
}

/** Escolhe um desafio determinístico pra semana atual — todo mundo vê o mesmo desafio na mesma semana, e ele muda toda segunda-feira (início da semana ISO). */
export function getWeeklyChallenge(): Challenge {
  const now = new Date();
  const idx = (getISOWeekYear(now) * 100 + getISOWeek(now)) % CHALLENGE_POOL.length;
  return CHALLENGE_POOL[idx];
}

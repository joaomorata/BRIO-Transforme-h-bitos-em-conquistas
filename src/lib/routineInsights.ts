import type { Task, MoodEntry } from "@/context/AppContext";

export type Period = "madrugada" | "manhã" | "tarde" | "noite";

const PERIOD_LABELS: Record<Period, string> = {
  madrugada: "Madrugada (0h–6h)",
  manhã: "Manhã (6h–12h)",
  tarde: "Tarde (12h–18h)",
  noite: "Noite (18h–24h)",
};

const PERIOD_PHRASE: Record<Period, string> = {
  madrugada: "de madrugada",
  manhã: "pela manhã",
  tarde: "à tarde",
  noite: "à noite",
};

const WEEKDAY_LABELS = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

const MIN_SAMPLE = 5;
const MIN_SAMPLE_FOR_WEEKDAY = 8;
const WEEKDAY_SHARE_THRESHOLD = 0.28;

function periodFromHour(hour: number): Period {
  if (hour < 6) return "madrugada";
  if (hour < 12) return "manhã";
  if (hour < 18) return "tarde";
  return "noite";
}

export interface RoutineInsight {
  ready: boolean;
  sampleSize: number;
  periodCounts: { period: Period; label: string; count: number }[];
  topPeriod?: Period;
  topWeekday?: string;
  insightText?: string;
}

/**
 * Analisa o comportamento real do usuário (tarefas concluídas + sessões de foco
 * bem avaliadas) para identificar os horários em que ele costuma render mais.
 * Não depende de nenhum serviço externo — é estatística simples sobre os dados
 * que o próprio BRIO já coleta.
 */
export function computeRoutineInsight(tasks: Task[], moodEntries: MoodEntry[]): RoutineInsight {
  const points: Date[] = [];

  tasks.forEach((t) => {
    if (t.status === "completed" && t.completed_at) points.push(new Date(t.completed_at));
  });

  moodEntries.forEach((m) => {
    if (m.context === "post_focus" && m.energy >= 4) points.push(new Date(m.occurred_at));
  });

  const periodCountMap: Record<Period, number> = { madrugada: 0, manhã: 0, tarde: 0, noite: 0 };
  const weekdayCountMap = [0, 0, 0, 0, 0, 0, 0];

  points.forEach((d) => {
    periodCountMap[periodFromHour(d.getHours())] += 1;
    weekdayCountMap[d.getDay()] += 1;
  });

  const periodCounts = (Object.keys(periodCountMap) as Period[]).map((p) => ({
    period: p,
    label: PERIOD_LABELS[p],
    count: periodCountMap[p],
  }));

  if (points.length < MIN_SAMPLE) {
    return { ready: false, sampleSize: points.length, periodCounts };
  }

  const topPeriodEntry = [...periodCounts].sort((a, b) => b.count - a.count)[0];
  const topPeriod = topPeriodEntry.count > 0 ? topPeriodEntry.period : undefined;

  let topWeekday: string | undefined;
  if (points.length >= MIN_SAMPLE_FOR_WEEKDAY) {
    const maxCount = Math.max(...weekdayCountMap);
    const share = maxCount / points.length;
    if (share >= WEEKDAY_SHARE_THRESHOLD) {
      topWeekday = WEEKDAY_LABELS[weekdayCountMap.indexOf(maxCount)];
    }
  }

  let insightText: string | undefined;
  if (topPeriod) {
    insightText = `Você costuma concluir mais tarefas e sessões de foco ${PERIOD_PHRASE[topPeriod]}`;
    if (topWeekday) insightText += `, principalmente às ${topWeekday}`;
    insightText += ". Considere agendar suas tarefas mais importantes nesse horário.";
  }

  return { ready: true, sampleSize: points.length, periodCounts, topPeriod, topWeekday, insightText };
}

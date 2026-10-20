import { format, subDays } from "date-fns";

// A sequência (streak) só é recalculada quando a pessoa ganha XP, então o valor
// salvo fica "velho" depois de dias parado. Ela só conta se a última atividade
// foi hoje ou ontem — senão, na prática, já zerou.
export function activeStreak(currentStreak: number, lastActiveDate: string | null | undefined): number {
  if (!lastActiveDate) return currentStreak;
  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  return lastActiveDate === today || lastActiveDate === yesterday ? currentStreak : 0;
}
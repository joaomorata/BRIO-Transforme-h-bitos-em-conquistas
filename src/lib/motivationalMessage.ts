import type { UserStats, Task } from "@/context/AppContext";

const FALLBACK_MESSAGES = [
  "Pequenos passos todos os dias constroem grandes resultados.",
  "Foco não é fazer tudo de uma vez — é fazer o próximo passo certo.",
  "Sua constância de hoje é o seu resultado de amanhã.",
  "Progresso, não perfeição.",
  "Cada tarefa concluída é um voto na pessoa que você quer se tornar.",
];

/**
 * Escolhe uma mensagem motivacional a partir do estado real do usuário
 * (streak, tarefas concluídas hoje, XP total) — não é um texto genérico
 * sorteado, reflete o que está de fato acontecendo com o progresso da pessoa.
 * Quando nenhuma condição específica se aplica, cai num texto rotativo que
 * muda por dia (estável dentro do mesmo dia).
 */
export function getMotivationalMessage(stats: UserStats, tasks: Task[]): string {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const tasksCompletedToday = tasks.filter(
    (t) => t.status === "completed" && t.completed_at?.slice(0, 10) === todayStr
  ).length;
  const hour = today.getHours();

  if (stats.current_streak >= 7) {
    return `${stats.current_streak} dias seguidos! Sua constância já é rara — poucos chegam até aqui.`;
  }
  if (stats.current_streak >= 3) {
    return `Sequência de ${stats.current_streak} dias. Mais um hoje e você bate seu próprio recorde.`;
  }
  if (tasksCompletedToday === 0 && hour >= 18) {
    return "O dia ainda não acabou — uma tarefa rápida agora já conta pra sua sequência de hoje.";
  }
  if (tasksCompletedToday >= 3) {
    return `${tasksCompletedToday} tarefas concluídas hoje. Você está com tudo!`;
  }
  if (stats.total_xp === 0) {
    return "Bem-vindo ao BRIO! Complete sua primeira tarefa pra começar a ganhar XP.";
  }

  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return FALLBACK_MESSAGES[dayOfYear % FALLBACK_MESSAGES.length];
}

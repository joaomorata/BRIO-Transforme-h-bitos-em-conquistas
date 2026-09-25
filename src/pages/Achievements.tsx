import { motion } from "framer-motion";
import { Trophy, Target, Flame, Zap, Timer, Star, CheckCircle2, Lock } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

const ACHIEVEMENTS = [
  { key: "first_task", title: "Primeiro Passo", desc: "Complete sua primeira tarefa", icon: CheckCircle2, type: "tasks_completed", value: 1, xp: 20 },
  { key: "task_10", title: "Produtivo", desc: "Complete 10 tarefas", icon: Target, type: "tasks_completed", value: 10, xp: 50 },
  { key: "task_50", title: "Imparável", desc: "Complete 50 tarefas", icon: Trophy, type: "tasks_completed", value: 50, xp: 200 },
  { key: "task_100", title: "Centurião", desc: "Complete 100 tarefas", icon: Star, type: "tasks_completed", value: 100, xp: 500 },
  { key: "streak_3", title: "Constância", desc: "3 dias seguidos ativo", icon: Flame, type: "streak", value: 3, xp: 30 },
  { key: "streak_7", title: "Semana de Fogo", desc: "7 dias seguidos ativo", icon: Flame, type: "streak", value: 7, xp: 100 },
  { key: "streak_30", title: "Lenda", desc: "30 dias seguidos ativo", icon: Flame, type: "streak", value: 30, xp: 500 },
  { key: "pomo_10", title: "Focado", desc: "Complete 10 pomodoros", icon: Timer, type: "pomodoros", value: 10, xp: 50 },
  { key: "pomo_50", title: "Mestre do Foco", desc: "Complete 50 pomodoros", icon: Timer, type: "pomodoros", value: 50, xp: 200 },
  { key: "xp_500", title: "Meio Milhar", desc: "Acumule 500 XP", icon: Zap, type: "xp", value: 500, xp: 50 },
  { key: "xp_2000", title: "Veterano", desc: "Acumule 2000 XP", icon: Zap, type: "xp", value: 2000, xp: 200 },
  { key: "xp_5000", title: "Elite", desc: "Acumule 5000 XP", icon: Star, type: "xp", value: 5000, xp: 500 },
];

export default function Achievements() {
  const { stats } = useApp();

  const isUnlocked = (ach: typeof ACHIEVEMENTS[number]) => {
    switch (ach.type) {
      case "tasks_completed": return stats.tasks_completed >= ach.value;
      case "streak": return stats.best_streak >= ach.value;
      case "pomodoros": return stats.pomodoros_completed >= ach.value;
      case "xp": return stats.total_xp >= ach.value;
      default: return false;
    }
  };

  const getProgress = (ach: typeof ACHIEVEMENTS[number]) => {
    let current = 0;
    switch (ach.type) {
      case "tasks_completed": current = stats.tasks_completed; break;
      case "streak": current = stats.best_streak; break;
      case "pomodoros": current = stats.pomodoros_completed; break;
      case "xp": current = stats.total_xp; break;
    }
    return Math.min((current / ach.value) * 100, 100);
  };

  const unlocked = ACHIEVEMENTS.filter(isUnlocked).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Conquistas</h1>
          <p className="text-sm text-muted-foreground">Desbloqueie conquistas e evolua.</p>
        </div>
        <div className="bg-card border border-border rounded-xl px-4 py-2 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-mono font-bold text-foreground">{unlocked}/{ACHIEVEMENTS.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {ACHIEVEMENTS.map((ach, i) => {
          const done = isUnlocked(ach);
          const progress = getProgress(ach);
          return (
            <motion.div
              key={ach.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                "relative bg-card border rounded-2xl p-4 transition-all",
                done ? "border-primary/40" : "border-border opacity-70"
              )}
            >
              {done && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                </div>
              )}
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                done ? "bg-primary/15" : "bg-muted"
              )}>
                {done ? (
                  <ach.icon className="w-5 h-5 text-primary" />
                ) : (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <h3 className="text-sm font-semibold text-foreground">{ach.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{ach.desc}</p>
              <div className="mt-3">
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", done ? "bg-primary" : "bg-muted-foreground/30")}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, delay: i * 0.04 }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-muted-foreground">{Math.round(progress)}%</span>
                  <span className="text-[10px] font-mono text-primary">+{ach.xp} XP</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

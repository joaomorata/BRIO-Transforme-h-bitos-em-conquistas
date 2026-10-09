import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { UserStats, Task } from "@/context/AppContext";
import { format } from "date-fns";

const DAILY_XP_GOAL = 100;

interface DailyXPCardProps {
  stats: UserStats;
  tasks: Task[];
}

export default function DailyXPCard({ stats, tasks }: DailyXPCardProps) {
  const todayXP = (() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return stats.weekly_xp_log.find((e) => e.date === today)?.xp || 0;
  })();

  const pct = Math.min((todayXP / DAILY_XP_GOAL) * 100, 100);
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (pct / 100) * circumference;

  const nextTask = tasks.find((t) => t.status !== "completed");

  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">XP Diário</span>
      </div>

      <div className="flex justify-center my-2">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
            <motion.circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-foreground">{Math.round(pct)}%</span>
          </div>
        </div>
      </div>

      <div className="text-center mb-3">
        <p className="text-3xl font-bold text-foreground">
          {todayXP} <span className="text-sm text-muted-foreground font-normal">/ {DAILY_XP_GOAL}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">Sua XP hoje</p>
      </div>

      {todayXP === 0 ? (
        <p className="text-center text-sm font-bold text-foreground my-2">
          Hora de começar! <br />
          <span className="text-xs font-normal text-muted-foreground">Todo progresso começa com o primeiro passo 🚀</span>
        </p>
      ) : (
        <p className="text-center text-sm text-muted-foreground my-2">
          Faltam <span className="font-bold text-primary">{Math.max(0, DAILY_XP_GOAL - todayXP)} XP</span> para a meta diária!
        </p>
      )}

      {nextTask && (
        <Link
          to="/tasks"
          className="mt-auto flex items-center justify-between bg-primary/10 hover:bg-primary/20 transition-colors rounded-xl px-3 py-2.5"
        >
          <div>
            <p className="text-xs text-primary font-semibold">Continuar de onde parei</p>
            <p className="text-xs text-muted-foreground truncate max-w-[160px]">{nextTask.title}</p>
          </div>
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </div>
        </Link>
      )}
    </div>
  );
}

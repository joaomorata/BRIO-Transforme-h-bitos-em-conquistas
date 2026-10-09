import { motion } from "framer-motion";
import { Zap, Flame, CheckCircle2, Timer } from "lucide-react";
import type { UserStats } from "@/context/AppContext";

const statCards = [
  { key: "total_xp" as const, label: "XP Total", icon: Zap, colorText: "text-primary", colorBg: "bg-primary/10" },
  { key: "current_streak" as const, label: "Streak Atual", icon: Flame, colorText: "text-orange-400", colorBg: "bg-orange-400/10" },
  { key: "tasks_completed" as const, label: "Tarefas Feitas", icon: CheckCircle2, colorText: "text-accent", colorBg: "bg-accent/10" },
  { key: "pomodoros_completed" as const, label: "Pomodoros", icon: Timer, colorText: "text-pink-400", colorBg: "bg-pink-400/10" },
];

export default function StatsGrid({ stats }: { stats: UserStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {statCards.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-card border border-border rounded-2xl p-4 md:p-5"
        >
          <div className={`w-9 h-9 rounded-xl ${card.colorBg} flex items-center justify-center mb-3`}>
            <card.icon className={`w-4 h-4 ${card.colorText}`} />
          </div>
          <p className="text-2xl md:text-3xl font-heading font-bold text-foreground">
            {stats[card.key]}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

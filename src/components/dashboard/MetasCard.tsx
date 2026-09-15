import { motion } from "framer-motion";
import { BookOpen, HelpCircle, Clock, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import type { UserStats, Task } from "@/context/AppContext";

interface MetasCardProps {
  stats: UserStats;
  tasks: Task[];
}

export default function MetasCard({ stats, tasks }: MetasCardProps) {
  const completed = tasks.filter((t) => t.status === "completed").length;
  const total = tasks.length;
  const pomodoros = stats.pomodoros_completed;
  const focusHours = Math.floor(stats.total_focus_minutes / 60);
  const focusMins = stats.total_focus_minutes % 60;

  const metas = [
    {
      icon: BookOpen,
      label: "Tarefas concluídas",
      current: completed,
      goal: Math.max(total, 5),
      colorBorder: "border-blue-400",
      colorBg: "bg-blue-400/10",
      colorText: "text-blue-400",
      colorBar: "bg-blue-400",
      desc: `${completed} de ${Math.max(total, 5)} concluídas`,
    },
    {
      icon: HelpCircle,
      label: "Pomodoros realizados",
      current: pomodoros,
      goal: 8,
      colorBorder: "border-pink-400",
      colorBg: "bg-pink-400/10",
      colorText: "text-pink-400",
      colorBar: "bg-pink-400",
      desc: `${pomodoros} de 8 realizados hoje`,
    },
    {
      icon: Clock,
      label: "Sessões de foco",
      current: focusHours * 60 + focusMins,
      goal: 60,
      colorBorder: "border-teal-400",
      colorBg: "bg-teal-400/10",
      colorText: "text-teal-400",
      colorBar: "bg-teal-400",
      desc: `${String(focusHours).padStart(2, "0")}:${String(focusMins).padStart(2, "0")}h acumuladas`,
    },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-foreground">Metas</span>
        <Link to="/tasks" className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
          <Plus className="w-3 h-3" /> Adicionar
        </Link>
      </div>

      <div className="space-y-3 flex-1">
        {metas.map((meta, i) => {
          const pct = Math.min((meta.current / meta.goal) * 100, 100);
          return (
            <div key={i} className={`border-l-4 ${meta.colorBorder} ${meta.colorBg} rounded-r-xl px-3 py-2.5`}>
              <div className="flex items-center gap-2 mb-1">
                <meta.icon className={`w-3.5 h-3.5 ${meta.colorText}`} />
                <span className="text-xs font-medium text-muted-foreground">{meta.label}</span>
                <span className={`ml-auto text-xs font-bold ${meta.colorText}`}>
                  {meta.current}/{meta.goal}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${meta.colorBar}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{meta.desc}</p>
            </div>
          );
        })}
      </div>

      <Link to="/tasks" className="mt-4 text-xs text-primary hover:underline flex items-center gap-1">
        ↻ Atualizar minhas metas
      </Link>
    </div>
  );
}

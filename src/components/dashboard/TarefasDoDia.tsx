import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, ListTodo, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import type { Task } from "@/context/AppContext";

interface TarefasDoDiaProps {
  tasks: Task[];
}

export default function TarefasDoDia({ tasks }: TarefasDoDiaProps) {
  const { addTask } = useApp();
  const todayTasks = tasks.slice(0, 6);
  const [quickTitle, setQuickTitle] = useState("");

  const handleQuickAdd = () => {
    const title = quickTitle.trim();
    if (!title) return;
    addTask({
      title,
      category: "personal",
      priority: "medium",
      xp_reward: 15,
      pomodoros_target: 1,
    });
    setQuickTitle("");
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <ListTodo className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">Tarefas do dia</span>
      </div>

      <div className="space-y-2">
        {todayTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma tarefa ainda.</p>
          </div>
        )}
        {todayTasks.map((task, i) => {
          const done = task.status === "completed";
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors",
                done
                  ? "bg-accent/5 border-accent/20"
                  : "bg-secondary/30 border-border hover:bg-secondary/50"
              )}
            >
              {done ? (
                <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className={cn("text-sm flex-1 truncate", done && "line-through text-muted-foreground")}>
                {task.title}
              </span>
              <span className="text-[10px] font-mono text-primary font-bold">+{task.xp_reward}xp</span>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
          placeholder="Adicionar tarefa rápida..."
          className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={!quickTitle.trim()}
          className="h-9 w-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors shrink-0"
          aria-label="Adicionar tarefa"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <Link to="/tasks" className="mt-3 text-xs text-primary hover:underline">
        Ver todas as tarefas →
      </Link>
    </div>
  );
}

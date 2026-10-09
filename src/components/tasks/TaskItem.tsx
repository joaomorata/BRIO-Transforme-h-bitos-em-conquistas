import { motion } from "framer-motion";
import { CheckCircle2, Circle, Pencil, Trash2, Zap, BookOpen, Briefcase, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/context/AppContext";

const categoryIcons = {
  study: BookOpen,
  work: Briefcase,
  health: Heart,
  personal: User,
};

const categoryLabels = {
  study: "Estudo",
  work: "Trabalho",
  health: "Saúde",
  personal: "Pessoal",
};

const priorityStyles = {
  low: "border-l-muted-foreground/30",
  medium: "border-l-yellow-400",
  high: "border-l-destructive",
};

interface TaskItemProps {
  task: Task;
  onComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export default function TaskItem({ task, onComplete, onEdit, onDelete }: TaskItemProps) {
  const isCompleted = task.status === "completed";
  const Icon = categoryIcons[task.category] || BookOpen;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group flex items-center gap-3 p-3 md:p-4 bg-card border border-border rounded-xl border-l-4 transition-all hover:bg-secondary/30",
        priorityStyles[task.priority] || "border-l-border",
        isCompleted && "opacity-60"
      )}
    >
      <button
        onClick={() => !isCompleted && onComplete(task)}
        className="flex-shrink-0"
        disabled={isCompleted}
      >
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-accent" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate text-foreground", isCompleted && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full hidden md:flex items-center gap-1">
          <Icon className="w-3 h-3" />
          {categoryLabels[task.category]}
        </span>
        <span className="text-xs font-mono text-primary flex items-center gap-0.5">
          <Zap className="w-3 h-3" />
          {task.xp_reward}
        </span>
        <div className="hidden group-hover:flex items-center gap-1">
          <button
            onClick={() => onEdit(task)}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-secondary transition-colors"
          >
            <Pencil className="w-3 h-3 text-muted-foreground" />
          </button>
          <button
            onClick={() => onDelete(task)}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-3 h-3 text-destructive" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

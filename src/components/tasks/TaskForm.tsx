import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { Task } from "@/context/AppContext";

interface TaskFormProps {
  task?: Task | null;
  onSubmit: (data: Omit<Task, "id" | "created_at" | "status">) => void;
  onCancel: () => void;
}

export default function TaskForm({ task, onSubmit, onCancel }: TaskFormProps) {
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    category: task?.category || "study" as Task["category"],
    priority: task?.priority || "medium" as Task["priority"],
    xp_reward: task?.xp_reward || 10,
    pomodoros_target: task?.pomodoros_target || 4,
    due_date: task?.due_date || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit(form as Omit<Task, "id" | "created_at" | "status">);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-card border border-border rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-heading font-semibold text-foreground">
          {task ? "Editar Tarefa" : "Nova Tarefa"}
        </h3>
        <button
          onClick={onCancel}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Título</label>
          <input
            type="text"
            placeholder="O que precisa fazer?"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">Descrição</label>
          <textarea
            placeholder="Detalhes opcionais..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 h-20 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Categoria</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as Task["category"] })}
              className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="study">Estudo</option>
              <option value="work">Trabalho</option>
              <option value="health">Saúde</option>
              <option value="personal">Pessoal</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Prioridade</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Task["priority"] })}
              className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">XP Recompensa</label>
            <input
              type="number"
              value={form.xp_reward}
              onChange={(e) => setForm({ ...form, xp_reward: parseInt(e.target.value) || 10 })}
              className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Pomodoros</label>
            <input
              type="number"
              value={form.pomodoros_target}
              onChange={(e) => setForm({ ...form, pomodoros_target: parseInt(e.target.value) || 4 })}
              className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            {task ? "Salvar" : "Criar Tarefa"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

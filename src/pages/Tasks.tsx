import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import TaskForm from "@/components/tasks/TaskForm";
import TaskItem from "@/components/tasks/TaskItem";
import type { Task } from "@/context/AppContext";

export default function Tasks() {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const { tasks, completeTask, addTask, updateTask, deleteTask } = useApp();

  const handleSubmit = (data: Omit<Task, "id" | "created_at" | "status">) => {
    if (editingTask) {
      updateTask(editingTask.id, data);
    } else {
      addTask(data);
    }
    setShowForm(false);
    setEditingTask(null);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === "all") return true;
    if (filter === "active") return t.status !== "completed";
    if (filter === "completed") return t.status === "completed";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Tarefas</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas atividades e ganhe XP.</p>
        </div>
        <button
          onClick={() => { setEditingTask(null); setShowForm(!showForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova Tarefa
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <TaskForm
            task={editingTask}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditingTask(null); }}
          />
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        {(["all", "active", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === f
                ? "bg-primary text-white"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "Todas" : f === "active" ? "Ativas" : "Concluídas"}
          </button>
        ))}
      </div>

      <div className="space-y-2 bg-card rounded-2xl p-4 border border-border">
        <AnimatePresence>
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onComplete={(t) => completeTask(t.id)}
              onEdit={handleEdit}
              onDelete={(t) => deleteTask(t.id)}
            />
          ))}
        </AnimatePresence>
        {filteredTasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-muted-foreground">Nenhuma tarefa encontrada.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Crie sua primeira tarefa e comece a evoluir!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

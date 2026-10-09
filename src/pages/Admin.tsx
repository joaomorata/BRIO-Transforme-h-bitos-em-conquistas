import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield, Users, CheckCircle2, Zap, Timer, Crown,
  Trash2, UserCheck, UserX, BarChart3, Activity
} from "lucide-react";
import { useApp, calculateLevel } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StoredUser {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatarColor: string;
  role: "user" | "admin";
  createdAt: string;
  passwordHash: string;
}

function loadAllUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem("brio_users");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAllUsers(users: StoredUser[]) {
  localStorage.setItem("brio_users", JSON.stringify(users));
}

const TABS = ["Visão Geral", "Usuários", "Tarefas"] as const;
type TabType = typeof TABS[number];

export default function Admin() {
  const { stats, tasks } = useApp();
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState<TabType>("Visão Geral");
  const [users, setUsers] = useState<StoredUser[]>(loadAllUsers);

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = tasks.filter((t) => t.status !== "completed").length;
  const totalXPFromTasks = tasks.filter((t) => t.status === "completed").reduce((s, t) => s + t.xp_reward, 0);

  const summaryCards = [
    { icon: Users, label: "Usuários cadastrados", value: users.length, colorText: "text-primary", colorBg: "bg-primary/10" },
    { icon: CheckCircle2, label: "Tarefas concluídas", value: completedTasks, colorText: "text-accent", colorBg: "bg-accent/10" },
    { icon: Zap, label: "XP Total gerado", value: stats.total_xp, colorText: "text-yellow-400", colorBg: "bg-yellow-400/10" },
    { icon: Timer, label: "Pomodoros totais", value: stats.pomodoros_completed, colorText: "text-pink-400", colorBg: "bg-pink-400/10" },
  ];

  const toggleRole = (userId: string) => {
    if (userId === currentUser?.id) return;
    const updated = users.map((u) =>
      u.id === userId ? { ...u, role: (u.role === "admin" ? "user" : "admin") as "user" | "admin" } : u
    );
    setUsers(updated);
    saveAllUsers(updated);
  };

  const deleteUser = (userId: string) => {
    if (userId === currentUser?.id) return;
    const updated = users.filter((u) => u.id !== userId);
    setUsers(updated);
    saveAllUsers(updated);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Painel Admin</h1>
          <p className="text-sm text-muted-foreground">Visão geral e gestão da plataforma BRIO</p>
        </div>
        <div className="ml-auto flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-3 py-1.5">
          <Crown className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary">Admin</span>
        </div>
      </motion.div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              tab === t ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "Visão Geral" && <BarChart3 className="w-3.5 h-3.5 inline mr-1.5" />}
            {t === "Usuários" && <Users className="w-3.5 h-3.5 inline mr-1.5" />}
            {t === "Tarefas" && <Activity className="w-3.5 h-3.5 inline mr-1.5" />}
            {t}
          </button>
        ))}
      </div>

      {tab === "Visão Geral" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {summaryCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-card border border-border rounded-2xl p-4"
              >
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", card.colorBg)}>
                  <card.icon className={cn("w-4 h-4", card.colorText)} />
                </div>
                <p className="text-2xl font-bold font-mono text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Tarefas por status</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground">Concluídas</span>
                  <span className="text-xs font-bold text-accent">{completedTasks}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: tasks.length ? `${(completedTasks / tasks.length) * 100}%` : "0%" }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground">Pendentes</span>
                  <span className="text-xs font-bold text-yellow-400">{pendingTasks}</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Resumo do usuário</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Nível atual</span>
                  <span className="font-bold text-primary">{calculateLevel(stats.total_xp)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Streak</span>
                  <span className="font-bold text-orange-400">{stats.current_streak} dias</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Minutos de foco</span>
                  <span className="font-bold text-pink-400">{stats.total_focus_minutes}min</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">XP de tarefas</span>
                  <span className="font-bold text-yellow-400">{totalXPFromTasks}</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Categorias de tarefas</p>
              {(["study", "work", "health", "personal"] as const).map((cat) => {
                const count = tasks.filter((t) => t.category === cat).length;
                const labels = { study: "Estudo", work: "Trabalho", health: "Saúde", personal: "Pessoal" };
                return (
                  <div key={cat} className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{labels[cat]}</span>
                    <span className="font-bold text-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {tab === "Usuários" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Usuários cadastrados ({users.length})</h2>
          </div>
          <div className="space-y-2">
            {users.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                  style={{ backgroundColor: u.avatarColor || "#7c3aed" }}
                >
                  {u.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                    {u.id === currentUser?.id && (
                      <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">Você</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Desde {format(new Date(u.createdAt), "dd MMM yyyy", { locale: ptBR })}
                  </p>
                </div>
                <span className={cn(
                  "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full",
                  u.role === "admin" ? "text-yellow-400 bg-yellow-400/10" : "text-muted-foreground bg-muted"
                )}>
                  {u.role === "admin" ? <><Crown className="w-3 h-3" /> Admin</> : "Usuário"}
                </span>
                {u.id !== currentUser?.id && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleRole(u.id)}
                      title={u.role === "admin" ? "Remover admin" : "Tornar admin"}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-primary/10 transition-colors"
                    >
                      {u.role === "admin" ? (
                        <UserX className="w-3.5 h-3.5 text-muted-foreground" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteUser(u.id)}
                      title="Remover usuário"
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
            {users.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhum usuário cadastrado.</p>
            )}
          </div>
        </motion.div>
      )}

      {tab === "Tarefas" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Todas as tarefas ({tasks.length})</h2>
          </div>
          <div className="space-y-2">
            {tasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border"
              >
                <div className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  task.status === "completed" ? "bg-accent" : "bg-muted-foreground/40"
                )} />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm text-foreground truncate", task.status === "completed" && "line-through text-muted-foreground")}>
                    {task.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(task.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <span className="text-[10px] bg-secondary rounded-full px-2 py-0.5 text-muted-foreground">{task.category}</span>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  task.priority === "high" ? "bg-destructive/10 text-destructive"
                    : task.priority === "medium" ? "bg-yellow-400/10 text-yellow-400"
                    : "bg-muted text-muted-foreground"
                )}>
                  {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
                </span>
                <span className="text-xs font-mono text-primary font-bold">+{task.xp_reward} XP</span>
              </motion.div>
            ))}
            {tasks.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma tarefa encontrada.</p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield, Users, CheckCircle2, Zap, Timer, Crown,
  BarChart3, Activity, Loader2, WifiOff, Flame, Send,
} from "lucide-react";
import { useApp, calculateLevel } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";
import { activeStreak } from "@/lib/streak";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import UserAvatar from "@/components/ui/UserAvatar";

// Os dados da plataforma vêm da tabela user_stats (Supabase) — a mesma do
// Ranking, legível por qualquer usuário logado. Antes esta tela lia uma lista de
// usuários do localStorage (do login antigo, nunca mais gravada), então mostrava
// sempre "0 usuários", e os totais eram só os da própria conta admin.
// Promover/remover admin e apagar contas NÃO é feito por aqui: por segurança a
// tabela `admins` só pode ser alterada via SQL (supabase/tornar_admin.sql).
interface PlatformUser {
  user_id: string;
  email?: string | null;
  display_name: string | null;
  avatar_color: string | null;
  avatar_url: string | null;
  total_xp: number;
  level: number;
  current_streak: number;
  best_streak: number;
  tasks_completed: number;
  pomodoros_completed: number;
  total_focus_minutes: number;
  last_active_date: string | null;
}

const TABS = ["Visão Geral", "Usuários", "Minhas tarefas"] as const;
type TabType = typeof TABS[number];

export default function Admin() {
  const { stats, tasks } = useApp();
  const [tab, setTab] = useState<TabType>("Visão Geral");
  const [users, setUsers] = useState<PlatformUser[] | null>(null);
  const [error, setError] = useState(false);

  // Enviar tarefa para um usuário (o admin pode criar tarefas para qualquer conta
  // — exige a política tasks_insert_admin do SQL).
  const emptyAssign = { title: "", description: "", category: "study", priority: "medium", due_date: "" };
  const [assignTo, setAssignTo] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState(emptyAssign);
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignMsg, setAssignMsg] = useState("");

  const submitAssign = async (userId: string) => {
    const title = assignForm.title.trim();
    if (!title) return;
    setAssignBusy(true);
    setAssignMsg("");
    const { error: insertError } = await supabase.from("tasks").insert({
      id: crypto.randomUUID(),
      user_id: userId,
      title,
      description: assignForm.description.trim() || null,
      category: assignForm.category,
      priority: assignForm.priority,
      status: "pending",
      xp_reward: 10,
      pomodoros_target: 0,
      due_date: assignForm.due_date || null,
      created_at: new Date().toISOString(),
    });
    setAssignBusy(false);
    if (insertError) {
      setAssignMsg("Não foi possível enviar. Confirme se o SQL de permissão para admin foi rodado.");
      return;
    }
    setAssignForm(emptyAssign);
    setAssignMsg("Tarefa enviada. O usuário vê na próxima vez que abrir o app.");
  };

  // Lista todos os cadastrados (auth.users) via função admin_list_users, que
  // confere a tabela admins no próprio banco. Antes lia só user_stats: quem nunca
  // gerou linha ali (cadastrado e nunca sincronizado) não aparecia, e a tela
  // mostrava "Usuários cadastrados (0)".
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: rpcError } = await supabase.rpc("admin_list_users");
      if (cancelled) return;
      if (!rpcError && Array.isArray(data)) {
        setUsers(data as PlatformUser[]);
        return;
      }
      // Fallback enquanto o SQL de admin_list_users não foi rodado no Supabase.
      const { data: rows, error: fetchError } = await supabase
        .from("user_stats")
        .select(
          "user_id, display_name, avatar_color, avatar_url, total_xp, level, current_streak, best_streak, tasks_completed, pomodoros_completed, total_focus_minutes, last_active_date"
        )
        .order("total_xp", { ascending: false })
        .limit(1000);
      if (cancelled) return;
      if (fetchError) {
        setError(true);
        return;
      }
      setUsers((rows as PlatformUser[]) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = useMemo(() => {
    const list = users ?? [];
    const today = format(new Date(), "yyyy-MM-dd");
    const weekAgo = format(subDays(new Date(), 6), "yyyy-MM-dd");
    return {
      users: list.length,
      tasks: list.reduce((s, u) => s + u.tasks_completed, 0),
      xp: list.reduce((s, u) => s + u.total_xp, 0),
      pomodoros: list.reduce((s, u) => s + u.pomodoros_completed, 0),
      focusMinutes: list.reduce((s, u) => s + u.total_focus_minutes, 0),
      activeToday: list.filter((u) => u.last_active_date === today).length,
      activeWeek: list.filter((u) => u.last_active_date && u.last_active_date >= weekAgo).length,
      avgLevel: list.length ? Math.round(list.reduce((s, u) => s + u.level, 0) / list.length) : 0,
    };
  }, [users]);

  const summaryCards = [
    { icon: Users, label: "Usuários cadastrados", value: totals.users, colorText: "text-primary", colorBg: "bg-primary/10" },
    { icon: CheckCircle2, label: "Tarefas concluídas", value: totals.tasks, colorText: "text-accent", colorBg: "bg-accent/10" },
    { icon: Zap, label: "XP Total gerado", value: totals.xp, colorText: "text-[hsl(45_90%_60%)]", colorBg: "bg-[hsl(45_90%_60%/0.1)]" },
    { icon: Timer, label: "Pomodoros totais", value: totals.pomodoros, colorText: "text-[hsl(330_80%_60%)]", colorBg: "bg-[hsl(330_80%_60%/0.1)]" },
  ];

  const loading = users === null && !error;

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
            {t === "Minhas tarefas" && <Activity className="w-3.5 h-3.5 inline mr-1.5" />}
            {t}
          </button>
        ))}
      </div>

      {tab !== "Minhas tarefas" && error && (
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center gap-2 text-center">
          <WifiOff className="w-5 h-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar os dados da plataforma agora. O painel precisa de internet.
          </p>
        </div>
      )}

      {tab !== "Minhas tarefas" && loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {tab === "Visão Geral" && users !== null && (
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
              <p className="text-xs text-muted-foreground mb-2 font-medium">Atividade</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Ativos hoje</span>
                  <span className="font-bold text-accent">{totals.activeToday}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Ativos nos últimos 7 dias</span>
                  <span className="font-bold text-foreground">{totals.activeWeek}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Nível médio</span>
                  <span className="font-bold text-primary">{totals.avgLevel}</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Foco e engajamento</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Minutos de foco (total)</span>
                  <span className="font-bold text-[hsl(330_80%_60%)]">{totals.focusMinutes}min</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">XP médio por usuário</span>
                  <span className="font-bold text-[hsl(45_90%_60%)]">
                    {totals.users ? Math.round(totals.xp / totals.users) : 0}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Maior streak atual</span>
                  <span className="font-bold text-[hsl(200_80%_55%)]">
                    {Math.max(0, ...users.map((u) => activeStreak(u.current_streak, u.last_active_date)))} dias
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Top 3 por XP</p>
              {users.slice(0, 3).map((u, i) => (
                <div key={u.user_id} className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground truncate pr-2">
                    {i + 1}. {u.display_name || "Estudante"}
                  </span>
                  <span className="font-bold text-foreground shrink-0">{u.total_xp} XP</span>
                </div>
              ))}
              {users.length === 0 && <p className="text-xs text-muted-foreground">Sem dados ainda.</p>}
            </div>
          </div>
        </motion.div>
      )}

      {tab === "Usuários" && users !== null && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Usuários cadastrados ({users.length})</h2>
          </div>
          <div className="space-y-2">
            {users.map((u, i) => {
              const streak = activeStreak(u.current_streak, u.last_active_date);
              return (
                <div key={u.user_id} className="space-y-2">
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i, 15) * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border"
                >
                  <UserAvatar url={u.avatar_url} color={u.avatar_color} name={u.display_name} size={36} className="rounded-xl text-sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u.display_name || "Estudante"}</p>
                    {u.email && <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>}
                    <p className="text-[10px] text-muted-foreground">
                      Nível {calculateLevel(u.total_xp)} · {u.tasks_completed} tarefas · {u.pomodoros_completed} pomodoros
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {u.last_active_date
                        ? `Última atividade ${format(new Date(`${u.last_active_date}T12:00:00`), "dd MMM yyyy", { locale: ptBR })}`
                        : "Sem atividade"}
                    </p>
                  </div>
                  {streak > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[hsl(45_90%_60%)] bg-[hsl(45_90%_60%/0.1)] px-2 py-0.5 rounded-full">
                      <Flame className="w-3 h-3" /> {streak}d
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setAssignMsg("");
                      setAssignTo(assignTo === u.user_id ? null : u.user_id);
                    }}
                    className="text-[10px] font-semibold text-primary hover:underline shrink-0"
                  >
                    Atribuir tarefa
                  </button>
                  <span className="text-xs font-mono text-primary font-bold shrink-0">{u.total_xp} XP</span>
                </motion.div>
                {assignTo === u.user_id && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitAssign(u.user_id);
                    }}
                    className="ml-4 p-3 rounded-xl border border-border bg-card space-y-2"
                  >
                    <input
                      type="text"
                      placeholder="Título da tarefa"
                      value={assignForm.title}
                      onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })}
                      required
                      className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <textarea
                      placeholder="Descrição (opcional)"
                      value={assignForm.description}
                      onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
                      className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground h-16 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={assignForm.category}
                        onChange={(e) => setAssignForm({ ...assignForm, category: e.target.value })}
                        className="w-full bg-secondary/50 border border-border rounded-xl px-2 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="study">Estudo</option>
                        <option value="work">Trabalho</option>
                        <option value="health">Saúde</option>
                        <option value="personal">Pessoal</option>
                      </select>
                      <select
                        value={assignForm.priority}
                        onChange={(e) => setAssignForm({ ...assignForm, priority: e.target.value })}
                        className="w-full bg-secondary/50 border border-border rounded-xl px-2 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="low">Baixa</option>
                        <option value="medium">Média</option>
                        <option value="high">Alta</option>
                      </select>
                      <input
                        type="date"
                        value={assignForm.due_date}
                        onChange={(e) => setAssignForm({ ...assignForm, due_date: e.target.value })}
                        className="w-full bg-secondary/50 border border-border rounded-xl px-2 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    {assignMsg && <p className="text-[10px] text-muted-foreground">{assignMsg}</p>}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={assignBusy}
                        className="h-8 px-3 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <Send className="w-3 h-3" /> Enviar tarefa
                      </button>
                    </div>
                  </form>
                )}
                </div>
              );
            })}
            {users.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhum usuário cadastrado.</p>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-4">
            Para promover ou remover administradores, use o SQL em supabase/tornar_admin.sql.
          </p>
        </motion.div>
      )}

      {tab === "Minhas tarefas" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Tarefas da sua conta ({tasks.length})</h2>
          </div>
          <p className="text-[10px] text-muted-foreground mb-4">
            Por privacidade, cada usuário só enxerga as próprias tarefas — aqui aparecem apenas as da conta admin
            (nível {calculateLevel(stats.total_xp)}, {stats.tasks_completed} concluídas).
          </p>
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
                    : task.priority === "medium" ? "bg-[hsl(45_90%_60%/0.1)] text-[hsl(45_90%_60%)]"
                    : "bg-muted text-muted-foreground"
                )}>
                  {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
                </span>
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

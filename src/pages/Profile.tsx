import { useState } from "react";
import { motion } from "framer-motion";
import {
  Zap, Flame, CheckCircle2, Timer, Star, Trophy, Lock,
  Pencil, LogOut, Download, ShieldAlert, Loader2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useApp, calculateLevel } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import HeroBanner from "@/components/layout/HeroBanner";

const THEMES = [
  { id: "brio2026_especial", label: "BRIO 2026 Especial", minLevel: 0, gradient: "from-cyan-400 via-blue-500 to-purple-600", emoji: "⚡", tag: "2026" },
  { id: "brio2026", label: "BRIO 2026", minLevel: 0, gradient: "from-blue-600 via-indigo-500 to-violet-600", emoji: "🚀", tag: "2026" },
  { id: "brio_classic", label: "Plataforma BRIO", minLevel: 0, gradient: "from-indigo-500 to-blue-500", emoji: "🎯", tag: null },
  { id: "madeira", label: "Madeira", minLevel: 0, gradient: "from-amber-700 to-yellow-600", emoji: "🪵", tag: null },
  { id: "alvo", label: "Alvo", minLevel: 5, gradient: "from-teal-400 to-cyan-500", emoji: "🎯", tag: "Nível 5" },
  { id: "aviao", label: "Avião", minLevel: 10, gradient: "from-sky-400 via-blue-400 to-indigo-500", emoji: "✈️", tag: "Nível 10" },
  { id: "fogo", label: "Fogo", minLevel: 15, gradient: "from-orange-600 via-red-500 to-yellow-400", emoji: "🔥", tag: "Nível 15" },
  { id: "gladiador", label: "Gladiador", minLevel: 20, gradient: "from-stone-600 via-gray-500 to-stone-400", emoji: "⚔️", tag: "Nível 20" },
  { id: "hoverboard", label: "Hoverboard", minLevel: 25, gradient: "from-pink-500 via-fuchsia-500 to-purple-600", emoji: "🛹", tag: "Nível 25" },
  { id: "foguete", label: "Foguete", minLevel: 30, gradient: "from-slate-700 via-slate-600 to-slate-500", emoji: "🚀", tag: "Nível 30" },
];

const TABS = ["Temas", "Conquistas", "Divisões"] as const;
type TabType = typeof TABS[number];

const ACHIEVEMENTS = [
  { key: "first_task", title: "Primeiro Passo", desc: "Complete 1 tarefa", icon: CheckCircle2, type: "tasks_completed", value: 1, xp: 20 },
  { key: "task_10", title: "Produtivo", desc: "Complete 10 tarefas", icon: Trophy, type: "tasks_completed", value: 10, xp: 50 },
  { key: "task_50", title: "Imparável", desc: "Complete 50 tarefas", icon: Trophy, type: "tasks_completed", value: 50, xp: 200 },
  { key: "streak_3", title: "Constância", desc: "3 dias seguidos", icon: Flame, type: "streak", value: 3, xp: 30 },
  { key: "streak_7", title: "Semana de Fogo", desc: "7 dias seguidos", icon: Flame, type: "streak", value: 7, xp: 100 },
  { key: "pomo_10", title: "Focado", desc: "10 pomodoros", icon: Timer, type: "pomodoros", value: 10, xp: 50 },
  { key: "xp_500", title: "Meio Milhar", desc: "500 XP acumulados", icon: Zap, type: "xp", value: 500, xp: 50 },
  { key: "xp_2000", title: "Veterano", desc: "2000 XP acumulados", icon: Star, type: "xp", value: 2000, xp: 200 },
];

const DIVISIONS = [
  { label: "Bronze", minLevel: 0, gradient: "from-amber-700 to-amber-500", emoji: "🥉" },
  { label: "Prata", minLevel: 5, gradient: "from-slate-400 to-slate-300", emoji: "🥈" },
  { label: "Ouro", minLevel: 10, gradient: "from-yellow-500 to-yellow-300", emoji: "🥇" },
  { label: "Platina", minLevel: 20, gradient: "from-cyan-400 to-teal-300", emoji: "💎" },
  { label: "Diamante", minLevel: 30, gradient: "from-blue-400 to-indigo-400", emoji: "💠" },
];

export default function Profile() {
  const { stats, tasks, moodEntries, quizResults, examPlans } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("Temas");
  const [selectedTheme, setSelectedTheme] = useState("brio_classic");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const level = calculateLevel(stats.total_xp);

  const isUnlocked = (ach: typeof ACHIEVEMENTS[number]) => {
    switch (ach.type) {
      case "tasks_completed": return stats.tasks_completed >= ach.value;
      case "streak": return stats.best_streak >= ach.value;
      case "pomodoros": return stats.pomodoros_completed >= ach.value;
      case "xp": return stats.total_xp >= ach.value;
      default: return false;
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleExportData = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      profile: { name: user?.name, email: user?.email, bio: user?.bio },
      stats,
      tasks,
      moodEntries,
      quizResults,
      examPlans,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brio-meus-dados-${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDeleteData = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await Promise.all([
        supabase.from("tasks").delete().eq("user_id", user.id),
        supabase.from("mood_entries").delete().eq("user_id", user.id),
        supabase.from("quiz_results").delete().eq("user_id", user.id),
        supabase.from("exam_plans").delete().eq("user_id", user.id),
        supabase.from("user_stats").delete().eq("user_id", user.id),
      ]);
      ["stats", "tasks", "mood", "quiz", "examplans", "pending"].forEach((k) =>
        localStorage.removeItem(`brio_${k}_${user.id}`)
      );
    } finally {
      logout();
      navigate("/login");
    }
  };

  const initials = (user?.name || "U").slice(0, 2).toUpperCase();

  return (
    <div>
      <HeroBanner stats={stats} />

      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg"
          style={{ backgroundColor: user?.avatarColor || "#7c3aed" }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-heading font-bold text-foreground truncate">{user?.name}</h2>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          {user?.bio && <p className="text-xs text-muted-foreground mt-0.5 truncate">{user.bio}</p>}
        </div>
        <Link
          to="/profile/edit"
          className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" /> Editar
        </Link>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex gap-2 mb-5 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                activeTab === tab
                  ? "bg-primary text-white"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "Temas" && "🎨 "}
              {tab === "Conquistas" && "🏆 "}
              {tab === "Divisões" && "🥇 "}
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Temas" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {THEMES.map((theme, i) => {
              const locked = level < theme.minLevel;
              const selected = selectedTheme === theme.id;
              return (
                <motion.div
                  key={theme.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => !locked && setSelectedTheme(theme.id)}
                  className={cn(
                    "relative rounded-xl overflow-hidden cursor-pointer aspect-video border-2 transition-all",
                    locked ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02]",
                    selected ? "border-primary ring-2 ring-primary/40" : "border-transparent"
                  )}
                >
                  <div className={`w-full h-full bg-gradient-to-br ${theme.gradient} flex items-end p-2`}>
                    <div className="flex flex-col">
                      {theme.tag && (
                        <span className="text-[10px] text-white/80 font-bold uppercase tracking-wide">{theme.tag}</span>
                      )}
                      <span className="text-sm font-bold text-white drop-shadow">{theme.label}</span>
                    </div>
                    <span className="absolute top-2 right-2 text-xl">{theme.emoji}</span>
                  </div>
                  {locked && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-white/80" />
                    </div>
                  )}
                  {selected && (
                    <div className="absolute top-2 left-2">
                      <CheckCircle2 className="w-4 h-4 text-white drop-shadow" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {activeTab === "Conquistas" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ACHIEVEMENTS.map((ach, i) => {
              const done = isUnlocked(ach);
              return (
                <motion.div
                  key={ach.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "rounded-xl p-3 border text-center",
                    done ? "bg-primary/5 border-primary/30" : "bg-secondary border-border opacity-60"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2", done ? "bg-primary/15" : "bg-muted")}>
                    {done ? <ach.icon className="w-5 h-5 text-primary" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <p className="text-xs font-bold text-foreground">{ach.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{ach.desc}</p>
                  <p className="text-[10px] text-primary font-bold mt-1">+{ach.xp} XP</p>
                </motion.div>
              );
            })}
          </div>
        )}

        {activeTab === "Divisões" && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {DIVISIONS.map((div, i) => {
              const unlocked = level >= div.minLevel;
              return (
                <motion.div
                  key={div.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={cn(
                    "rounded-xl overflow-hidden border-2",
                    unlocked ? "border-primary/30" : "border-transparent opacity-50"
                  )}
                >
                  <div className={`bg-gradient-to-br ${div.gradient} p-4 text-center`}>
                    <span className="text-3xl">{div.emoji}</span>
                  </div>
                  <div className="bg-card p-2 text-center">
                    <p className="text-sm font-bold text-foreground">{div.label}</p>
                    <p className="text-[10px] text-muted-foreground">Nível {div.minLevel}+</p>
                    {unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-primary mx-auto mt-1" />}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Privacidade e dados</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Conforme a LGPD, você pode baixar uma cópia de tudo que o BRIO guarda sobre você, ou apagar
          esses dados quando quiser.
        </p>

        <button
          onClick={handleExportData}
          className="w-full h-10 flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/40 hover:bg-secondary/70 text-sm text-foreground transition-colors mb-2"
        >
          <Download className="w-4 h-4" />
          Exportar meus dados (.json)
        </button>

        {!confirmingDelete ? (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="w-full h-10 flex items-center justify-center gap-2 rounded-xl border border-destructive/30 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            Excluir meus dados
          </button>
        ) : (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 space-y-2">
            <p className="text-xs text-foreground">
              Isso apaga permanentemente suas tarefas, XP, streak, humor registrado, resultados de
              quiz e planos de prova, e desconecta você. Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="flex-1 h-9 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteData}
                disabled={deleting}
                className="flex-1 h-9 rounded-lg bg-destructive hover:bg-destructive/90 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Sim, excluir tudo"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>
      </div>
    </div>
  );
}

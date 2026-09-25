import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Flame, CheckCircle2, Timer, Star, Trophy, Lock,
  Pencil, LogOut, Calendar, Share2, X
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useApp, calculateLevel } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
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
  const { stats, tasks } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("Temas");
  const [selectedTheme, setSelectedTheme] = useState("brio_classic");
  const [showCard, setShowCard] = useState(false);
  const level = calculateLevel(stats.total_xp);

  const currentDivision = [...DIVISIONS].reverse().find((d) => level >= d.minLevel) || DIVISIONS[0];
  const latestAchievement = [...ACHIEVEMENTS].reverse().find((a) => {
    switch (a.type) {
      case "tasks_completed": return stats.tasks_completed >= a.value;
      case "streak": return stats.best_streak >= a.value;
      case "pomodoros": return stats.pomodoros_completed >= a.value;
      case "xp": return stats.total_xp >= a.value;
      default: return false;
    }
  });
  const focusHours = Math.floor(stats.total_focus_minutes / 60);
  const memberSince = user?.createdAt
    ? format(new Date(user.createdAt), "MMMM 'de' yyyy", { locale: ptBR })
    : null;

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
        <button
          onClick={() => setShowCard(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" /> Cartão
        </button>
        <Link
          to="/profile/edit"
          className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" /> Editar
        </Link>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          {memberSince && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" /> Membro desde {memberSince}
            </span>
          )}
        </div>
        <p className="text-xs font-semibold text-muted-foreground mb-3">Sua jornada até aqui</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xl font-heading font-bold text-foreground">{stats.tasks_completed}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">tarefas concluídas</p>
          </div>
          <div>
            <p className="text-xl font-heading font-bold text-foreground">{focusHours}h</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">de foco acumulado</p>
          </div>
          <div>
            <p className="text-xl font-heading font-bold text-foreground">{stats.best_streak}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">melhor streak (dias)</p>
          </div>
        </div>
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

      <div className="mt-4 text-center">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>
      </div>

      <AnimatePresence>
        {showCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            onClick={() => setShowCard(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm"
            >
              <div className={`rounded-3xl overflow-hidden bg-gradient-to-br ${currentDivision.gradient} p-6 relative`}>
                <button
                  onClick={() => setShowCard(false)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg border-2 border-white/30"
                    style={{ backgroundColor: user?.avatarColor || "#7c3aed" }}
                  >
                    {initials}
                  </div>
                  <div>
                    <p className="font-heading font-bold text-white text-lg leading-tight">{user?.name}</p>
                    <p className="text-white/80 text-xs flex items-center gap-1">
                      {currentDivision.emoji} Divisão {currentDivision.label}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-5">
                  <div className="bg-black/20 rounded-xl p-2.5 text-center">
                    <p className="text-white font-heading font-bold text-lg">{level}</p>
                    <p className="text-white/70 text-[10px] mt-0.5">Nível</p>
                  </div>
                  <div className="bg-black/20 rounded-xl p-2.5 text-center">
                    <p className="text-white font-heading font-bold text-lg">{stats.total_xp}</p>
                    <p className="text-white/70 text-[10px] mt-0.5">XP total</p>
                  </div>
                  <div className="bg-black/20 rounded-xl p-2.5 text-center">
                    <p className="text-white font-heading font-bold text-lg">{stats.current_streak}</p>
                    <p className="text-white/70 text-[10px] mt-0.5">Streak</p>
                  </div>
                </div>

                {latestAchievement && (
                  <div className="bg-black/20 rounded-xl p-3 flex items-center gap-2.5">
                    <latestAchievement.icon className="w-5 h-5 text-white shrink-0" />
                    <div>
                      <p className="text-white text-xs font-semibold">{latestAchievement.title}</p>
                      <p className="text-white/70 text-[10px]">Conquista mais recente</p>
                    </div>
                  </div>
                )}

                <p className="text-center text-white/60 text-[10px] mt-5">BRIO — Foco, disciplina e constância</p>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-3">
                Tire um print pra compartilhar seu progresso
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

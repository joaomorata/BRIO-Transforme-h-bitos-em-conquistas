import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Flame, CheckCircle2, Timer, Star, Trophy, Lock,
  Pencil, LogOut, Calendar, Share2, X, Palette, Award, Loader2, AlertCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useApp, calculateLevel } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import HeroBanner from "@/components/layout/HeroBanner";
import UserAvatar from "@/components/ui/UserAvatar";

// Mesma cor sempre significa a mesma coisa no BRIO inteiro — então os temas
// ciclam pelos 5 tons já definidos no design system (--chart-1..5), em vez de
// cada um inventar um gradiente novo.
const PALETTE_TOKENS = [
  "hsl(250 85% 65%)",
  "hsl(175 80% 50%)",
  "hsl(45 90% 60%)",
  "hsl(330 80% 60%)",
  "hsl(200 80% 55%)",
];

const THEMES = [
  { id: "brio2026_especial", label: "BRIO 2026 Especial", minLevel: 0, tag: "2026" },
  { id: "brio2026", label: "BRIO 2026", minLevel: 0, tag: "2026" },
  { id: "brio_classic", label: "Plataforma BRIO", minLevel: 0, tag: null },
  { id: "madeira", label: "Madeira", minLevel: 0, tag: null },
  { id: "alvo", label: "Alvo", minLevel: 5, tag: "Nível 5" },
  { id: "aviao", label: "Avião", minLevel: 10, tag: "Nível 10" },
  { id: "fogo", label: "Fogo", minLevel: 15, tag: "Nível 15" },
  { id: "gladiador", label: "Gladiador", minLevel: 20, tag: "Nível 20" },
  { id: "hoverboard", label: "Hoverboard", minLevel: 25, tag: "Nível 25" },
  { id: "foguete", label: "Foguete", minLevel: 30, tag: "Nível 30" },
];

const TABS = ["Temas", "Conquistas", "Divisões"] as const;
type TabType = typeof TABS[number];
const TAB_ICONS: Record<TabType, typeof Palette> = {
  Temas: Palette,
  Conquistas: Trophy,
  Divisões: Award,
};

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
  { label: "Bronze", minLevel: 0, color: "hsl(45 90% 60%)" },
  { label: "Prata", minLevel: 5, color: "hsl(var(--muted-foreground))" },
  { label: "Ouro", minLevel: 10, color: "hsl(45 90% 60%)" },
  { label: "Platina", minLevel: 20, color: "hsl(175 80% 50%)" },
  { label: "Diamante", minLevel: 30, color: "hsl(250 85% 65%)" },
];

export default function Profile() {
  const { stats, tasks } = useApp();
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("Temas");
  const [savingTheme, setSavingTheme] = useState<string | null>(null);
  const [themeError, setThemeError] = useState("");
  const [showCard, setShowCard] = useState(false);
  const level = calculateLevel(stats.total_xp);

  const handleSelectTheme = async (themeId: string, color: string) => {
    if (savingTheme) return;
    setThemeError("");
    setSavingTheme(themeId);
    const result = await updateProfile({ avatarColor: color, theme: themeId });
    setSavingTheme(null);
    if (!result.success) {
      setThemeError(result.error || "Não foi possível aplicar o tema.");
    }
  };

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


  const currentDivision = [...DIVISIONS].reverse().find((d) => level >= d.minLevel) || DIVISIONS[0];
  const latestAchievement = [...ACHIEVEMENTS].reverse().find(isUnlocked);
  // Horas inteiras escondiam qualquer foco abaixo de 60min (sempre "0h", mesmo
  // com sessões já registradas) — agora mostra minutos enquanto não completa 1h.
  const focusHours = Math.floor(stats.total_focus_minutes / 60);
  const focusMins = stats.total_focus_minutes % 60;
  const focusDisplay = focusHours > 0 ? `${focusHours}h${String(focusMins).padStart(2, "0")}` : `${focusMins}min`;
  const memberSince = user?.createdAt
    ? format(new Date(user.createdAt), "MMMM 'de' yyyy", { locale: ptBR })
    : null;

  return (
    <div>
      <HeroBanner stats={stats} />

      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          {user?.bio && <p className="text-xs text-muted-foreground mt-0.5 truncate">{user.bio}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
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
            <p className="text-xl font-heading font-bold text-foreground">{focusDisplay}</p>
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
          {TABS.map((tab) => {
            const Icon = TAB_ICONS[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                  activeTab === tab
                    ? "bg-primary text-white"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab}
              </button>
            );
          })}
        </div>

        {activeTab === "Temas" && (
          <div>
            {themeError && (
              <div className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2.5 mb-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">{themeError}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground mb-3">
              Escolha a cor do seu avatar — ela aparece no seu perfil, no ranking e para outros usuários.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {THEMES.map((theme, i) => {
                const locked = level < theme.minLevel;
                const color = PALETTE_TOKENS[i % PALETTE_TOKENS.length];
                const selected = (user?.theme || "brio_classic") === theme.id;
                const saving = savingTheme === theme.id;
                return (
                  <motion.div
                    key={theme.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => !locked && handleSelectTheme(theme.id, color)}
                    className={cn(
                      "relative rounded-xl border p-3 transition-colors",
                      locked ? "opacity-50 cursor-not-allowed border-border" : "cursor-pointer border-border hover:border-primary/40",
                      selected && "border-primary ring-1 ring-primary/40"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-8 w-8 rounded-lg shrink-0"
                        style={{ backgroundColor: color }}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1 pr-4">
                        <p className="text-sm font-semibold text-foreground truncate">{theme.label}</p>
                        {theme.tag && (
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{theme.tag}</p>
                        )}
                      </div>
                    </div>
                    {locked && <Lock className="absolute top-3 right-3 h-3.5 w-3.5 text-muted-foreground" />}
                    {saving && <Loader2 className="absolute top-3 right-3 h-4 w-4 text-primary animate-spin" />}
                    {!saving && selected && <CheckCircle2 className="absolute top-3 right-3 h-4 w-4 text-primary" />}
                  </motion.div>
                );
              })}
            </div>
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
                    "rounded-xl border p-4 text-center transition-colors",
                    unlocked ? "border-primary/30 bg-secondary/30" : "border-border opacity-50"
                  )}
                >
                  <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: div.color }} />
                  </span>
                  <p className="mt-2.5 text-sm font-bold text-foreground">{div.label}</p>
                  <p className="text-[10px] text-muted-foreground">Nível {div.minLevel}+</p>
                  {unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-primary mx-auto mt-1.5" />}
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
              <div className="rounded-3xl overflow-hidden bg-[hsl(230_30%_5%)] border border-border p-6 relative">
                <button
                  onClick={() => setShowCard(false)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3 mb-5">
                  <UserAvatar
                    url={user?.avatarUrl}
                    color={user?.avatarColor}
                    name={user?.name}
                    size={56}
                    className="shadow-lg border-2 border-white/10 text-lg"
                  />
                  <div>
                    <p className="font-heading font-bold text-white text-lg leading-tight">{user?.name}</p>
                    <p className="text-white/70 text-xs flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: currentDivision.color }} />
                      Divisão {currentDivision.label}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-5">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                    <p className="text-white font-heading font-bold text-lg">{level}</p>
                    <p className="text-white/60 text-[10px] mt-0.5">Nível</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                    <p className="text-white font-heading font-bold text-lg">{stats.total_xp}</p>
                    <p className="text-white/60 text-[10px] mt-0.5">XP total</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                    <p className="text-white font-heading font-bold text-lg">{stats.current_streak}</p>
                    <p className="text-white/60 text-[10px] mt-0.5">Streak</p>
                  </div>
                </div>

                {latestAchievement && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-2.5">
                    <latestAchievement.icon className="w-5 h-5 text-primary shrink-0" />
                    <div>
                      <p className="text-white text-xs font-semibold">{latestAchievement.title}</p>
                      <p className="text-white/60 text-[10px]">Conquista mais recente</p>
                    </div>
                  </div>
                )}

                <p className="text-center text-white/50 text-[10px] mt-5">BRIO — Foco, disciplina e constância</p>
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

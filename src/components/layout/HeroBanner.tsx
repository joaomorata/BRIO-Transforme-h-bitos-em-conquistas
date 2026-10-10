import { motion } from "framer-motion";
import { Flame, CheckCircle2 } from "lucide-react";
import { calculateLevel, xpForNextLevel, type UserStats } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import UserAvatar from "@/components/ui/UserAvatar";

// Divisões usam os mesmos tokens de cor do resto do app (chart-1..5 no index.css),
// não cores soltas — assim uma divisão nova nunca introduz uma cor fora da paleta.
const DIVISIONS = [
  { min: 0, label: "Bronze", dot: "bg-[hsl(45_90%_60%)]", text: "text-[hsl(45_90%_60%)]" },
  { min: 5, label: "Prata", dot: "bg-muted-foreground", text: "text-muted-foreground" },
  { min: 10, label: "Ouro", dot: "bg-[hsl(45_90%_60%)]", text: "text-[hsl(45_90%_60%)]" },
  { min: 20, label: "Platina", dot: "bg-accent", text: "text-accent" },
  { min: 30, label: "Diamante", dot: "bg-primary", text: "text-primary" },
];

function getDivision(level: number) {
  for (let i = DIVISIONS.length - 1; i >= 0; i--) {
    if (level >= DIVISIONS[i].min) return DIVISIONS[i];
  }
  return DIVISIONS[0];
}

interface HeroBannerProps {
  stats: UserStats;
  userName?: string;
}

export default function HeroBanner({ stats, userName }: HeroBannerProps) {
  const { user } = useAuth();
  const displayName = userName || user?.name || "Estudante";
  const avatarColor = user?.avatarColor || "#7c3aed";

  const xp = stats.total_xp;
  const level = calculateLevel(xp);
  const nextXP = xpForNextLevel(xp);
  const prevXP = (level - 1) * 200;
  const division = getDivision(level);
  const progressPct = nextXP > prevXP ? ((xp - prevXP) / (nextXP - prevXP)) * 100 : 0;

  return (
    <div className="mb-6 rounded-2xl border border-border bg-[hsl(230_30%_5%)] p-5 md:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <div className="flex items-center gap-3.5">
          <UserAvatar
            url={user?.avatarUrl}
            color={avatarColor}
            name={displayName}
            size={52}
            className="text-lg"
          />
          <div>
            <p className="font-heading text-base font-bold leading-tight text-foreground">
              Olá, {displayName}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${division.dot}`} />
              <span className={`text-xs font-semibold ${division.text}`}>
                Divisão {division.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">Nível {level}</span>
            <span className="font-mono text-xs font-semibold text-foreground">
              {xp} / {nextXP} XP
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5">
            <Flame className="h-4 w-4 text-accent" />
            <div>
              <p className="text-sm font-bold leading-none text-foreground">{stats.current_streak}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">dias seguidos</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-bold leading-none text-foreground">{stats.tasks_completed}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">tarefas feitas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

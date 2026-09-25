import { motion } from "framer-motion";
import { Flame, Calendar, Zap } from "lucide-react";
import { calculateLevel, xpForNextLevel, type UserStats } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

const DIVISIONS = [
  { min: 0, label: "BRONZE", color: "from-amber-700 to-amber-500" },
  { min: 5, label: "PRATA", color: "from-slate-400 to-slate-300" },
  { min: 10, label: "OURO", color: "from-yellow-500 to-yellow-300" },
  { min: 20, label: "PLATINA", color: "from-cyan-400 to-teal-300" },
  { min: 30, label: "DIAMANTE", color: "from-blue-400 to-indigo-400" },
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
  const initials = displayName.slice(0, 2).toUpperCase();

  const xp = stats.total_xp;
  const level = calculateLevel(xp);
  const nextXP = xpForNextLevel(xp);
  const prevXP = (level - 1) * 200;
  const division = getDivision(level);
  const progressPct = nextXP > prevXP ? ((xp - prevXP) / (nextXP - prevXP)) * 100 : 0;

  return (
    <div className="relative rounded-2xl overflow-hidden mb-6 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-4 md:p-5">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-1/4 w-px h-full bg-white rotate-12 scale-150" />
        <div className="absolute top-0 left-1/3 w-px h-full bg-white rotate-12 scale-150" />
        <div className="absolute top-0 right-1/4 w-px h-full bg-white -rotate-12 scale-150" />
      </div>

      <div className="relative flex flex-col md:flex-row items-center gap-4">
        <div
          className="flex-shrink-0 w-14 h-14 rounded-xl border-2 border-white/40 flex items-center justify-center text-xl font-bold text-white"
          style={{ backgroundColor: avatarColor }}
        >
          {initials}
        </div>

        <div className="flex-1 text-center md:text-left">
          <p className="text-white font-bold text-lg leading-tight">
            Olá, {displayName}! 👋
          </p>
          <div className={`inline-flex mt-1 px-2 py-0.5 rounded text-xs font-bold text-white bg-gradient-to-r ${division.color}`}>
            Divisão {division.label}
          </div>
        </div>

        <div className="flex items-center gap-3 bg-black/30 rounded-xl px-4 py-2.5 min-w-[220px]">
          <Flame className="w-6 h-6 text-orange-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="text-xs text-white/70 whitespace-nowrap">Nível {level}</span>
              <span className="text-xs font-mono text-white font-bold whitespace-nowrap">{xp} / {nextXP} XP</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-yellow-300"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/30 rounded-xl px-4 py-2.5">
          <Calendar className="w-5 h-5 text-green-400" />
          <div className="text-center">
            <p className="text-lg font-bold text-white leading-none">{stats.current_streak}</p>
            <p className="text-[10px] text-white/70">dias estudando</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/30 rounded-xl px-4 py-2.5">
          <Zap className="w-5 h-5 text-yellow-400" />
          <div className="text-center">
            <p className="text-lg font-bold text-white leading-none">{stats.tasks_completed}</p>
            <p className="text-[10px] text-white/70">tarefas feitas</p>
          </div>
        </div>
      </div>
    </div>
  );
}

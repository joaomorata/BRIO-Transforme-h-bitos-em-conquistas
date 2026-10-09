import { useState } from "react";
import { Target, Gift } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { getWeeklyChallenge, weekKey } from "@/lib/weeklyChallenge";

export default function WeeklyChallengeCard() {
  const { tasks, stats, addXP } = useApp();
  const { user } = useAuth();

  const challenge = getWeeklyChallenge();
  const progress = challenge.getProgress(tasks, stats.weekly_xp_log);
  const reached = progress >= challenge.target;
  const currentWeek = weekKey();
  const storageKey = `brio_challenge_claimed_${user?.id ?? "guest"}`;

  const [claimedWeek, setClaimedWeek] = useState<string | null>(() => {
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  });
  const alreadyClaimed = claimedWeek === currentWeek;

  const claim = () => {
    if (!reached || alreadyClaimed) return;
    addXP(challenge.xpReward);
    try {
      localStorage.setItem(storageKey, currentWeek);
    } catch {
      // segue sem persistir o resgate se o localStorage estiver indisponível
    }
    setClaimedWeek(currentWeek);
  };

  const pct = Math.min(100, Math.round((progress / challenge.target) * 100));

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <Target className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Desafio da semana</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{challenge.title}</p>

      <div className="h-2 rounded-full bg-secondary overflow-hidden mb-2">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {Math.min(progress, challenge.target)} / {challenge.target} {challenge.unit}
        </span>
        {alreadyClaimed ? (
          <span className="text-xs text-accent font-semibold flex items-center gap-1">
            <Gift className="w-3.5 h-3.5" /> Resgatado
          </span>
        ) : reached ? (
          <button
            onClick={claim}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <Gift className="w-3.5 h-3.5" /> Resgatar +{challenge.xpReward}xp
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">+{challenge.xpReward}xp ao completar</span>
        )}
      </div>
    </div>
  );
}

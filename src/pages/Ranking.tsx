import { useEffect, useState } from "react";
import { Crown, Loader2, WifiOff } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface LeaderboardRow {
  user_id: string;
  display_name: string | null;
  avatar_color: string | null;
  total_xp: number;
  level: number;
  current_streak: number;
}

const MEDAL_COLORS = ["text-yellow-400", "text-slate-300", "text-amber-600"];

export default function Ranking() {
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error: fetchError } = await supabase
        .from("user_stats")
        .select("user_id, display_name, avatar_color, total_xp, level, current_streak")
        .order("total_xp", { ascending: false })
        .limit(50);

      if (cancelled) return;

      if (fetchError) {
        setError(true);
        return;
      }
      setRows((data as LeaderboardRow[]) ?? []);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <Crown className="w-6 h-6 text-yellow-400" />
          Ranking
        </h1>
        <p className="text-sm text-muted-foreground">Quem mais ganhou XP no BRIO.</p>
      </div>

      {error && (
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center gap-2 text-center">
          <WifiOff className="w-5 h-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar o ranking agora. O ranking precisa de internet — os outros
            dados do BRIO continuam funcionando offline normalmente.
          </p>
        </div>
      )}

      {!error && rows === null && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!error && rows !== null && rows.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">
          Ninguém pontuou ainda. Seja o primeiro do ranking!
        </p>
      )}

      {!error && rows !== null && rows.length > 0 && (
        <div className="space-y-2">
          {rows.map((row, i) => {
            const isMe = row.user_id === user?.id;
            const name = row.display_name || "Estudante";
            const initial = name.charAt(0).toUpperCase();
            return (
              <div
                key={row.user_id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3.5",
                  isMe ? "bg-primary/10 border-primary/40" : "bg-card border-border"
                )}
              >
                <span className="w-6 text-center text-sm font-mono text-muted-foreground shrink-0">
                  {i < 3 ? (
                    <Crown className={cn("w-4 h-4 inline", MEDAL_COLORS[i])} />
                  ) : (
                    i + 1
                  )}
                </span>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: row.avatar_color || "#7c3aed" }}
                >
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {name} {isMe && <span className="text-primary text-xs">(você)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Nível {row.level} · streak {row.current_streak}d
                  </p>
                </div>
                <span className="text-sm font-mono font-bold text-primary shrink-0">
                  {row.total_xp} XP
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

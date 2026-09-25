import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";
import { Activity } from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { WeeklyXPEntry, MoodEntry } from "@/context/AppContext";

interface EnergyXPChartProps {
  weeklyLog: WeeklyXPEntry[];
  moodEntries: MoodEntry[];
}

export default function EnergyXPChart({ weeklyLog, moodEntries }: EnergyXPChartProps) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const dateObj = subDays(new Date(), 6 - i);
    const date = format(dateObj, "yyyy-MM-dd");
    const dayLabel = format(dateObj, "EEE", { locale: ptBR });

    const xpEntry = (weeklyLog || []).find((e) => e.date === date);

    const dayMoods = (moodEntries || []).filter(
      (m) => format(new Date(m.occurred_at), "yyyy-MM-dd") === date
    );
    const avgEnergy =
      dayMoods.length > 0
        ? dayMoods.reduce((sum, m) => sum + m.energy, 0) / dayMoods.length
        : null;

    return { day: dayLabel, xp: xpEntry?.xp || 0, energia: avgEnergy };
  });

  const hasMoodData = last7Days.some((d) => d.energia !== null);

  if (!hasMoodData) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3 h-48">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Energia x Produtividade</h3>
          <p className="text-xs text-muted-foreground max-w-[220px]">
            Responda "como está sua energia?" numa sessão de foco para começar a ver esse
            cruzamento aqui.
          </p>
        </div>
        <Link
          to="/pomodoro"
          className="text-xs font-semibold text-primary hover:underline"
        >
          Ir para o Foco →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1">Energia x Produtividade</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Barras: XP do dia. Linha: energia média informada por você (1 a 5).
      </p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={last7Days}>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis yAxisId="xp" hide />
            <YAxis yAxisId="energy" hide domain={[0, 5]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                fontSize: 12,
                color: "hsl(var(--foreground))",
              }}
              formatter={(value: number, name: string) =>
                name === "energia" ? [value ? value.toFixed(1) : "-", "Energia média"] : [value, "XP"]
              }
            />
            <Bar yAxisId="xp" dataKey="xp" fill="hsl(250 85% 65% / 0.35)" radius={[6, 6, 0, 0]} />
            <Line
              yAxisId="energy"
              type="monotone"
              dataKey="energia"
              stroke="hsl(175 80% 50%)"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

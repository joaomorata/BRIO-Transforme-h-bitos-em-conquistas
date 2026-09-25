import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { WeeklyXPEntry } from "@/context/AppContext";

interface XPChartProps {
  weeklyLog: WeeklyXPEntry[];
}

export default function XPChart({ weeklyLog }: XPChartProps) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
    const dayLabel = format(subDays(new Date(), 6 - i), "EEE", { locale: ptBR });
    const entry = (weeklyLog || []).find((e) => e.date === date);
    return { day: dayLabel, xp: entry?.xp || 0 };
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">XP nos últimos 7 dias</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={last7Days}>
            <defs>
              <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(250 85% 65%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(250 85% 65%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                fontSize: 12,
                color: "hsl(var(--foreground))",
              }}
            />
            <Area
              type="monotone"
              dataKey="xp"
              stroke="hsl(250 85% 65%)"
              strokeWidth={2}
              fill="url(#xpGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

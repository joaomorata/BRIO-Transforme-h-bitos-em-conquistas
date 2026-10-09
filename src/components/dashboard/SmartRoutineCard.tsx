import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Sparkles } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { computeRoutineInsight } from "@/lib/routineInsights";

export default function SmartRoutineCard() {
  const { tasks, moodEntries } = useApp();
  const insight = computeRoutineInsight(tasks, moodEntries);

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="mb-1 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Sua rotina inteligente</h3>
      </div>

      {!insight.ready ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Continue completando tarefas e sessões de foco ({insight.sampleSize}/5) para o BRIO
          identificar seus melhores horários automaticamente.
        </p>
      ) : (
        <>
          <p className="mb-4 text-xs text-muted-foreground">{insight.insightText}</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insight.periodCounts} layout="vertical" margin={{ left: 8 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={112}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: 12,
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {insight.periodCounts.map((entry) => (
                    <Cell
                      key={entry.period}
                      fill={
                        entry.period === insight.topPeriod
                          ? "hsl(250 85% 65%)"
                          : "hsl(250 85% 65% / 0.25)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

import { Sparkles } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getMotivationalMessage } from "@/lib/motivationalMessage";

export default function MotivationalBanner() {
  const { stats, tasks } = useApp();
  const message = getMotivationalMessage(stats, tasks);

  return (
    <div className="flex items-center gap-2.5 bg-primary/5 border border-primary/15 rounded-xl px-4 py-2.5 mb-6">
      <Sparkles className="w-4 h-4 text-primary shrink-0" />
      <p className="text-sm text-foreground/90">{message}</p>
    </div>
  );
}

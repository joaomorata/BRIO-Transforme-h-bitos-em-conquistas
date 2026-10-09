import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

const CONFIG = {
  synced: { icon: Cloud, label: "Sincronizado", className: "text-accent" },
  syncing: { icon: RefreshCw, label: "Sincronizando", className: "text-primary animate-spin" },
  offline: { icon: CloudOff, label: "Modo offline", className: "text-muted-foreground" },
} as const;

export default function SyncIndicator() {
  const { syncStatus } = useApp();
  const { icon: Icon, label, className } = CONFIG[syncStatus];

  return (
    <div
      className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card border border-border rounded-full px-3 py-1.5"
      title={
        syncStatus === "offline"
          ? "Sem conexão com o Supabase — seus dados continuam salvos neste dispositivo."
          : "Seus dados estão salvos na nuvem."
      }
    >
      <Icon className={cn("w-3.5 h-3.5", className)} />
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}

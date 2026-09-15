import { cn } from "@/lib/utils";

const LEVELS: { value: 1 | 2 | 3 | 4 | 5; emoji: string; label: string }[] = [
  { value: 1, emoji: "😴", label: "Exausto" },
  { value: 2, emoji: "😕", label: "Cansado" },
  { value: 3, emoji: "😐", label: "Neutro" },
  { value: 4, emoji: "🙂", label: "Disposto" },
  { value: 5, emoji: "🔥", label: "Muito disposto" },
];

interface EnergyPickerProps {
  onSelect: (value: 1 | 2 | 3 | 4 | 5) => void;
  selected?: number | null;
}

export default function EnergyPicker({ onSelect, selected }: EnergyPickerProps) {
  return (
    <div className="flex items-center gap-2">
      {LEVELS.map((level) => (
        <button
          key={level.value}
          type="button"
          onClick={() => onSelect(level.value)}
          title={level.label}
          aria-label={level.label}
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all border",
            selected === level.value
              ? "bg-primary/20 border-primary scale-110"
              : "bg-secondary/50 border-border hover:border-primary/40 hover:scale-105"
          )}
        >
          {level.emoji}
        </button>
      ))}
    </div>
  );
}

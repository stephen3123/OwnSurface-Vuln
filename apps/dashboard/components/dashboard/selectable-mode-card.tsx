import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SelectableModeCardProps {
  title: string;
  description: string;
  badge?: ReactNode;
  selected: boolean;
  onClick: () => void;
}

export function SelectableModeCard({
  title,
  description,
  badge,
  selected,
  onClick,
}: SelectableModeCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border-2 p-4 text-left transition-all",
        selected
          ? "border-teal-400/60 bg-teal-500/12 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          : "border-border/40 bg-card hover:border-border/80 hover:bg-accent/50",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">{title}</span>
        {badge}
      </div>
      <div className={cn("mt-2 text-[0.7rem] font-medium leading-relaxed", selected ? "text-foreground/75" : "text-muted-foreground")}>
        {description}
      </div>
    </button>
  );
}

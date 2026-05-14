import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HeroPanelProps {
  children: ReactNode;
  className?: string;
}

export function HeroPanel({ children, className }: HeroPanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1rem] border border-teal-500/15 bg-gradient-to-br from-[hsl(205_22%_16%)] via-[hsl(200_18%_12%)] to-[hsl(176_30%_10%)] p-6 text-white sm:p-8",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.12),transparent_28%)]" />
      <div className="absolute inset-0 opacity-[0.34] [background-image:radial-gradient(rgba(255,255,255,0.3)_0.9px,transparent_0.9px)] [background-size:16px_16px] [mask-image:linear-gradient(180deg,rgba(255,255,255,0.8),rgba(255,255,255,0.42))]" />
      <div className="relative">{children}</div>
    </div>
  );
}

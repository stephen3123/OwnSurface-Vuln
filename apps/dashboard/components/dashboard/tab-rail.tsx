import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TabItem<T extends string> = {
  key: T;
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
};

interface TabRailProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
}

export function TabRail<T extends string>({
  items,
  value,
  onChange,
  className,
  activeClassName,
  inactiveClassName,
}: TabRailProps<T>) {
  return (
    <div className={cn("flex items-center gap-1 overflow-x-auto rounded-[0.9rem] border border-border bg-card/50 p-1", className)}>
      {items.map((item) => {
        const isActive = item.key === value;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-[0.7rem] px-4 py-2.5 text-sm font-medium transition-colors",
              isActive ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              isActive ? activeClassName : inactiveClassName,
            )}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge}
          </button>
        );
      })}
    </div>
  );
}

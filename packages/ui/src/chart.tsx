"use client";

import * as React from "react";

// Chart wrapper for Recharts with consistent theming
export const chartColors = {
  primary: "#7c3aed",
  secondary: "#6366f1",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  muted: "#64748b",
  background: "#0f172a",
  grid: "#1e293b",
  text: "#94a3b8",
};

export interface ChartConfig {
  [key: string]: {
    label: string;
    color: string;
  };
}

interface ChartContainerProps {
  config: ChartConfig;
  children: React.ReactNode;
  className?: string;
}

export function ChartContainer({ config: _config, children, className }: ChartContainerProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  config?: ChartConfig;
}

export function ChartTooltipContent({ active, payload, label, config }: ChartTooltipContentProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-3 shadow-xl">
      {label && <p className="mb-1 text-xs text-slate-400">{label}</p>}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: config?.[entry.name]?.color ?? entry.color }}
          />
          <span className="text-slate-300">
            {config?.[entry.name]?.label ?? entry.name}:
          </span>
          <span className="font-medium text-slate-100">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

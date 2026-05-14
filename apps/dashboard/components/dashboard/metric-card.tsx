import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  sub: string;
  className?: string;
  valueClassName?: string;
}

export function MetricCard({
  label,
  value,
  sub,
  className,
  valueClassName,
}: MetricCardProps) {
  return (
    <div className={cn("rounded-xl border border-border/40 bg-card/50 p-6", className)}>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={cn("mt-3 text-2xl font-bold text-foreground", valueClassName)}>{value}</div>
      <div className="mt-2 text-sm text-muted-foreground">{sub}</div>
    </div>
  );
}

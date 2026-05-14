import type { LucideIcon } from "lucide-react";

interface EmptyStateCardProps {
  icon: LucideIcon;
  title: string;
  body?: string;
}

export function EmptyStateCard({ icon: Icon, title, body }: EmptyStateCardProps) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/40 px-6 py-12 text-center">
      <Icon className="mx-auto h-10 w-10 text-muted-foreground/35" />
      <p className="mt-4 text-sm font-medium text-foreground">{title}</p>
      {body ? <p className="mt-2 text-sm text-muted-foreground">{body}</p> : null}
    </div>
  );
}

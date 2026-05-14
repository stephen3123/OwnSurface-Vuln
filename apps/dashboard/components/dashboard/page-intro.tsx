import type { ReactNode } from "react";

interface PageIntroProps {
  description: string;
  actions?: ReactNode;
}

export function PageIntro({ description, actions }: PageIntroProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

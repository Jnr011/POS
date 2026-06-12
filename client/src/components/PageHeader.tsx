import type { ReactNode } from 'react';

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}

function PageHeader({ icon, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-lg bg-[oklch(0.55_0.16_220/0.1)] flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}

export { PageHeader };
export type { PageHeaderProps };

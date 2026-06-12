import type { ReactNode } from 'react';
import { Card, CardContent } from '../components/ui/card';

interface StatCardProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  onClick?: () => void;
  className?: string;
}

function StatCard({ icon, label, value, sub, accent, onClick, className }: StatCardProps) {
  return (
    <Card
      className={[
        'overflow-hidden',
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30',
        className,
      ].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      {accent && <div className={`h-1 ${accent}`} />}
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          {icon && (
            <div className="size-9 rounded-lg bg-[oklch(0.55_0.16_220/0.1)] flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { StatCard };
export type { StatCardProps };

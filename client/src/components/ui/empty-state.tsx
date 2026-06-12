import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

function EmptyState({ icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      compact ? 'py-8' : 'py-12',
      className,
    )}>
      <div className={cn(
        'rounded-full bg-muted/60 flex items-center justify-center mb-3 ring-1 ring-border/30',
        compact ? 'size-10' : 'size-12',
      )}>
        {icon ?? <Inbox className={cn('text-muted-foreground/50', compact ? 'size-4' : 'size-5')} />}
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground/60 mt-1 max-w-[240px]">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  retry?: () => void;
  className?: string;
}

function ErrorState({ icon, title = 'Something went wrong', description, retry, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3 ring-1 ring-destructive/20">
        {icon ?? <Inbox className="size-5 text-destructive/60" />}
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground/60 mt-1 max-w-[240px]">{description}</p>
      )}
      {retry && (
        <button
          onClick={retry}
          className="mt-3 text-xs font-medium text-primary hover:underline underline-offset-4"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export { EmptyState, ErrorState };

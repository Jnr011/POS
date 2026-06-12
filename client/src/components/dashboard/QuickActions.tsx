import { Link } from 'react-router-dom';
import { ShoppingCart, Package, BarChart3, Users } from 'lucide-react';
import { cn } from '../../lib/utils';

const ACTIONS = [
  { label: 'POS Terminal', description: 'Open the sales terminal', icon: ShoppingCart, path: '/pos', bg: 'bg-primary/10', hoverBg: 'group-hover:bg-primary/15', iconColor: 'text-primary' },
  { label: 'Inventory', description: 'Manage products & stock', icon: Package, path: '/inventory', bg: 'bg-chart-2/10', hoverBg: 'group-hover:bg-chart-2/15', iconColor: 'text-chart-2' },
  { label: 'Reports', description: 'View analytics & reports', icon: BarChart3, path: '/reports', bg: 'bg-chart-3/10', hoverBg: 'group-hover:bg-chart-3/15', iconColor: 'text-chart-3' },
  { label: 'Users', description: 'Manage sales reps', icon: Users, path: '/admin/users', bg: 'bg-chart-4/10', hoverBg: 'group-hover:bg-chart-4/15', iconColor: 'text-chart-4' },
] as const;

interface QuickActionsProps {
  className?: string;
}

function QuickActions({ className }: QuickActionsProps) {
  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-3', className)}>
      {ACTIONS.map(action => {
        const Icon = action.icon;
        return (
          <Link key={action.path} to={action.path}>
            <div className={cn(
              'rounded-xl border p-4 flex items-start gap-3 transition-all duration-200 cursor-pointer group',
              'hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30',
              action.bg, action.hoverBg,
            )}>
              <div className="size-9 rounded-lg bg-background/80 flex items-center justify-center shrink-0 shadow-sm">
                <Icon className={cn('size-4', action.iconColor)} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium group-hover:text-primary transition-colors">{action.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export { QuickActions };

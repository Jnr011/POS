import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  TrendingUp,
  FileText,
  ClipboardList,
  Users,
  Store,
  LogOut,
  Sun,
  Moon,
  X,
} from 'lucide-react';

import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useSyncStatus } from '../hooks/useSyncStatus';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

interface SidebarProps {
  onClose?: () => void;
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const SHARED_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'POS Terminal', path: '/pos', icon: ShoppingCart },
  { label: 'Sales History', path: '/sales', icon: FileText },
  { label: 'Inventory', path: '/inventory', icon: Package },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Reports Overview', path: '/reports', icon: BarChart3 },
  { label: 'Sales Report', path: '/reports/sales', icon: TrendingUp },
  { label: 'Products', path: '/reports/products', icon: Package },
  { label: 'Inventory', path: '/reports/inventory', icon: FileText },
  { label: 'Activity Log', path: '/reports/activity', icon: ClipboardList },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useIsActive(path: string) {
  const { pathname } = useLocation();
  return pathname === path || pathname.startsWith(path + '/');
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || 'U';
}

// ─── NavLink ──────────────────────────────────────────────────────────────────

function NavLink({ item }: { item: NavItem }) {
  const active = useIsActive(item.path);
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      className={[
        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150',
        active
          ? 'bg-sidebar-accent text-foreground font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-primary/[0.04]',
      ].join(' ')}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-primary" />
      )}
      <Icon
        className={[
          'size-[18px] shrink-0 transition-colors duration-150',
          active
            ? 'text-primary'
            : 'text-muted-foreground/70 group-hover:text-foreground',
        ].join(' ')}
      />
      <span className="flex-1 truncate">{item.label}</span>
    </Link>
  );
}

// ─── NavGroup ─────────────────────────────────────────────────────────────────

function NavGroup({ label, items }: { label?: string; items: NavItem[] }) {
  return (
    <div className="flex flex-col gap-0.5">
      {label && (
        <p className="mb-1 px-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50 select-none">
          {label}
        </p>
      )}
      {items.map(item => <NavLink key={item.path} item={item} />)}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { user, logout }                  = useAuthStore();
  const { theme, toggle: toggleTheme }    = useThemeStore();
  const { relayConnected, pendingPushes } = useSyncStatus();

  const isAdmin  = user?.role === 'admin';
  const userName = user?.name ?? 'User';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="flex h-full w-[220px] flex-col bg-sidebar border-r border-border">

      {/* ── Brand ── */}
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Store className="size-[15px] text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-foreground leading-tight">Pharmacy POS</p>
          <p className="text-[10px] text-muted-foreground/60 leading-tight tracking-wide">Point of Sale</p>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/[0.06] hover:text-foreground lg:hidden"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-2">
        <NavGroup items={SHARED_NAV} />

        {isAdmin && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/40 select-none">
                Admin
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <NavGroup items={ADMIN_NAV} />
          </div>
        )}
      </nav>

      {/* ── User + Controls ── */}
      <div className="border-t border-border px-3 pb-4 pt-3 space-y-0.5">

        <div className="mb-2 flex items-center gap-2.5 px-2 py-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary select-none">
            {initials(userName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-foreground leading-snug">
              {userName}
            </p>
            <p className="text-[10px] text-muted-foreground/70 leading-snug">
              {isAdmin ? 'Administrator' : 'Sales Rep'}
            </p>
          </div>
          <div
            title={relayConnected
              ? 'Connected'
              : `Offline${pendingPushes > 0 ? ` · ${pendingPushes} pending` : ''}`
            }
            className={[
              'size-2 shrink-0 rounded-full transition-colors duration-300',
              relayConnected ? 'bg-accent' : 'bg-muted-foreground/30',
            ].join(' ')}
          />
        </div>

        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-muted-foreground transition-colors duration-150 hover:bg-primary/[0.04] hover:text-foreground"
        >
          {theme === 'dark'
            ? <Sun  className="size-4 shrink-0" />
            : <Moon className="size-4 shrink-0" />}
          <span>{theme === 'dark' ? 'Light' : 'Dark'} mode</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-muted-foreground transition-colors duration-150 hover:bg-destructive/[0.06] hover:text-destructive"
        >
          <LogOut className="size-4 shrink-0" />
          <span>Log out</span>
        </button>
      </div>

    </aside>
  );
}

export default Sidebar;
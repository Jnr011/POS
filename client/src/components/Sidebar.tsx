import { useState, useEffect } from 'react';
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
  Settings,
  ChevronDown,
} from 'lucide-react';

import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { useStoreInfo } from '../hooks/useStoreInfo';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

interface SidebarProps {
  onClose?: () => void;
}

// ─── Shared routes ───────────────────────────────────────────────────────────

const SHARED_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'POS Terminal', path: '/pos', icon: ShoppingCart },
  { label: 'Sales History', path: '/sales', icon: FileText },
  { label: 'Inventory', path: '/inventory', icon: Package },
];

// ─── Report sub-routes ───────────────────────────────────────────────────────

const REPORT_ROUTES: NavItem[] = [
  { label: 'Sales Report', path: '/reports/sales', icon: TrendingUp },
  { label: 'Products', path: '/reports/products', icon: Package },
  { label: 'Inventory', path: '/reports/inventory', icon: FileText },
];

// ─── Admin main routes ───────────────────────────────────────────────────────

const ADMIN_MAIN: NavItem[] = [
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Activity Log', path: '/reports/activity', icon: ClipboardList },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || 'U';
}

function useIsActive(path: string) {
  const { pathname } = useLocation();
  return pathname === path;
}

function useIsChildActive(paths: string[]) {
  const { pathname } = useLocation();
  return paths.some(p => pathname === p);
}

// ─── NavLink ─────────────────────────────────────────────────────────────────

function NavLink({ item, sidebar }: { item: NavItem; sidebar?: boolean }) {
  const active = useIsActive(item.path);
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      onClick={sidebar ? undefined : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150',
        active
          ? 'bg-primary-foreground/15 text-primary-foreground font-medium'
          : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/8',
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-primary-foreground" />
      )}
      <Icon
        className={cn(
          'size-[18px] shrink-0 transition-colors duration-150',
          active
            ? 'text-primary-foreground'
            : 'text-primary-foreground/60 group-hover:text-primary-foreground',
        )}
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
        <p className="mb-1 px-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-primary-foreground/50 select-none">
          {label}
        </p>
      )}
      {items.map(item => <NavLink key={item.path} item={item} />)}
    </div>
  );
}

// ─── ReportsAccordion ────────────────────────────────────────────────────────

function ReportsAccordion() {
  const { pathname } = useLocation();
  const childPaths = REPORT_ROUTES.map(r => r.path);
  const overviewActive = useIsActive('/reports');
  const childActive = useIsChildActive(childPaths);
  const isExpanded = overviewActive || childActive;

  const [open, setOpen] = useState(isExpanded);

  useEffect(() => {
    setOpen(isExpanded);
  }, [isExpanded]);

  return (
    <div className="flex flex-col gap-0.5">
      <button
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 w-full text-left',
          overviewActive
            ? 'bg-primary-foreground/15 text-primary-foreground font-medium'
            : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/8',
        )}
      >
        {overviewActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-primary-foreground" />
        )}
        <BarChart3
          className={cn(
            'size-[18px] shrink-0 transition-colors duration-150',
            overviewActive
              ? 'text-primary-foreground'
              : 'text-primary-foreground/60 group-hover:text-primary-foreground',
          )}
        />
        <span className="flex-1 truncate">Reports</span>
        <ChevronDown
          className={cn(
            'size-4 transition-transform duration-200',
            open && 'rotate-180',
            overviewActive
              ? 'text-primary-foreground'
              : 'text-primary-foreground/50',
          )}
        />
      </button>

      {open && (
        <div className="ml-2 flex flex-col gap-0.5 border-l border-primary-foreground/15 pl-2">
          {REPORT_ROUTES.map(route => {
            const active = useIsActive(route.path);
            const Icon = route.icon;
            return (
              <Link
                key={route.path}
                to={route.path}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150',
                  active
                    ? 'bg-primary-foreground/15 text-primary-foreground font-medium'
                    : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/8',
                )}
              >
                <Icon
                  className={cn(
                    'size-[16px] shrink-0 transition-colors duration-150',
                    active
                      ? 'text-primary-foreground'
                      : 'text-primary-foreground/60 group-hover:text-primary-foreground',
                  )}
                />
                <span className="flex-1 truncate">{route.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { user, logout }                  = useAuthStore();
  const { theme, toggle: toggleTheme }    = useThemeStore();
  const { relayConnected, pendingPushes } = useSyncStatus();
  const { storeName } = useStoreInfo();

  const isAdmin  = user?.role === 'admin';
  const userName = user?.name ?? 'User';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="flex h-full w-[220px] flex-col bg-primary text-primary-foreground">

      {/* ── Brand ── */}
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15">
          <Store className="size-[15px] text-primary-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-primary-foreground leading-tight truncate">{storeName}</p>
          <p className="text-[10px] text-primary-foreground/60 leading-tight tracking-wide">Point of Sale</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-primary-foreground/60 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground lg:hidden"
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
              <div className="h-px flex-1 bg-primary-foreground/15" />
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-primary-foreground/40 select-none">
                Admin
              </span>
              <div className="h-px flex-1 bg-primary-foreground/15" />
            </div>

            <div className="flex flex-col gap-2">
              <NavGroup items={ADMIN_MAIN} />
              <ReportsAccordion />
            </div>
          </div>
        )}
      </nav>

      {/* ── Bottom controls ── */}
      <div className="border-t border-primary-foreground/15 px-3 pb-4 pt-3 space-y-0.5">

        {/* Settings */}
        {isAdmin && (
          <Link
            to="/admin/settings"
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors duration-150',
              useIsActive('/admin/settings')
                ? 'bg-primary-foreground/15 text-primary-foreground font-medium'
                : 'text-primary-foreground/70 hover:bg-primary-foreground/8 hover:text-primary-foreground',
            )}
          >
            <Settings className="size-4 shrink-0" />
            <span>Settings</span>
          </Link>
        )}

        {/* User card */}
        <Link
          to="/profile"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 mt-1 transition-colors duration-150 hover:bg-primary-foreground/8"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 text-[11px] font-semibold text-primary-foreground select-none">
            {initials(userName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-primary-foreground leading-snug">
              {userName}
            </p>
            <p className="text-[10px] text-primary-foreground/60 leading-snug">
              {isAdmin ? 'Administrator' : 'Sales Rep'}
            </p>
          </div>
          <div
            title={relayConnected
              ? 'Connected'
              : `Offline${pendingPushes > 0 ? ` · ${pendingPushes} pending` : ''}`
            }
            className={cn(
              'size-2 shrink-0 rounded-full transition-colors duration-300',
              relayConnected ? 'bg-accent' : 'bg-primary-foreground/30',
            )}
          />
        </Link>

        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-primary-foreground/70 transition-colors duration-150 hover:bg-primary-foreground/8 hover:text-primary-foreground"
        >
          {theme === 'dark'
            ? <Sun  className="size-4 shrink-0" />
            : <Moon className="size-4 shrink-0" />}
          <span>{theme === 'dark' ? 'Light' : 'Dark'} mode</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-primary-foreground/70 transition-colors duration-150 hover:bg-primary-foreground/10 hover:text-primary-foreground"
        >
          <LogOut className="size-4 shrink-0" />
          <span>Log out</span>
        </button>
      </div>

    </aside>
  );
}

export default Sidebar;

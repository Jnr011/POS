import { Outlet, useLocation } from 'react-router-dom';
import { Store, ShieldCheck, WifiOff, Zap } from 'lucide-react';

// ─── Feature callouts shown on the left panel ─────────────────────────────────

const FEATURES = [
  {
    icon: ShieldCheck,
    label: 'Role-based access',
    sub: 'Admins and sales reps see exactly what they need.',
  },
  {
    icon: WifiOff,
    label: 'Works offline',
    sub: 'Sales sync automatically when the connection returns.',
  },
  {
    icon: Zap,
    label: 'Built for speed',
    sub: 'PIN login, barcode scanning, instant checkout.',
  },
] as const;

// ─── AuthLayout ───────────────────────────────────────────────────────────────

function AuthLayout() {
  const { pathname } = useLocation();
  const isLogin = pathname === '/login';

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Left panel — desktop only ── */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] shrink-0 flex-col bg-primary px-12 py-10 justify-between">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-white/15">
            <Store className="size-[18px] text-white" />
          </div>
          <span className="text-white font-semibold text-[15px] tracking-tight">
            Pharmacy POS
          </span>
        </div>

        {/* Hero copy */}
        <div className="space-y-10">
          <h2 className="font-serif text-white text-4xl leading-snug">
            {isLogin
              ? 'Your pharmacy,\nalways in control.'
              : 'Set up your pharmacy\nin minutes.'}
          </h2>

          {/* Feature list */}
          <ul className="space-y-6">
            {FEATURES.map(({ icon: Icon, label, sub }) => (
              <li key={label} className="flex items-start gap-4">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="size-4 text-white/80" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white leading-snug">{label}</p>
                  <p className="text-[12px] text-white/55 leading-relaxed mt-0.5">{sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-white/30 tracking-wide">© {new Date().getFullYear()} Pharmacy POS</p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">

        {/* Mobile-only brand */}
        <div className="lg:hidden mb-10 flex flex-col items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
            <Store className="size-5 text-primary" />
          </div>
          <span className="font-semibold text-base tracking-tight text-foreground">Pharmacy POS</span>
        </div>

        {/* Form card */}
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>

    </div>
  );
}

export default AuthLayout;
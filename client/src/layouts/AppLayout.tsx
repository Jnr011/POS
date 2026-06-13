import { useState, useCallback, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useStoreInfo } from '../hooks/useStoreInfo';

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { storeName } = useStoreInfo();

  const close = useCallback(() => setSidebarOpen(false), []);
  const open  = useCallback(() => setSidebarOpen(true),  []);

  useEffect(() => { close(); }, [location.pathname, close]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {sidebarOpen && (
        <div
          aria-hidden="true"
          onClick={close}
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <div
        className={[
          'fixed inset-y-0 left-0 z-30 h-screen',
          'lg:relative lg:z-auto lg:translate-x-0',
          'transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        <Sidebar onClose={close} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">

        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4 lg:hidden">
          <button
            onClick={open}
            aria-label="Open navigation"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/[0.06] hover:text-foreground"
          >
            <Menu className="size-5" />
          </button>
          <span className="text-sm font-semibold text-foreground">{storeName}</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
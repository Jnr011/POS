import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { StoreSettings, TaxSettings, ReceiptSettings, BackupSettings } from '../components/settings';
import { PrinterDiagnosticsPanel } from '../components/PrinterDiagnosticsPanel';
import { useThemeStore } from '../store/themeStore';
import {
  Settings as SettingsIcon, Store, Percent, Receipt, HardDrive, Printer, Sun, Moon,
} from 'lucide-react';
import { cn } from '../lib/utils';

const TABS = [
  { id: 'store', label: 'Store Info', description: 'Name, address, contact', icon: Store },
  { id: 'tax', label: 'Tax', description: 'Rate and enablement', icon: Percent },
  { id: 'receipt', label: 'Receipt', description: 'Header and footer text', icon: Receipt },
  { id: 'backup', label: 'Backup & Sync', description: 'Data management', icon: HardDrive },
  { id: 'printer', label: 'Printer', description: 'Diagnostics and setup', icon: Printer },
] as const;

type TabId = typeof TABS[number]['id'];

function Settings() {
  const [activeTab, setActiveTab] = useState<TabId>('store');
  const { theme, toggle: toggleTheme } = useThemeStore();

  const renderContent = () => {
    switch (activeTab) {
      case 'store': return <StoreSettings />;
      case 'tax': return <TaxSettings />;
      case 'receipt': return <ReceiptSettings />;
      case 'backup': return <BackupSettings />;
      case 'printer': return <PrinterDiagnosticsPanel />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          icon={<SettingsIcon className="size-4 text-primary" />}
          title="Settings"
          description="Configure your pharmacy's system settings."
        />
        <button
          onClick={toggleTheme}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Tab sidebar ── */}
        <nav className="w-full lg:w-56 shrink-0 space-y-1 lg:sticky lg:top-6 lg:self-start">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150',
                  active
                    ? 'bg-primary/6 text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                )}
              >
                <div className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-150',
                  active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                )}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className={cn('text-sm font-medium leading-tight', active && 'text-foreground')}>
                    {tab.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground/70 leading-tight truncate">
                    {tab.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* ── Content ── */}
        <div className="flex-1 min-w-0">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default Settings;

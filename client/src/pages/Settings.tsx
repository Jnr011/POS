import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { StoreSettings, TaxSettings, ReceiptSettings, BackupSettings } from '../components/settings';
import { Settings as SettingsIcon, Store, Percent, Receipt, HardDrive, PlayCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useAuthStore } from '../store/authStore';
import { useOnboardingStore } from '../store/onboardingStore';

const TABS = [
  { id: 'store', label: 'Store Info', description: 'Name, address, contact', icon: Store },
  { id: 'tax', label: 'Tax', description: 'Rate and enablement', icon: Percent },
  { id: 'receipt', label: 'Receipt', description: 'Header and footer text', icon: Receipt },
  { id: 'backup', label: 'Backup & Sync', description: 'Data management', icon: HardDrive },
] as const;

type TabId = typeof TABS[number]['id'];

function Settings() {
  const [activeTab, setActiveTab] = useState<TabId>('store');
  const user = useAuthStore(s => s.user);
  const { startTour, isCompleted, reset } = useOnboardingStore();

  const handleReplayTour = () => {
    if (user) {
      reset(user.id);
      startTour();
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'store': return <StoreSettings />;
      case 'tax': return <TaxSettings />;
      case 'receipt': return <ReceiptSettings />;
      case 'backup': return <BackupSettings />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={<SettingsIcon className="size-4 text-primary" />}
        title="Settings"
        description="Configure your pharmacy's system settings."
      />

      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <PlayCircle className="size-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium">Interactive Tour</p>
              <p className="text-xs text-muted-foreground">Replay the onboarding tour to learn about the app's features.</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="gap-2 shrink-0" onClick={handleReplayTour}>
            <PlayCircle className="size-3.5" /> Replay Tour
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Tab sidebar ── */}
        <nav data-tour="settings-tabs" className="w-full lg:w-56 shrink-0 space-y-1 lg:sticky lg:top-6 lg:self-start">
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
                    ? 'bg-primary/[0.06] text-foreground'
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
        <div data-tour="settings-content" className="flex-1 min-w-0">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default Settings;

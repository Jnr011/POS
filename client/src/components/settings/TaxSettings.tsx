import { useState, useEffect } from 'react';
import { StoreRepository } from '../../db/repository';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Save, Percent } from 'lucide-react';
import { toast } from 'sonner';

export function TaxSettings() {
  const [taxRate, setTaxRate] = useState('');
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      StoreRepository.get('taxRate'),
      StoreRepository.get('taxEnabled'),
    ]).then(([rate, enabled]) => {
      setTaxRate(rate || '10');
      setTaxEnabled(enabled !== 'false');
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    const num = parseFloat(taxRate);
    if (isNaN(num) || num < 0 || num > 100) {
      toast.error('Tax rate must be between 0 and 100');
      return;
    }
    setSaving(true);
    try {
      await Promise.all([
        StoreRepository.set('taxRate', String(num)),
        StoreRepository.set('taxEnabled', String(taxEnabled)),
      ]);
      toast.success('Tax settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="h-16 w-full rounded-lg bg-muted animate-pulse" />
        <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
            <Percent className="size-[18px] text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Tax Configuration</h2>
            <p className="text-xs text-muted-foreground">Set the tax rate applied to all sales.</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5 space-y-5">
        {/* Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">Enable Tax</p>
            <p className="text-xs text-muted-foreground">Apply tax to sales transactions</p>
          </div>
          <button
            type="button"
            onClick={() => setTaxEnabled(v => !v)}
            className={[
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
              taxEnabled ? 'bg-primary' : 'bg-muted-foreground/30',
            ].join(' ')}
            role="switch"
            aria-checked={taxEnabled}
          >
            <span
              className={[
                'pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200',
                taxEnabled ? 'translate-x-5' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
        </div>

        {/* Rate input */}
        {taxEnabled && (
          <div className="space-y-1.5">
            <label htmlFor="taxRate" className="text-sm font-medium text-foreground">
              Tax Rate (%)
            </label>
            <Input
              id="taxRate"
              type="number"
              min="0"
              max="100"
              step="0.5"
              placeholder="10"
              value={taxRate}
              onChange={e => setTaxRate(e.target.value)}
              className="h-10 max-w-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              {taxRate ? `${taxRate}% will be added to each sale` : 'No tax applied'}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5">
          <Save className="size-3.5" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

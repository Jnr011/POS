import { useState, useEffect } from 'react';
import { StoreRepository } from '../../db/repository';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Save, Store, MapPin, Phone, Mail, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const FIELDS = [
  { key: 'storeName', label: 'Store Name', placeholder: 'e.g. City Pharmacy', icon: Store },
  { key: 'storeAddress', label: 'Address', placeholder: '123 Main Street', icon: MapPin },
  { key: 'storePhone', label: 'Phone', placeholder: '555-0100', icon: Phone },
  { key: 'storeEmail', label: 'Email', placeholder: 'info@pharmacy.com', icon: Mail },
] as const;

export function StoreSettings() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    StoreRepository.getAll().then(all => {
      setValues(all);
      setLoading(false);
    });
  }, []);

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const keysToSave = [...FIELDS.map(f => f.key), 'allowReturns'];
      await Promise.all(
        keysToSave.map(k => StoreRepository.set(k, values[k] || ''))
      );
      toast.success('Store settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-20 rounded bg-muted animate-pulse" />
          <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
            <Store className="size-[18px] text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Store Information</h2>
            <p className="text-xs text-muted-foreground">Your pharmacy's details shown on receipts and reports.</p>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="px-6 py-5 space-y-4">
        {FIELDS.map(f => {
          const Icon = f.icon;
          return (
            <div key={f.key} className="space-y-1.5">
              <label htmlFor={f.key} className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Icon className="size-3.5 text-muted-foreground" />
                {f.label}
              </label>
              <Input
                id={f.key}
                placeholder={f.placeholder}
                value={values[f.key] || ''}
                onChange={e => handleChange(f.key, e.target.value)}
                className="h-10"
              />
            </div>
          );
        })}
      </div>

      {/* Return Policy */}
      <div className="px-6 py-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-warning/10">
              <RotateCcw className="size-[18px] text-warning" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">Return Policy</h3>
              <p className="text-xs text-muted-foreground">Allow customers to return products</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={values.allowReturns !== 'false'}
              onChange={e => setValues(prev => ({ ...prev, allowReturns: e.target.checked ? 'true' : 'false' }))}
            />
            <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-ring after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-background after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
          </label>
        </div>
        {values.allowReturns === 'false' && (
          <p className="text-xs text-destructive/70 mt-2">
            When disabled, all return buttons show a notice that returns are not available.
          </p>
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

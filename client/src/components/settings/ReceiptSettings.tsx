import { useState, useEffect } from 'react';
import { StoreRepository } from '../../db/repository';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Save, Receipt } from 'lucide-react';
import { toast } from 'sonner';

export function ReceiptSettings() {
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
      await Promise.all([
        StoreRepository.set('receiptHeader', values.receiptHeader || ''),
        StoreRepository.set('receiptFooter', values.receiptFooter || ''),
      ]);
      toast.success('Receipt settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          <div className="h-20 w-full rounded-md bg-muted animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          <div className="h-20 w-full rounded-md bg-muted animate-pulse" />
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
            <Receipt className="size-[18px] text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Receipt Template</h2>
            <p className="text-xs text-muted-foreground">Customize the text printed on receipts.</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5 space-y-5">
        {/* Header text */}
        <div className="space-y-1.5">
          <label htmlFor="receiptHeader" className="text-sm font-medium text-foreground">
            Receipt Header
          </label>
          <Textarea
            id="receiptHeader"
            placeholder="Custom text at the top of receipts"
            value={values.receiptHeader || ''}
            onChange={e => handleChange('receiptHeader', e.target.value)}
            rows={3}
          />
        </div>

        {/* Footer text */}
        <div className="space-y-1.5">
          <label htmlFor="receiptFooter" className="text-sm font-medium text-foreground">
            Receipt Footer
          </label>
          <Textarea
            id="receiptFooter"
            placeholder="Thank you message or return policy"
            value={values.receiptFooter || ''}
            onChange={e => handleChange('receiptFooter', e.target.value)}
            rows={3}
          />
        </div>

        {/* Preview */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Preview</p>
          <div className="rounded-md bg-white border border-border p-5 text-center font-mono text-xs text-black space-y-1 max-w-[260px] mx-auto shadow-sm">
            <p className="font-bold text-[13px]">{values.storeName || 'Store Name'}</p>
            <p className="text-[10px] text-gray-500">{values.storeAddress || 'Address'}</p>
            <p className="text-[10px] text-gray-500">Tel: {values.storePhone || 'Phone'}</p>
            {values.receiptHeader && (
              <p className="pt-2 border-t border-dashed text-[10px] text-gray-700 whitespace-pre-wrap">{values.receiptHeader}</p>
            )}
            <div className="pt-2 border-t border-dashed">
              <p className="text-[10px] text-gray-400 italic">sale items appear here</p>
            </div>
            {values.receiptFooter && (
              <p className="pt-2 border-t border-dashed text-[10px] text-gray-700 whitespace-pre-wrap">{values.receiptFooter}</p>
            )}
          </div>
        </div>
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

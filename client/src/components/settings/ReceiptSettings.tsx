import { useState, useEffect, useMemo } from 'react';
import { StoreRepository } from '../../db/repository';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { buildReceiptElements, type ReceiptStoreInfo } from '../../lib/receiptBuilder';
import { ReceiptPreview } from '../ReceiptPreview';
import type { Sale, CartItem } from '../../types';
import { Save, Receipt } from 'lucide-react';
import { toast } from 'sonner';

const DUMMY_ITEMS: CartItem[] = [
  { id: 1, name: 'Paracetamol 500mg', category: 'Pain Relief', price: 5.00, stock_quantity: 100, quantity: 2 },
  { id: 2, name: 'Amoxicillin 250mg', category: 'Antibiotics', price: 12.50, stock_quantity: 50, quantity: 1 },
  { id: 3, name: 'Vitamin C 1000mg', category: 'Supplements', price: 8.00, stock_quantity: 75, quantity: 3 },
];

function buildDummySale(storeValues: Record<string, string>): Sale {
  const total = DUMMY_ITEMS.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = parseFloat((total * 0.03).toFixed(2));
  return {
    id: 42,
    user_id: 1,
    items: DUMMY_ITEMS,
    total_price: total,
    tax,
    grand_total: total + tax,
    payment_method: 'cash',
    amount_tendered: 60,
    change_due: parseFloat((60 - total - tax).toFixed(2)),
    date: new Date().toISOString(),
    updatedAt: Date.now(),
    syncStatus: 'synced',
    status: 'completed',
  };
}

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

  const previewElements = useMemo(() => {
    const storeInfo: ReceiptStoreInfo = {
      storeName: values.storeName || 'Pharmacy POS',
      storeAddress: values.storeAddress || '123 Main Street',
      storePhone: values.storePhone || '024 000 0000',
      receiptHeader: values.receiptHeader || '',
      receiptFooter: values.receiptFooter || 'Thank you for your purchase!',
    };
    const sale = buildDummySale(values);
    return buildReceiptElements(sale, storeInfo);
  }, [values]);

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

        {/* Preview — uses receipt builder */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Live Preview</p>
          <div className="max-w-[300px] mx-auto rounded-md border border-border overflow-hidden shadow-sm">
            <ReceiptPreview elements={previewElements} />
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

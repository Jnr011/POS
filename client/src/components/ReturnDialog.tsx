import { useState, useEffect } from 'react';
import { ReturnRepository } from '../db/repository';
import { useAuthStore } from '../store/authStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { formatCurrency } from '../lib/currency';
import { RotateCcw, Ban, CheckCircle2, AlertTriangle, Package, Loader2 } from 'lucide-react';
import type { Sale, CartItem } from '../types';

function parseItems(items: Sale['items']): CartItem[] {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  try {
    const parsed = JSON.parse(items as unknown as string);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface ReturnDialogProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ReturnDialog({ sale, open, onOpenChange }: ReturnDialogProps) {
  const user = useAuthStore(s => s.user);
  const [step, setStep] = useState<'check' | 'blocked' | 'select' | 'confirm' | 'done'>('check');
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setStep('check');
      setQuantities({});
      setReasons({});
      ReturnRepository.isReturnsAllowed().then(allowed => {
        setStep(allowed ? 'select' : 'blocked');
      });
    }
  }, [open]);

  if (!sale || !user) return null;

  const items = parseItems(sale.items);

  const selectedItems = items.filter(i => (quantities[i.id] || 0) > 0);
  const refundTotal = selectedItems.reduce((sum, i) => sum + i.price * (quantities[i.id] || 0), 0);
  const hasSelection = selectedItems.length > 0;

  const maxQty = (item: CartItem) => Math.min(item.quantity, item.stock_quantity ?? 999);

  const handleConfirm = async () => {
    if (!hasSelection) return;
    setSaving(true);
    try {
      await ReturnRepository.processReturn(
        sale.id,
        user.id,
        selectedItems.map(i => ({
          productId: i.id,
          productName: i.name,
          quantity: quantities[i.id] || 0,
          price: i.price,
          reason: reasons[i.id] || '',
        })),
      );
      setStep('done');
      toast.success('Return processed successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to process return');
    } finally {
      setSaving(false);
    }
  };

  // ── Blocked (returns not enabled) ──
  if (step === 'blocked') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Ban className="size-5 text-destructive" />
              </div>
            </div>
            <DialogTitle>Returns Not Available</DialogTitle>
            <DialogDescription>
              Products are not refundable and cannot be returned at this time.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <AlertTriangle className="size-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground max-w-xs">
              The store administrator has disabled product returns. This policy applies to all transactions.
            </p>
          </div>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Done ──
  if (step === 'done') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="size-10 rounded-full bg-accent/10 flex items-center justify-center">
                <CheckCircle2 className="size-5 text-accent" />
              </div>
            </div>
            <DialogTitle>Return Complete</DialogTitle>
            <DialogDescription>
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} returned — {formatCurrency(refundTotal)} refunded.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            {selectedItems.map(i => (
              <div key={i.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{i.name} × {quantities[i.id]}</span>
                <span className="tabular-nums font-medium">{formatCurrency(i.price * (quantities[i.id] || 0))}</span>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Select items ──
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="size-10 rounded-full bg-warning/10 flex items-center justify-center">
              <RotateCcw className="size-5 text-warning" />
            </div>
          </div>
          <DialogTitle>Process Return</DialogTitle>
          <DialogDescription>
            Sale #{String(sale.id).padStart(4, '0')} · {formatCurrency(sale.grand_total)} · {new Date(sale.date).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        {step === 'select' && (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6 max-h-[50vh]">
              <div className="space-y-3 py-2">
                {items.map(item => {
                  const qty = quantities[item.id] || 0;
                  const max = maxQty(item);
                  return (
                    <div key={item.id} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(item.price)} each · {item.quantity} sold
                          </p>
                        </div>
                        <Badge variant={qty > 0 ? 'default' : 'secondary'} className="text-[10px]">
                          {qty > 0 ? `${qty} to return` : 'No return'}
                        </Badge>
                      </div>
                      {qty > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground shrink-0">Qty:</label>
                            <Input
                              type="number"
                              min={1}
                              max={max}
                              value={qty}
                              onChange={e => {
                                const v = parseInt(e.target.value, 10);
                                setQuantities(prev => ({
                                  ...prev,
                                  [item.id]: isNaN(v) || v < 1 ? 0 : Math.min(v, max),
                                }));
                              }}
                              className="h-7 w-16 text-xs tabular-nums"
                            />
                            <span className="text-[10px] text-muted-foreground">max {max}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground shrink-0">Reason:</label>
                            <Input
                              placeholder="e.g. Damaged, wrong item"
                              value={reasons[item.id] || ''}
                              onChange={e => setReasons(prev => ({ ...prev, [item.id]: e.target.value }))}
                              className="h-7 text-xs"
                            />
                          </div>
                        </div>
                      )}
                      {qty === 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setQuantities(prev => ({ ...prev, [item.id]: 1 }))}
                        >
                          <RotateCcw className="size-3" /> Mark for return
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <Separator className="my-1" />

            <div className="space-y-3 pt-1">
              {hasSelection && (
                <div className="flex justify-between text-sm font-medium">
                  <span>Refund total</span>
                  <span className="tabular-nums">{formatCurrency(refundTotal)}</span>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={() => setStep('confirm')}
                  disabled={!hasSelection}
                >
                  <RotateCcw className="size-4" /> Return ({selectedItems.length})
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="space-y-2 py-2">
              {selectedItems.map(i => (
                <div key={i.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{i.name} × {quantities[i.id]}</span>
                  <span className="tabular-nums font-medium">{formatCurrency(i.price * (quantities[i.id] || 0))}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between text-sm font-semibold">
                <span>Refund total</span>
                <span className="tabular-nums">{formatCurrency(refundTotal)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('select')}>
                Back
              </Button>
              <Button className="flex-1 gap-2" onClick={handleConfirm} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                {saving ? 'Processing...' : 'Confirm Return'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { ReturnDialog };

import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { User, Banknote, CreditCard, Smartphone, Receipt } from 'lucide-react';
import type { Sale, User as UserType, CartItem } from '../types';
import { formatCurrency } from '../lib/currency';
import { cn } from '../lib/utils';

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

const METHOD_ICONS: Record<string, typeof Banknote> = {
  cash: Banknote,
  card: CreditCard,
  mobile_money: Smartphone,
};

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  mobile_money: 'Mobile Money',
};

const SYNC_STYLES: Record<string, string> = {
  synced: 'bg-accent/10 text-accent',
  pending: 'bg-warning/10 text-warning',
  conflict: 'bg-destructive/10 text-destructive',
};

interface SaleDetailDialogProps {
  sale: Sale | null;
  users: UserType[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SaleDetailDialog({ sale, users, open, onOpenChange }: SaleDetailDialogProps) {
  if (!sale) return null;

  const seller = users.find(u => u.id === sale.user_id);
  const MethodIcon = METHOD_ICONS[sale.payment_method] || Banknote;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="size-4 text-primary" />
              Sale #{String(sale.id).padStart(4, '0')}
            </DialogTitle>
            <Badge
              variant="outline"
              className={cn('text-[10px] font-medium border-0 px-1.5 py-0', SYNC_STYLES[sale.syncStatus])}
            >
              {sale.syncStatus}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {sale.date ? format(new Date(sale.date), 'MMM d, yyyy · h:mm a') : '—'}
          </p>
        </DialogHeader>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="size-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{seller?.name || `User #${sale.user_id}`}</p>
            <p className="text-xs text-muted-foreground">{seller?.email || 'Unknown attendant'}</p>
          </div>
          <Badge variant="outline" className="text-xs gap-1 border-0">
            <MethodIcon className="size-3" />
            {METHOD_LABELS[sale.payment_method] || sale.payment_method}
          </Badge>
        </div>

        <Separator />

        <ScrollArea className="flex-1 max-h-[300px]">
          <div className="space-y-2 pr-2">
            {parseItems(sale.items).map((item, i) => {
              const lineTotal = (item.price || 0) * (item.quantity || 0);
              return (
                <div key={i} className="flex items-start justify-between gap-4 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium tabular-nums shrink-0">
                    {formatCurrency(lineTotal)}
                  </p>
                </div>
              );
            })}
            {parseItems(sale.items).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No item details available</p>
            )}
          </div>
        </ScrollArea>

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(sale.total_price)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tax</span>
            <span className="tabular-nums">{formatCurrency(sale.tax)}</span>
          </div>
          <div className="flex justify-between font-semibold text-foreground text-base">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(sale.grand_total)}</span>
          </div>
          <Separator className="my-1" />
          <div className="flex justify-between text-muted-foreground">
            <span>Amount Tendered</span>
            <span className="tabular-nums">{formatCurrency(sale.amount_tendered)}</span>
          </div>
          {sale.change_due > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Change Due</span>
              <span className="tabular-nums">{formatCurrency(sale.change_due)}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { SaleDetailDialog };

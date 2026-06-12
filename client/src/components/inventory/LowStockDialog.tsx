import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import type { Product } from '../../types';

interface LowStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
}

function LowStockDialog({ open, onOpenChange, products }: LowStockDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" /> Low stock
          </DialogTitle>
          <DialogDescription>
            {products.length} product{products.length !== 1 ? 's' : ''} at or below minimum stock.
          </DialogDescription>
        </DialogHeader>
        {products.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">All products are adequately stocked.</p>
        ) : (
          <div className="max-h-80 space-y-1.5 overflow-y-auto">
            {products.map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.category}</p>
                </div>
                <p className="tabular-nums">
                  <span className={p.stock_quantity === 0 ? 'font-bold text-destructive' : 'text-destructive'}>
                    {p.stock_quantity}
                  </span>
                  <span className="text-muted-foreground"> / {p.min_stock ?? 10}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { LowStockDialog };
export type { LowStockDialogProps };

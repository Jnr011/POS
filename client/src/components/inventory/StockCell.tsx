import { Plus, Minus } from 'lucide-react';
import { Button } from '../ui/button';
import type { Product } from '../../types';

interface StockCellProps {
  product: Product;
  pendingQty?: number;
  onDelta: (delta: number) => void;
}

function StockCell({ product, pendingQty, onDelta }: StockCellProps) {
  const display = pendingQty ?? product.stock_quantity;
  const isDirty = pendingQty !== undefined && pendingQty !== product.stock_quantity;
  const low = display <= (product.min_stock ?? 10);

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost" size="sm"
        className="size-6 p-0"
        onClick={() => onDelta(-1)}
        disabled={display <= 0}
      >
        <Minus className="size-3" />
      </Button>
      <span className={[
        'min-w-[2rem] text-center text-sm font-mono',
        isDirty && 'text-primary font-semibold',
        !isDirty && display === 0 && 'text-destructive font-bold',
        !isDirty && low && 'text-destructive',
      ].join(' ')}>
        {display}
      </span>
      <Button
        variant="ghost" size="sm"
        className="size-6 p-0"
        onClick={() => onDelta(1)}
      >
        <Plus className="size-3" />
      </Button>
    </div>
  );
}

export { StockCell };
export type { StockCellProps };

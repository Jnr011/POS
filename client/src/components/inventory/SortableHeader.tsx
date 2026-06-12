import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { TableHead } from '../ui/table';

type SortKey = 'name' | 'price' | 'stock_quantity' | 'expiry_date';
type SortDir = 'asc' | 'desc';

interface SortableHeaderProps {
  col: SortKey;
  label: string;
  current: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}

function SortableHeader({ col, label, current, dir, onSort }: SortableHeaderProps) {
  const active = current === col;
  const Icon = active ? (dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <TableHead
      className="cursor-pointer select-none"
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <Icon className={['size-3', active ? 'text-primary' : 'opacity-40'].join(' ')} />
      </span>
    </TableHead>
  );
}

export { SortableHeader };
export type { SortableHeaderProps, SortKey, SortDir };

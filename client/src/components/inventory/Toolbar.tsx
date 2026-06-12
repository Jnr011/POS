import { Search, X, Trash2, Save, Undo2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';

type StatFilter = 'all' | 'low_stock' | 'expiring_soon' | 'out_of_stock';

interface ToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  categoryFilter: string;
  onCategoryChange: (v: string) => void;
  categories: string[];
  statFilter: StatFilter;
  onStatFilterChange: (v: StatFilter) => void;
  selectedCount: number;
  pendingCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDeleteSelected: () => void;
  onSavePending: () => void;
  onDiscardPending: () => void;
}

function Toolbar({
  search, onSearchChange,
  categoryFilter, onCategoryChange, categories,
  statFilter, onStatFilterChange,
  selectedCount, pendingCount,
  onSelectAll, onDeselectAll, onDeleteSelected,
  onSavePending, onDiscardPending,
}: ToolbarProps) {
  const hasFilters = search || categoryFilter !== 'all' || statFilter !== 'all';

  return (
    <div className="space-y-3">
      {/* Search + filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search products... (press /)"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={categoryFilter} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => { onSearchChange(''); onCategoryChange('all'); onStatFilterChange('all'); }}>
            <X className="size-3.5" /> Clear
          </Button>
        )}
      </div>

      {/* Active stat filter chip */}
      {statFilter !== 'all' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtered:</span>
          <button
            onClick={() => onStatFilterChange('all')}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium transition-colors hover:bg-primary/20"
          >
            {statFilter === 'low_stock' && 'Low stock'}
            {statFilter === 'expiring_soon' && 'Expiring soon'}
            {statFilter === 'out_of_stock' && 'Out of stock'}
            <X className="size-3" />
          </button>
        </div>
      )}

      {/* Pending stock bar */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/[0.04] px-4 py-2.5 text-sm">
          <span className="font-medium text-foreground">{pendingCount} stock change{pendingCount !== 1 ? 's' : ''}</span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={onDiscardPending}>
              <Undo2 className="size-3.5" /> Discard
            </Button>
            <Button size="sm" className="gap-1.5" onClick={onSavePending}>
              <Save className="size-3.5" /> Save changes
            </Button>
          </div>
        </div>
      )}

      {/* Selection bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/[0.04] px-4 py-2.5 text-sm">
          <span className="font-medium text-foreground">{selectedCount} selected</span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onDeselectAll}>
              Deselect all
            </Button>
            <Button variant="destructive" size="sm" className="gap-1.5" onClick={onDeleteSelected}>
              <Trash2 className="size-3.5" /> Delete selected
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export { Toolbar };
export type { ToolbarProps, StatFilter };

import { useState, useEffect, useMemo } from 'react';
import { db } from '../db';
import { UserRepository } from '../db/repository';
import { PageHeader } from '../components/PageHeader';
import { SaleDetailDialog } from '../components/SaleDetailDialog';
import { ReturnDialog } from '../components/ReturnDialog';
import { PrinterSelectDialog } from '../components/PrinterSelectDialog';
import { EmptyState } from '../components/ui/empty-state';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ScrollArea } from '../components/ui/scroll-area';
import { Search, Receipt, Banknote, CreditCard, Smartphone, ChevronDown, ChevronRight, User, RotateCcw, Printer, Eye } from 'lucide-react';
import type { Sale, User as UserType, CartItem } from '../types';
import { formatCurrency } from '../lib/currency';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { usePrinter } from '../hooks/usePrinter';
import { useStoreInfo } from '../hooks/useStoreInfo';
import { ReceiptPreview } from '../components/ReceiptPreview';
import { buildReceiptElements } from '../lib/receiptBuilder';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

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

function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [returnSale, setReturnSale] = useState<Sale | null>(null);
  const printer = usePrinter();
  const storeInfo = useStoreInfo();
  const [previewElements, setPreviewElements] = useState<ReturnType<typeof buildReceiptElements> | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [allSales, allUsers] = await Promise.all([
          db.sales.orderBy('date').reverse().toArray(),
          UserRepository.getAll(),
        ]);
        if (!cancelled) {
          setSales(allSales);
          setUsers(allUsers);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const getUserName = (userId: number) => users.find(u => u.id === userId)?.name || `User #${userId}`;

  const filtered = useMemo(() => {
    let result = sales;

    if (methodFilter !== 'all') {
      result = result.filter(s => s.payment_method === methodFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s => {
        const idMatch = `#${String(s.id).padStart(4, '0')}`.toLowerCase().includes(q);
        const nameMatch = getUserName(s.user_id).toLowerCase().includes(q);
        const itemMatch = parseItems(s.items).some(item => item.name?.toLowerCase().includes(q));
        return idMatch || nameMatch || itemMatch;
      });
    }

    return result;
  }, [sales, users, search, methodFilter]);

  const toggleExpand = (id: number) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-64" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={<Receipt className="size-4 text-primary" />}
        title="Sales History"
        description={`${filtered.length} sale${filtered.length !== 1 ? 's' : ''} recorded`}
      />

      <div data-tour="sales-search" className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by receipt #, attendant, or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {[
            { value: 'all', label: 'All' },
            { value: 'cash', label: 'Cash' },
            { value: 'card', label: 'Card' },
            { value: 'mobile_money', label: 'Mobile' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setMethodFilter(opt.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                methodFilter === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Receipt className="size-5 text-muted-foreground/50" />}
          title="No sales found"
          description={search || methodFilter !== 'all' ? 'Try adjusting your filters' : 'Sales will appear here as they are recorded'}
        />
      ) : (
        <div data-tour="sales-table" className="rounded-xl border bg-card overflow-hidden">
          <ScrollArea className="max-h-[calc(100vh-280px)]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Attendant</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(sale => {
                  const isExpanded = expandedId === sale.id;
                  const itemCount = parseItems(sale.items).reduce((sum, item) => sum + (item.quantity || 0), 0);
                  const MethodIcon = METHOD_ICONS[sale.payment_method] || Banknote;

                  return (
                    <>
                      <TableRow
                        key={sale.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleExpand(sale.id)}
                      >
                        <TableCell className="w-8 pr-0">
                          {isExpanded
                            ? <ChevronDown className="size-4 text-muted-foreground" />
                            : <ChevronRight className="size-4 text-muted-foreground" />
                          }
                        </TableCell>
                        <TableCell className="font-medium tabular-nums text-sm">
                          #{String(sale.id).padStart(4, '0')}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {sale.date ? format(new Date(sale.date), 'MMM d, h:mm a') : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">
                              {getUserName(sale.user_id).split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <span className="text-sm">{getUserName(sale.user_id)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">{itemCount}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums text-sm">
                          {formatCurrency(sale.grand_total)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-medium border-0 gap-1 px-1.5 py-0">
                            <MethodIcon className="size-3" />
                            {METHOD_LABELS[sale.payment_method] || sale.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] font-medium border-0 px-1.5 py-0', SYNC_STYLES[sale.syncStatus])}
                          >
                            {sale.syncStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${sale.id}-detail`} className="hover:bg-transparent">
                          <TableCell colSpan={8} className="p-0 px-4 pb-4">
                            <div className="rounded-lg bg-muted/30 p-3 space-y-2">
                              {parseItems(sale.items).map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">{item.quantity}×</span>
                                    <span>{item.name || 'Unknown'}</span>
                                  </div>
                                  <span className="tabular-nums font-medium">{formatCurrency(item.price * item.quantity)}</span>
                                </div>
                              ))}
                              {parseItems(sale.items).length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-2">No item details</p>
                              )}
                              <div className="border-t border-border/50 pt-2 mt-2 flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="tabular-nums">{formatCurrency(sale.total_price)}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Tax</span>
                                <span className="tabular-nums">{formatCurrency(sale.tax)}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm font-semibold">
                                <span>Total</span>
                                <span className="tabular-nums">{formatCurrency(sale.grand_total)}</span>
                              </div>
                              {sale.amount_tendered > 0 && (
                                <>
                                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>Tendered</span>
                                    <span className="tabular-nums">{formatCurrency(sale.amount_tendered)}</span>
                                  </div>
                                  {sale.change_due > 0 && (
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                      <span>Change</span>
                                      <span className="tabular-nums">{formatCurrency(sale.change_due)}</span>
                                    </div>
                                  )}
                                </>
                              )}
                              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedSale(sale); }}
                                  className="text-xs font-medium text-primary hover:underline underline-offset-4"
                                >
                                  View full details →
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setPreviewElements(buildReceiptElements(sale, storeInfo)); }}
                                  className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 underline-offset-4 hover:underline"
                                >
                                  <Eye className="size-3" /> Preview
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); printer.connectAndPrint(sale, storeInfo); }}
                                  className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 underline-offset-4 hover:underline"
                                >
                                  <Printer className="size-3" /> Print
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setReturnSale(sale); }}
                                  className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 underline-offset-4 hover:underline"
                                >
                                  <RotateCcw className="size-3" /> Return
                                </button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}

      <SaleDetailDialog
        sale={selectedSale}
        users={users}
        open={!!selectedSale}
        onOpenChange={(open) => { if (!open) setSelectedSale(null); }}
      />
      <ReturnDialog
        sale={returnSale}
        open={!!returnSale}
        onOpenChange={(open) => { if (!open) setReturnSale(null); }}
      />

      {/* Receipt preview dialog */}
      <Dialog open={!!previewElements} onOpenChange={() => setPreviewElements(null)}>
        <DialogContent  className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Receipt Preview</DialogTitle>
          </DialogHeader>
          {previewElements && <ReceiptPreview elements={previewElements} />}
        </DialogContent>
      </Dialog>

      {printer.selectionCandidates && (
        <PrinterSelectDialog
          candidates={printer.selectionCandidates}
          onSelect={n => { printer.connect(n); }}
          onClose={() => printer.setSelectionCandidates(null)}
        />
      )}
    </div>
  );
}

export default SalesHistory;

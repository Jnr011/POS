import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Package, Upload, Plus, Trash2, Pencil, AlertTriangle, Clock, PackageX } from 'lucide-react';

import { useProducts } from '../hooks/useProducts';
import { useAuthStore } from '../store/authStore';
import { CategoryRepository } from '../db/repository';
import type { Product } from '../types';
import { appendStockLog, THIRTY_DAYS, rowClass } from '../lib/inventory-utils';
import { formatCurrency } from '../lib/currency';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Pagination } from '../components/ui/pagination';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';

import {
  SortableHeader,
  ExpiryCell,
  StockCell,
  Toolbar,
  ConfirmDialog,
  ProductFormDialog,
  LowStockDialog,
  InventoryAlerts,
  CategoryManager,
  CsvImportDialog,
} from '../components/inventory';
import type { SortKey, SortDir, ProductFormData, StatFilter } from '../components/inventory';

const PAGE_SIZE = 15;
type PendingStock = Map<number, { original: number; newQty: number }>;

// ─── Main component ───────────────────────────────────────────────────────────

function Inventory() {
  const { products, loading, addProduct, updateProduct, deleteProduct, refetch } = useProducts();
  const user = useAuthStore(s => s.user);
  const readOnly = user?.role === 'sales';
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statFilter, setStatFilter] = useState<StatFilter>('all');
  const [page, setPage] = useState(1);

  // ── Product form ────────────────────────────────────────────────────────────
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '', category: '', price: '', stock_quantity: '',
    min_stock: '', supplier: '', expiry_date: '',
  });

  // ── Selection & delete ──────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  // ── Categories ──────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<string[]>([]);

  // ── Pending stock ───────────────────────────────────────────────────────────
  const [pendingStock, setPendingStock] = useState<PendingStock>(new Map());

  // ── Modals ──────────────────────────────────────────────────────────────────
  const [showLowStock, setShowLowStock] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);

  // ── Keyboard shortcut ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const loadCategories = useCallback(async () => {
    setCategories(await CategoryRepository.getAll());
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  // ── Derived: stats ──────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const now = Date.now();
    return {
      total: products.length,
      lowStock: products.filter(p => p.stock_quantity <= (p.min_stock ?? 10) && p.stock_quantity > 0).length,
      expiringSoon: products.filter(p => {
        if (!p.expiry_date) return false;
        const d = new Date(p.expiry_date).getTime();
        return d > now && d - now <= THIRTY_DAYS;
      }).length,
      outOfStock: products.filter(p => p.stock_quantity === 0).length,
    };
  }, [products]);

  const lowStockProducts = useMemo(
    () => products.filter(p => p.stock_quantity <= (p.min_stock ?? 10)),
    [products],
  );

  // ── Derived: filtered + sorted + paginated ──────────────────────────────────

  const filteredProducts = useMemo(() => {
    const now = Date.now();
    let list = [...products];

    // Stat filter
    if (statFilter === 'low_stock') {
      list = list.filter(p => p.stock_quantity <= (p.min_stock ?? 10) && p.stock_quantity > 0);
    } else if (statFilter === 'expiring_soon') {
      list = list.filter(p => {
        if (!p.expiry_date) return false;
        const d = new Date(p.expiry_date).getTime();
        return d > now && d - now <= THIRTY_DAYS;
      });
    } else if (statFilter === 'out_of_stock') {
      list = list.filter(p => p.stock_quantity === 0);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      list = list.filter(p => p.category === categoryFilter);
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'price') cmp = a.price - b.price;
      else if (sortKey === 'stock_quantity') cmp = a.stock_quantity - b.stock_quantity;
      else if (sortKey === 'expiry_date') {
        const da = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity;
        const db = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity;
        cmp = da - db;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [products, statFilter, categoryFilter, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedProducts = filteredProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const allSelected = paginatedProducts.length > 0 && paginatedProducts.every(p => selectedIds.has(p.id));

  // Reset page on any filter change
  useEffect(() => { setPage(1); }, [search, categoryFilter, statFilter, sortKey, sortDir]);

  // ── Handlers: sort ──────────────────────────────────────────────────────────

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  // ── Handlers: stat card clicks ──────────────────────────────────────────────

  const handleStatClick = (filter: StatFilter) => {
    setStatFilter(prev => prev === filter ? 'all' : filter);
  };

  // ── Handlers: product form ──────────────────────────────────────────────────

  const resetForm = () => {
    setFormData({ name: '', category: '', price: '', stock_quantity: '', min_stock: '', supplier: '', expiry_date: '' });
    setEditingId(null);
    setShowFormDialog(false);
  };

  const openEditDialog = (p: Product) => {
    setFormData({
      name: p.name, category: p.category,
      price: String(p.price), stock_quantity: String(p.stock_quantity),
      min_stock: p.min_stock != null ? String(p.min_stock) : '',
      supplier: p.supplier || '', expiry_date: p.expiry_date || '',
    });
    setEditingId(p.id);
    setShowFormDialog(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name, category: formData.category,
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity, 10),
      min_stock: formData.min_stock ? parseInt(formData.min_stock, 10) : undefined,
      supplier: formData.supplier || undefined,
      expiry_date: formData.expiry_date || null,
    };
    try {
      if (editingId) {
        await updateProduct(editingId, data);
        toast.success('Product updated');
      } else {
        await addProduct(data as Omit<Product, 'id'>);
        toast.success('Product added');
      }
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Error saving product');
    }
  };

  // ── Handlers: delete ────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      toast.success('Product deleted');
    } catch (err: any) { toast.error(err.message || 'Error deleting'); }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedIds) await deleteProduct(id);
      const n = selectedIds.size;
      setSelectedIds(new Set());
      setShowBulkDelete(false);
      toast.success(`Deleted ${n} product${n !== 1 ? 's' : ''}`);
    } catch (err: any) { toast.error(err.message || 'Error deleting products'); }
  };

  // ── Handlers: stock changes ─────────────────────────────────────────────────

  const handleStockDelta = (product: Product, delta: number) => {
    setPendingStock(prev => {
      const next = new Map(prev);
      const existing = next.get(product.id);
      const current = existing?.newQty ?? product.stock_quantity;
      const updated = current + delta;
      if (updated < 0) return next;
      if (updated === product.stock_quantity) next.delete(product.id);
      else next.set(product.id, { original: product.stock_quantity, newQty: updated });
      return next;
    });
  };

  const handleSaveStock = async () => {
    const entries = Array.from(pendingStock.entries());
    if (!entries.length) return;
    let saved = 0;
    for (const [id, { original, newQty }] of entries) {
      try {
        await updateProduct(id, { stock_quantity: newQty });
        const product = products.find(p => p.id === id);
        appendStockLog({
          productId: id,
          productName: product?.name ?? `Product #${id}`,
          previousQty: original,
          newQty,
          delta: newQty - original,
          reason: 'Bulk stock update',
          timestamp: Date.now(),
        });
        saved++;
      } catch {
        toast.error(`Failed to update product #${id}`);
      }
    }
    setPendingStock(new Map());
    toast.success(`Updated stock for ${saved} product${saved !== 1 ? 's' : ''}`);
  };

  const handleDiscardStock = () => {
    setPendingStock(new Map());
    toast.info('Stock changes discarded');
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────

  if (loading) return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-52" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">

      {/* Page header */}
      <PageHeader
        icon={<Package className="size-4 text-primary" />}
        title="Inventory"
        description="Products, stock levels, and categories"
        actions={!readOnly && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowCsvImport(true)}>
              <Upload className="size-4" /> Import CSV
            </Button>
            <Button size="sm" className="gap-2" onClick={() => { resetForm(); setShowFormDialog(true); }}>
              <Plus className="size-4" /> Add Product
            </Button>
          </div>
        )}
      />

      {/* Stat cards */}
      <div data-tour="inventory-stats" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          icon={<AlertTriangle className="size-4 text-destructive" />}
          label="Low stock"
          value={stats.lowStock}
          accent={stats.lowStock > 0 ? 'bg-destructive' : undefined}
          onClick={() => handleStatClick('low_stock')}
        />
        <StatCard
          icon={<Clock className="size-4 text-amber-600" />}
          label="Expiring soon"
          value={stats.expiringSoon}
          accent={stats.expiringSoon > 0 ? 'bg-amber-500' : undefined}
          onClick={() => handleStatClick('expiring_soon')}
        />
        <StatCard
          icon={<PackageX className="size-4 text-destructive" />}
          label="Out of stock"
          value={stats.outOfStock}
          accent={stats.outOfStock > 0 ? 'bg-destructive' : undefined}
          onClick={() => handleStatClick('out_of_stock')}
        />
        <StatCard
          icon={<Package className="size-4 text-primary" />}
          label="Total products"
          value={stats.total}
          accent="bg-primary"
          onClick={() => setStatFilter('all')}
        />
      </div>

      {/* Alerts */}
      <InventoryAlerts products={products} />

      {/* Unified toolbar */}
      <div data-tour="inventory-toolbar">
        <Toolbar
          search={search}
          onSearchChange={setSearch}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          categories={categories}
          statFilter={statFilter}
          onStatFilterChange={setStatFilter}
          selectedCount={selectedIds.size}
          pendingCount={pendingStock.size}
          onSelectAll={() => setSelectedIds(new Set(paginatedProducts.map(p => p.id)))}
          onDeselectAll={() => setSelectedIds(new Set())}
          onDeleteSelected={() => setShowBulkDelete(true)}
          onSavePending={handleSaveStock}
          onDiscardPending={handleDiscardStock}
        />
      </div>

      {/* Categories (collapsible accordion, above table) */}
      <CategoryManager categories={categories} onCategoriesChange={setCategories} readOnly={readOnly} />

      {/* Products table */}
      <Card data-tour="inventory-table">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground">
            Products
            <span className="ml-1.5 font-normal text-muted-foreground">({filteredProducts.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Package className="size-10 text-muted-foreground/30" />
              <div>
                <p className="font-medium text-foreground">No products yet</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {readOnly ? 'There are no products in the inventory.' : 'Add your first product or import from CSV.'}
                </p>
              </div>
              {!readOnly && (
                <div className="flex gap-2 mt-1">
                  <Button size="sm" className="gap-2" onClick={() => { resetForm(); setShowFormDialog(true); }}>
                    <Plus className="size-4" /> Add product
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowCsvImport(true)}>
                    <Upload className="size-4" /> Import CSV
                  </Button>
                </div>
              )}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Package className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No products match the current filters</p>
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setCategoryFilter('all'); setStatFilter('all'); }}>
                Clear all filters
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {!readOnly && (
                      <TableHead className="w-10 pl-4">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={() => allSelected
                            ? setSelectedIds(new Set())
                            : setSelectedIds(new Set(paginatedProducts.map(p => p.id)))}
                          className="size-4 cursor-pointer accent-primary rounded"
                        />
                      </TableHead>
                    )}
                    <SortableHeader col="name" label="Name" current={sortKey} dir={sortDir} onSort={handleSort} />
                    <TableHead>Category</TableHead>
                    <SortableHeader col="price" label="Price" current={sortKey} dir={sortDir} onSort={handleSort} />
                    <SortableHeader col="stock_quantity" label="Stock" current={sortKey} dir={sortDir} onSort={handleSort} />
                    <SortableHeader col="expiry_date" label="Expiry" current={sortKey} dir={sortDir} onSort={handleSort} />
                    <TableHead>Supplier</TableHead>
                    {!readOnly && <TableHead className="w-20" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map(p => (
                    <TableRow key={p.id} className={rowClass(p, selectedIds, pendingStock)}>
                      {!readOnly && (
                        <TableCell className="pl-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(p.id)}
                            onChange={() => {
                              const next = new Set(selectedIds);
                              next.has(p.id) ? next.delete(p.id) : next.add(p.id);
                              setSelectedIds(next);
                            }}
                            className="size-4 cursor-pointer accent-primary rounded"
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell><Badge variant="secondary">{p.category}</Badge></TableCell>
                      <TableCell className="tabular-nums">{formatCurrency(p.price)}</TableCell>
                      <TableCell>
                        <StockCell
                          product={p}
                          pendingQty={pendingStock.get(p.id)?.newQty}
                          onDelta={delta => handleStockDelta(p, delta)}
                          readOnly={readOnly}
                        />
                      </TableCell>
                      <TableCell><ExpiryCell date={p.expiry_date} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.supplier || '\u2014'}</TableCell>
                      {!readOnly && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="size-7 p-0" onClick={() => openEditDialog(p)}>
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="size-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(p)}>
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    Showing {(safePage - 1) * PAGE_SIZE + 1}-
                    {Math.min(safePage * PAGE_SIZE, filteredProducts.length)} of {filteredProducts.length}
                  </p>
                  <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ══ Dialogs ══════════════════════════════════════════════════════════════ */}

      <CsvImportDialog
        open={showCsvImport}
        onOpenChange={setShowCsvImport}
        onImportComplete={refetch}
        categories={categories}
      />

      <ProductFormDialog
        open={showFormDialog}
        onOpenChange={open => { if (!open) resetForm(); }}
        editingId={editingId}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleFormSubmit}
        onReset={resetForm}
        categories={categories}
      />

      <LowStockDialog
        open={showLowStock}
        onOpenChange={setShowLowStock}
        products={lowStockProducts}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        title="Delete product"
        description={<>Delete <span className="font-medium text-foreground">{deleteTarget?.name}</span>? This cannot be undone.</>}
        onConfirm={handleDelete}
        confirmLabel="Delete"
      />

      <ConfirmDialog
        open={showBulkDelete}
        onOpenChange={setShowBulkDelete}
        title={`Delete ${selectedIds.size} product${selectedIds.size !== 1 ? 's' : ''}`}
        description={`Permanently delete ${selectedIds.size} product${selectedIds.size !== 1 ? 's' : ''}. This cannot be undone.`}
        onConfirm={handleBulkDelete}
        confirmLabel="Delete all"
      />

    </div>
  );
}

export default Inventory;
